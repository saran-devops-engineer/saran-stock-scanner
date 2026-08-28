import { NextRequest, NextResponse } from 'next/server';

interface FundamentalData {
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  bse: string;
  nse: string;
  marketCap: number;
  currentPrice: number;
  high52w: number;
  low52w: number;
  stockPE: number;
  bookValue: number;
  dividendYield: number;
  roce: number;
  roe: number;
  faceValue: number;
  pros: string[];
  cons: string[];
  quarterlyResults: { quarters: string[]; sales: number[]; opm: number[]; netProfit: number[]; eps: number[] };
  annualPL: { years: string[]; sales: number[]; netProfit: number[]; eps: number[] };
  annualEBITDA: number[];
  annualOPM: number[];
  growthRates: { salesGrowth: number[]; profitGrowth: number[]; stockCAGR: number[] };
  priceToBook: number;
  earningsYield: number;
}

function parseIndianNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[,%₹Cr]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function fetchScreenerData(symbol: string, consolidated = true): Promise<FundamentalData> {
  const url = consolidated
    ? `https://www.screener.in/company/${symbol}/consolidated/`
    : `https://www.screener.in/company/${symbol}/`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html' },
  });
  if (!resp.ok) throw new Error(`Screener.in returned ${resp.status}`);
  const html = await resp.text();

  // Company name
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const name = nameMatch ? nameMatch[1].trim() : symbol;

  // About/description
  const aboutSection = html.match(/About[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  const description = aboutSection ? aboutSection[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';

  // Sector/industry
  const sectorMatch = html.match(/Sector:\s*([^<\n]+)/i);
  const industryMatch = html.match(/Industry:\s*([^<\n]+)/i);

  // Key stats from <span class="number">
  const marketCapMatch = html.match(/Market Cap[\s\S]*?<span class="number">([\d,]+)<\/span>/);
  const priceMatch = html.match(/Current Price[\s\S]*?<span class="number">([\d,]+)<\/span>/);
  const highLowMatch = html.match(/High \/ Low[\s\S]*?<span class="number">([\d,]+)<\/span>\s*\/\s*<span class="number">([\d,]+)<\/span>/);
  const peMatch = html.match(/Stock P\/E[\s\S]*?([\d.]+)/);
  const bvMatch = html.match(/Book Value[\s\S]*?<span class="number">([\d,]+)<\/span>/);
  const dyMatch = html.match(/Dividend Yield[\s\S]*?([\d.]+)/);
  const roceMatch = html.match(/ROCE[\s\S]*?([\d.]+)/);
  const roeMatch = html.match(/ROE[\s\S]*?([\d.]+)/);
  const fvMatch = html.match(/Face Value[\s\S]*?<span class="number">([\d,]+)<\/span>/);

  const marketCap = marketCapMatch ? parseFloat(marketCapMatch[1].replace(/,/g, '')) : 0;
  const currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
  const high52w = highLowMatch ? parseFloat(highLowMatch[1].replace(/,/g, '')) : 0;
  const low52w = highLowMatch ? parseFloat(highLowMatch[2].replace(/,/g, '')) : 0;
  const stockPE = peMatch ? parseFloat(peMatch[1]) : 0;
  const bookValue = bvMatch ? parseFloat(bvMatch[1].replace(/,/g, '')) : 0;
  const dividendYield = dyMatch ? parseFloat(dyMatch[1]) : 0;
  const roce = roceMatch ? parseFloat(roceMatch[1]) : 0;
  const roe = roeMatch ? parseFloat(roeMatch[1]) : 0;
  const faceValue = fvMatch ? parseFloat(fvMatch[1].replace(/,/g, '')) : 0;

  // Pros & Cons
  const pros: string[] = [];
  const cons: string[] = [];
  const prosSection = html.match(/Pros[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
  const consSection = html.match(/Cons[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (prosSection) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = liRegex.exec(prosSection[1])) !== null) pros.push(m[1].replace(/<[^>]*>/g, '').trim());
  }
  if (consSection) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = liRegex.exec(consSection[1])) !== null) cons.push(m[1].replace(/<[^>]*>/g, '').trim());
  }

  // Website, BSE/NSE
  const websiteMatch = html.match(/href="(https?:\/\/[^"]+)"/);
  const bseMatch = html.match(/BSE:\s*(\d+)/);
  const nseMatch = html.match(/NSE:\s*([A-Z]+)/);

  // Quarterly results — find the first <table> after "Quarterly Results"
  const quarterlyResults = { quarters: [] as string[], sales: [] as number[], opm: [] as number[], netProfit: [] as number[], eps: [] as number[] };
  const qIdx = html.indexOf('Quarterly Results');
  if (qIdx > -1) {
    const qTableMatch = html.substring(qIdx).match(/<table[\s\S]*?<\/table>/);
    if (qTableMatch) {
      const qTable = qTableMatch[0];
      // Extract header row (quarter names)
      const headerMatch = qTable.match(/<thead[\s\S]*?<\/thead>/);
      if (headerMatch) {
        const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
        let m;
        while ((m = thRegex.exec(headerMatch[0])) !== null) {
          const text = m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
          if (text && !text.includes('+') && text.length > 3) quarterlyResults.quarters.push(text);
        }
      }
      // Extract data rows
      const rows = qTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
      for (const row of rows) {
        if (row.includes('<th')) continue;
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cells: string[] = [];
        let m;
        while ((m = tdRegex.exec(row)) !== null) cells.push(m[1].replace(/<[^>]*>/g, '').trim());
        if (cells.length < 2) continue;
        const label = cells[0].toLowerCase();
        const values = cells.slice(1).map(parseIndianNumber);
        if (label.includes('sales') && !label.includes('growth')) quarterlyResults.sales = values;
        if (label.includes('opm')) quarterlyResults.opm = values;
        if (label.includes('net profit') && !label.includes('growth')) quarterlyResults.netProfit = values;
        if (label.includes('eps')) quarterlyResults.eps = values;
      }
    }
  }

  // Ranges tables (Compounded Sales Growth, Profit Growth, Stock Price CAGR)
  const growthRates = { salesGrowth: [] as number[], profitGrowth: [] as number[], stockCAGR: [] as number[] };
  const rangesTables = html.match(/class="ranges-table"[\s\S]*?<\/table>/g) || [];
  for (const table of rangesTables) {
    const text = table.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const values = [...text.matchAll(/(\d+)%/g)].map(m => parseFloat(m[1]));
    if (text.includes('Sales Growth')) growthRates.salesGrowth = values;
    else if (text.includes('Profit Growth')) growthRates.profitGrowth = values;
    else if (text.includes('Stock Price CAGR') || text.includes('Stock CAGR')) growthRates.stockCAGR = values;
  }

  // Extract annual P&L from the "Profit & Loss" section (official annual data)
  const annualPL = { years: [] as string[], sales: [] as number[], operatingProfit: [] as number[], netProfit: [] as number[], eps: [] as number[] };
  // Find the actual P&L table by looking for "Mar 2015" or "Mar 2016" year headers
  const plTableIdx = html.indexOf('Mar 2015');
  const plTableIdx2 = html.indexOf('Mar 2016');
  const plSearchIdx = plTableIdx > -1 ? plTableIdx : plTableIdx2;
  if (plSearchIdx > -1) {
    let tableStart = html.lastIndexOf('<table', plSearchIdx);
    if (tableStart > -1) {
      const tableEnd = html.indexOf('</table>', tableStart);
      const plTable = html.substring(tableStart, tableEnd + 8);
      // Extract header row — only keep "Mar YYYY" labels, skip TTM
      const headerMatch = plTable.match(/<thead[\s\S]*?<\/thead>/);
      if (headerMatch) {
        const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
        let m;
        while ((m = thRegex.exec(headerMatch[0])) !== null) {
          const text = m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
          if (text && text.match(/Mar\s+\d{4}/)) annualPL.years.push(text);
        }
      }
      const yearCount = annualPL.years.length;
      // Extract data rows — only take `yearCount` values (skip TTM column)
      const rows = plTable.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
      for (const row of rows) {
        if (row.includes('<th')) continue;
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cells: string[] = [];
        let m;
        while ((m = tdRegex.exec(row)) !== null) cells.push(m[1].replace(/<[^>]*>/g, '').trim());
        if (cells.length < 2) continue;
        const label = cells[0].toLowerCase();
        const allValues = cells.slice(1).map(parseIndianNumber);
        const values = allValues.slice(0, yearCount); // Skip TTM
        if (label.includes('sales') && !label.includes('growth')) annualPL.sales = values;
        if (label.includes('operating profit')) annualPL.operatingProfit = values;
        if (label.includes('net profit') && !label.includes('growth')) annualPL.netProfit = values;
        if (label.includes('eps in rs') || label === 'eps') annualPL.eps = values;
      }
    }
  }

  // Fallback: derive from quarterly if annual extraction failed
  if (annualPL.years.length === 0 && quarterlyResults.quarters.length >= 4) {
    const fyMap: Record<string, { sales: number; profit: number; eps: number; count: number }> = {};
    for (let i = 0; i < quarterlyResults.quarters.length; i++) {
      const q = quarterlyResults.quarters[i];
      const m = q.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/);
      if (!m) continue;
      const month = m[1]; const year = parseInt(m[2]);
      const fyYear = (month === 'Jan' || month === 'Feb' || month === 'Mar') ? year : year + 1;
      const fy = 'FY' + fyYear;
      if (!fyMap[fy]) fyMap[fy] = { sales: 0, profit: 0, eps: 0, count: 0 };
      fyMap[fy].sales += quarterlyResults.sales[i] || 0;
      fyMap[fy].profit += quarterlyResults.netProfit[i] || 0;
      fyMap[fy].eps += quarterlyResults.eps[i] || 0;
      fyMap[fy].count++;
    }
    const fys = Object.keys(fyMap).sort().reverse();
    for (const fy of fys) {
      if (fyMap[fy].count >= 4) {
        annualPL.years.push(fy);
        annualPL.sales.push(Math.round(fyMap[fy].sales));
        annualPL.netProfit.push(Math.round(fyMap[fy].profit));
        annualPL.eps.push(Math.round(fyMap[fy].eps * 100) / 100);
      }
    }
  }

  // Derived metrics
  const priceToBook = bookValue > 0 ? currentPrice / bookValue : 0;
  const earningsYield = stockPE > 0 ? (1 / stockPE) * 100 : 0;

  // Use Operating Profit from annual P&L as EBITDA (Screener's Operating Profit = EBITDA)
  const annualEBITDA = annualPL.operatingProfit.length > 0 ? annualPL.operatingProfit : [];
  const annualOPM: number[] = [];
  for (let i = 0; i < annualPL.years.length; i++) {
    if (annualPL.sales[i] > 0 && annualEBITDA[i]) {
      annualOPM.push(Math.round((annualEBITDA[i] / annualPL.sales[i]) * 1000) / 10);
    } else {
      annualOPM.push(0);
    }
  }

  return {
    name,
    sector: sectorMatch ? sectorMatch[1].trim() : '',
    industry: industryMatch ? industryMatch[1].trim() : '',
    description,
    website: websiteMatch ? websiteMatch[1] : '',
    bse: bseMatch ? bseMatch[1] : '',
    nse: nseMatch ? nseMatch[1] : '',
    marketCap, currentPrice, high52w, low52w, stockPE, bookValue,
    dividendYield, roce, roe, faceValue,
    pros, cons,
    quarterlyResults, annualPL, growthRates,
    annualEBITDA, annualOPM,
    priceToBook, earningsYield,
  };
}

function computeScore(data: FundamentalData) {
  const scores: Record<string, number> = {};

  // Business Quality (0-10)
  let bq = 5;
  if (data.marketCap > 50000) bq += 2;
  else if (data.marketCap > 10000) bq += 1;
  if (data.cons.length <= 2) bq += 1;
  if (data.pros.length >= 2) bq += 1;
  if (data.description.length > 100) bq += 1;
  scores['Business Quality'] = Math.min(10, bq);

  // Revenue Growth (0-10) from ranges-table
  let rg = 5;
  if (data.growthRates.salesGrowth.length > 0) {
    // [10yr, 5yr, 3yr, TTM]
    const fiveYr = data.growthRates.salesGrowth[1] || data.growthRates.salesGrowth[0] || 0;
    if (fiveYr > 20) rg = 10;
    else if (fiveYr > 15) rg = 9;
    else if (fiveYr > 10) rg = 8;
    else if (fiveYr > 5) rg = 7;
    else if (fiveYr > 0) rg = 5;
    else rg = 3;
  }
  scores['Revenue Growth'] = rg;

  // Profitability (0-10)
  let prof = 5;
  if (data.roe > 20) prof = 10;
  else if (data.roe > 15) prof = 8;
  else if (data.roe > 12) prof = 7;
  else if (data.roe > 8) prof = 6;
  else if (data.roe > 5) prof = 5;
  else prof = 3;
  scores['Profitability'] = prof;

  // Balance Sheet (0-10) — approximate from ROCE
  let bs = 5;
  if (data.roce > 25) bs = 9;
  else if (data.roce > 20) bs = 8;
  else if (data.roce > 15) bs = 7;
  else if (data.roce > 12) bs = 6;
  else if (data.roce > 8) bs = 5;
  else bs = 3;
  scores['Balance Sheet'] = Math.min(10, bs);

  // Return Ratios (0-10)
  let rr = 5;
  if (data.roce > 25) rr = 10;
  else if (data.roce > 20) rr = 9;
  else if (data.roce > 15) rr = 8;
  else if (data.roce > 12) rr = 7;
  else if (data.roce > 8) rr = 5;
  else rr = 3;
  scores['Return Ratios'] = rr;

  // Management (0-10)
  let mgmt = 5;
  if (data.cons.some(c => c.toLowerCase().includes('promoter holding decreased'))) mgmt -= 1;
  if (data.dividendYield > 1) mgmt += 1;
  if (data.pros.some(p => p.toLowerCase().includes('dividend payout'))) mgmt += 1;
  scores['Management'] = Math.max(1, Math.min(10, mgmt));

  // Valuation (0-10)
  let val = 5;
  if (data.stockPE < 15) val = 10;
  else if (data.stockPE < 20) val = 8;
  else if (data.stockPE < 30) val = 6;
  else if (data.stockPE < 40) val = 5;
  else if (data.stockPE < 60) val = 4;
  else val = 3;
  scores['Valuation'] = val;

  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 10) / 10;

  // Strengths
  const strengths: string[] = [];
  if (data.roce > 15) strengths.push(`Strong ROCE of ${data.roce}%`);
  if (data.roe > 12) strengths.push(`Healthy ROE of ${data.roe}%`);
  if (data.dividendYield > 1) strengths.push(`Good dividend yield of ${data.dividendYield}%`);
  if (data.marketCap > 10000) strengths.push(`Market leader with ₹${data.marketCap} Cr market cap`);
  if (data.growthRates.profitGrowth.length > 0 && data.growthRates.profitGrowth[1] > 20) {
    strengths.push(`Strong profit growth of ${data.growthRates.profitGrowth[1]}% CAGR over 5 years`);
  }
  if (data.pros.length > 0) strengths.push(...data.pros.slice(0, 2));

  // Risks
  const risks: string[] = [];
  if (data.stockPE > 50) risks.push(`Premium valuation with P/E of ${data.stockPE}x`);
  if (data.cons.length > 0) risks.push(...data.cons.slice(0, 2));
  if (data.roe < 8) risks.push(`Low ROE of ${data.roe}%`);
  if (data.growthRates.salesGrowth.length > 0 && data.growthRates.salesGrowth[1] < 5) {
    risks.push(`Slow sales growth of ${data.growthRates.salesGrowth[1]}% over 5 years`);
  }

  // Growth Catalysts
  const growthCatalysts: string[] = [];
  if (data.growthRates.profitGrowth.length > 0) {
    growthCatalysts.push(`Profit CAGR: ${data.growthRates.profitGrowth[1]}% (5Y)`);
  }
  if (data.growthRates.salesGrowth.length > 0) {
    growthCatalysts.push(`Revenue CAGR: ${data.growthRates.salesGrowth[1]}% (5Y)`);
  }
  if (data.description.length > 50) growthCatalysts.push(data.description.substring(0, 100) + '...');

  // Bull & Bear
  const bullCase = data.roe > 12 && data.growthRates.profitGrowth[1] > 20
    ? `Strong ROE ${data.roe}% with ${data.growthRates.profitGrowth[1]}% profit CAGR. If growth sustains, stock can deliver 15-25% CAGR.`
    : `Improving financials with growth potential. If margins expand, significant rerating possible.`;
  const bearCase = data.cons.length > 0
    ? data.cons.slice(0, 2).join('; ') + '. Monitor execution risks.'
    : 'Valuation risk if growth slows. Watch for margin pressures.';

  // Verdict
  let verdict = '';
  if (overall >= 8) verdict = `${data.name} is fundamentally strong with excellent metrics and growth trajectory.`;
  else if (overall >= 6.5) verdict = `${data.name} has solid fundamentals. Growth and profitability look attractive at current valuation.`;
  else if (overall >= 5) verdict = `${data.name} shows mixed signals. Some metrics are strong but areas need monitoring.`;
  else verdict = `${data.name} has weak fundamentals. Invest with caution.`;

  return { overall, breakdown: scores, strengths, risks, growthCatalysts, bullCase, bearCase, verdict };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  const consolidated = searchParams.get('consolidated') !== 'false'; // default true

  try {
    const data = await fetchScreenerData(symbol.toUpperCase(), consolidated);
    const analysis = computeScore(data);
    return NextResponse.json({ ...data, analysis });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
