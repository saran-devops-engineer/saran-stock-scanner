'use client';

import { useState, useEffect, useRef } from 'react';

interface StockInfo { symbol: string; name: string; }

const ALL_STOCKS: StockInfo[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd" }, { symbol: "TCS", name: "Tata Consultancy Services Ltd" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd" }, { symbol: "INFY", name: "Infosys Ltd" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd" }, { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" },
  { symbol: "ITC", name: "ITC Ltd" }, { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd" }, { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd" },
  { symbol: "LT", name: "Larsen & Toubro Ltd" }, { symbol: "AXISBANK", name: "Axis Bank Ltd" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" }, { symbol: "ASIANPAINT", name: "Asian Paints Ltd" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd" }, { symbol: "MARUTI", name: "Maruti Suzuki India Ltd" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd" }, { symbol: "TATAMOTORS", name: "Tata Motors Ltd" },
  { symbol: "WIPRO", name: "Wipro Ltd" }, { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation Ltd" }, { symbol: "NTPC", name: "NTPC Ltd" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd" }, { symbol: "TITAN", name: "Titan Company Ltd" },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd" }, { symbol: "TATASTEEL", name: "Tata Steel Ltd" },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd" }, { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd" },
  { symbol: "COALINDIA", name: "Coal India Ltd" }, { symbol: "TECHM", name: "Tech Mahindra Ltd" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd" }, { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd" },
  { symbol: "CIPLA", name: "Cipla Ltd" }, { symbol: "EICHERMOT", name: "Eicher Motors Ltd" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd" }, { symbol: "BRITANNIA", name: "Britannia Industries Ltd" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd" }, { symbol: "NESTLEIND", name: "Nestle India Ltd" },
  { symbol: "TRENT", name: "Trent Ltd" }, { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd" }, { symbol: "GRASIM", name: "Grasim Industries Ltd" },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd" }, { symbol: "BEL", name: "Bharat Electronics Ltd" },
  { symbol: "LTIM", name: "LTIMindtree Ltd" }, { symbol: "PIDILITIND", name: "Pidilite Industries Ltd" },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd" }, { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd" },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company Ltd" }, { symbol: "PNB", name: "Punjab National Bank" },
  { symbol: "CANBK", name: "Canara Bank" }, { symbol: "IOB", name: "Indian Overseas Bank" },
  { symbol: "BANKINDIA", name: "Bank of India" }, { symbol: "UNIONBANK", name: "Union Bank of India" },
  { symbol: "CENTRALBK", name: "Central Bank of India" }, { symbol: "IDBI", name: "IDBI Bank Ltd" },
  { symbol: "BANKBARODA", name: "Bank of Baroda" }, { symbol: "INDIANB", name: "Indian Bank" },
  { symbol: "UCO", name: "UCO Bank" }, { symbol: "MELAROSSA", name: "Mela Roses Ltd" },
  { symbol: "MIDHANI", name: "Mishra Dhatu Nigam Ltd" }, { symbol: "CDSL", name: "Central Depository Services Ltd" },
  { symbol: "CAMS", name: "Computer Age Management Services Ltd" }, { symbol: "TIMETECHNO", name: "Time Technoplast Ltd" },
  { symbol: "MANAPPURAM", name: "Manappuram Finance Ltd" }, { symbol: "MUTHOOTFIN", name: "Muthoot Finance Ltd" },
  { symbol: "BAJAJHLDNG", name: "Bajaj Holdings & Investment Ltd" }, { symbol: "SHRIRAMFIN", name: "Shriram Finance Ltd" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment and Finance Company Ltd" }, { symbol: "SBICARD", name: "SBI Cards and Payment Services Ltd" },
  { symbol: "HDFCAMC", name: "HDFC Asset Management Company Ltd" }, { symbol: "ICICIPRULI", name: "ICICI Prudential Life Insurance Company Ltd" },
  { symbol: "STARHEALTH", name: "Star Health and Allied Insurance Company Ltd" }, { symbol: "NAUKRI", name: "Info Edge (India) Ltd" },
  { symbol: "ZOMATO", name: "Zomato Ltd" }, { symbol: "PAYTM", name: "One97 Communications Ltd" },
  { symbol: "POLICYBZR", name: "PB Fintech Ltd" }, { symbol: "DELHIVERY", name: "Delhivery Ltd" },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures Ltd" }, { symbol: "DMART", name: "Avenue Supermarts Ltd" },
  { symbol: "TATACHEM", name: "Tata Chemicals Ltd" }, { symbol: "TATAPOWER", name: "Tata Power Company Ltd" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" }, { symbol: "TATAINVEST", name: "Tata Investment Corporation Ltd" },
  { symbol: "TATACommunications", name: "Tata Communications Ltd" }, { symbol: "INDIANENERGY", name: "Indian Energy Exchange Ltd" },
  { symbol: "IIFL", name: "IIFL Finance Ltd" }, { symbol: "CHAMBLFERT", name: "Chambal Fertilisers and Chemicals Ltd" },
  { symbol: "DEEPAKNTR", name: "Deepak Nitrite Ltd" }, { symbol: "ATUL", name: "Atul Ltd" },
  { symbol: "NAVINFLUOR", name: "Navin Fluorine International Ltd" }, { symbol: "SRF", name: "SRF Ltd" },
  { symbol: "CHEMPLASTS", name: "Chemplast Sanmar Ltd" }, { symbol: "LXCHEM", name: "Laxmi Organic Industries Ltd" },
  { symbol: "FLUOROCHEM", name: "Gujarat Fluorochemicals Ltd" }, { symbol: "BALRAMCHIN", name: "Balrampur Chini Mills Ltd" },
  { symbol: "DALBHARAT", name: "Dalmia Bharat Ltd" }, { symbol: "ACC", name: "ACC Ltd" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements Ltd" }, { symbol: "HEIDELBERG", name: "HeidelbergCement India Ltd" },
  { symbol: "JKCEMENT", name: "JK Cement Ltd" }, { symbol: "SHREECEM", name: "Shree Cement Ltd" },
  { symbol: "RAMCOCEM", name: "The Ramco Cements Ltd" }, { symbol: "BIRLACORP", name: "Birla Corporation Ltd" },
  { symbol: "NATIONALUM", name: "National Aluminium Company Ltd" }, { symbol: "HINDZINC", name: "Hindustan Zinc Ltd" },
  { symbol: "VEDL", name: "Vedanta Ltd" }, { symbol: "NMDC", name: "NMDC Ltd" },
  { symbol: "MOIL", name: "MOIL Ltd" }, { symbol: "SAIL", name: "Steel Authority of India Ltd" },
  { symbol: "JINDALSTEL", name: "Jindal Steel and Power Ltd" }, { symbol: "JSL", name: "Jindal Stainless Ltd" },
  { symbol: "APLAPOLLO", name: "APL Apollo Tubes Ltd" }, { symbol: "NATIONALSTEEL", name: "National Steel and Agro Industries Ltd" },
  { symbol: "MIDHANI", name: "Mishra Dhatu Nigam Ltd" }, { symbol: "BEL", name: "Bharat Electronics Ltd" },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd" }, { symbol: "MAZAGONDOCK", name: "Mazagon Dock Shipbuilders Ltd" },
  { symbol: "COCHINSHIP", name: "Cochin Shipyard Ltd" }, { symbol: "GRSE", name: "Garden Reach Shipbuilders & Engineers Ltd" },
  { symbol: "BSNL", name: "Bharat Sanchar Nigam Ltd" }, { symbol: "RAILTEL", name: "RailTel Corporation of India Ltd" },
  { symbol: "IRFC", name: "Indian Railway Finance Corporation Ltd" }, { symbol: "RECLTD", name: "Rural Electrification Corporation Ltd" },
  { symbol: "PFC", name: "Power Finance Corporation Ltd" }, { symbol: "IREDA", name: "Indian Renewable Energy Development Agency Ltd" },
  { symbol: "NHPC", name: "NHPC Ltd" }, { symbol: "SJVN", name: "SJVN Ltd" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" }, { symbol: "PERSISTENT", name: "Persistent Systems Ltd" },
  { symbol: "COFORGE", name: "Coforge Ltd" }, { symbol: "MPHASIS", name: "Mphasis Ltd" },
  { symbol: "LTIM", name: "LTIMindtree Ltd" }, { symbol: "SONATSOFTW", name: "Sonata Software Ltd" },
  { symbol: "BSOFT", name: "Birlasoft Ltd" }, { symbol: "KPITTECH", name: "KPIT Technologies Ltd" },
  { symbol: "CYIENT", name: "Cyient Ltd" }, { symbol: "ZENTEC", name: "Zensar Technologies Ltd" },
  { symbol: "HEMIPROP", name: "Hemisphere Properties India Ltd" }, { symbol: "OBEROIRLTY", name: "Oberoi Realty Ltd" },
  { symbol: "GODREJPROP", name: "Godrej Properties Ltd" }, { symbol: "DLF", name: "DLF Ltd" },
  { symbol: "BRIGADE", name: "Brigade Enterprises Ltd" }, { symbol: "PRESTIGE", name: "Prestige Estates Projects Ltd" },
  { symbol: "PHOENIXLTD", name: "The Phoenix Mills Ltd" }, { symbol: "LODHA", name: "Macrotech Developers Ltd" },
  { symbol: "SUNTV", name: "Sun TV Network Ltd" }, { symbol: "PVRINOX", name: "PVR Inox Ltd" },
  { symbol: "TANLA", name: "Tanla Platforms Ltd" }, { symbol: "ROUTE", name: "Route Mobile Ltd" },
  { symbol: "IDEAFORGE", name: "Ideaforge Technology Ltd" }, { symbol: "NETWEB", name: "Netweb Technologies India Ltd" },
  { symbol: "KAYNES", name: "Kaynes Technology India Ltd" }, { symbol: "BEL", name: "Bharat Electronics Ltd" },
  { symbol: "SYRMA", name: "Syrma SGS Technology Ltd" }, { symbol: "DIXON", name: "Dixon Technologies (India) Ltd" },
  { symbol: "VOLTAS", name: "Voltas Ltd" }, { symbol: "BLUESTARCO", name: "Blue Star Ltd" },
  { symbol: "CROMPTON", name: "Crompton Greaves Consumer Electricals Ltd" }, { symbol: "HAVELLS", name: "Havells India Ltd" },
  { symbol: "POLYCAB", name: "Polycab India Ltd" }, { symbol: "KEI", name: "KEI Industries Ltd" },
  { symbol: "BECTORFOOD", name: "Mrs. Bectors Food Specialities Ltd" }, { symbol: "BRITANNIA", name: "Britannia Industries Ltd" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd" }, { symbol: "VADILAL", name: "Vadilal Industries Ltd" },
  { symbol: "AMARAJABAT", name: "Amara Raja Energy & Mobility Ltd" }, { symbol: "EXIDEIND", name: "Exide Industries Ltd" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" }, { symbol: "ZFCVINDIA", name: "ZF Commercial Vehicle Control Systems India Ltd" },
  { symbol: "SONACOMS", name: "Sona BLW Precision Forgings Ltd" }, { symbol: "MOTHERSON", name: "Motherson Sumi Systems Ltd" },
  { symbol: "BALKRISIND", name: "Balkrishna Industries Ltd" }, { symbol: "MRF", name: "MRF Ltd" },
  { symbol: "APOLLOTYRE", name: "Apollo Tyres Ltd" }, { symbol: "JKTYRE", name: "JK Tyre & Industries Ltd" },
  { symbol: "CEATLTD", name: "CEAT Ltd" }, { symbol: "ASHOKLEY", name: "Ashok Leyland Ltd" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd" }, { symbol: "M&M", name: "Mahindra & Mahindra Ltd" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd" }, { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd" },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd" }, { symbol: "TVSMOTOR", name: "TVS Motor Company Ltd" },
  { symbol: "MOTHERSON", name: "Motherson Sumi Systems Ltd" }, { symbol: "SCHAEFFLER", name: "Schaeffler India Ltd" },
  { symbol: "TIMKEN", name: "Timken India Ltd" }, { symbol: "SKFINDIA", name: "SKF India Ltd" },
  { symbol: "THERMAX", name: "Thermax Ltd" }, { symbol: "CUMMINSIND", name: "Cummins India Ltd" },
  { symbol: "TATACOMM", name: "Tata Communications Ltd" }, { symbol: "INDUSTOWER", name: "Indus Towers Ltd" },
  { symbol: "IDEA", name: "Vodafone Idea Ltd" }, { symbol: "JIO", name: "Jio Platforms Ltd" },
  { symbol: "GPPL", name: "Gujarat Pipavav Port Ltd" }, { symbol: "DELHIVERY", name: "Delhivery Ltd" },
  { symbol: "CONCOR", name: "Container Corporation of India Ltd" }, { symbol: "TTML", name: "Tata Teleservices (Maharashtra) Ltd" },
  { symbol: "BHEL", name: "Bharat Heavy Electricals Ltd" }, { symbol: "CGPOWER", name: "CG Power and Industrial Solutions Ltd" },
  { symbol: "THERMAX", name: "Thermax Ltd" }, { symbol: "TATACOMM", name: "Tata Communications Ltd" },
  { symbol: "BSNL", name: "Bharat Sanchar Nigam Ltd" }, { symbol: "RAILTEL", name: "RailTel Corporation of India Ltd" },
  { symbol: "IRFC", name: "Indian Railway Finance Corporation Ltd" }, { symbol: "RECLTD", name: "Rural Electrification Corporation Ltd" },
  { symbol: "PFC", name: "Power Finance Corporation Ltd" }, { symbol: "IREDA", name: "Indian Renewable Energy Development Agency Ltd" },
  { symbol: "NHPC", name: "NHPC Ltd" }, { symbol: "SJVN", name: "SJVN Ltd" },
  { symbol: "NTPC", name: "NTPC Ltd" }, { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd" },
  { symbol: "TATAPOWER", name: "Tata Power Company Ltd" }, { symbol: "ADANIGREEN", name: "Adani Green Energy Ltd" },
  { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd" }, { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd" },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd" }, { symbol: "NESTLEIND", name: "Nestle India Ltd" },
  { symbol: "ITC", name: "ITC Ltd" }, { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" },
  { symbol: "DABUR", name: "Dabur India Ltd" }, { symbol: "MARICO", name: "Marico Ltd" },
  { symbol: "COLPAL", name: "Colgate-Palmolive (India) Ltd" }, { symbol: "EMAMILTD", name: "Emami Ltd" },
  { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd" }, { symbol: "VSTIND", name: "VST Industries Ltd" },
  { symbol: "GODREJIND", name: "Godrej Industries Ltd" }, { symbol: "PGHH", name: "Procter & Gamble Health Ltd" },
  { symbol: "SANOFI", name: "Sanofi India Ltd" }, { symbol: "GSKCONS", name: "GlaxoSmithKline Pharmaceuticals Ltd" },
  { symbol: "ABBOTINDIA", name: "Abbott India Ltd" }, { symbol: "ALKEM", name: "Alkem Laboratories Ltd" },
  { symbol: "IPCALAB", name: "IPCA Laboratories Ltd" }, { symbol: "LAURUSLABS", name: "Laurus Labs Ltd" },
  { symbol: "GRANULES", name: "Granules India Ltd" }, { symbol: "NATCOPHARM", name: "Natco Pharma Ltd" },
  { symbol: "LUPIN", name: "Lupin Ltd" }, { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd" },
  { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Ltd" }, { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd" },
  { symbol: "GLENMARK", name: "Glenmark Pharmaceuticals Ltd" }, { symbol: "MCX", name: "Multi Commodity Exchange of India Ltd" },
  { symbol: "CAMS", name: "Computer Age Management Services Ltd" }, { symbol: "CDSL", name: "Central Depository Services Ltd" },
  { symbol: "BSOFT", name: "Birlasoft Ltd" }, { symbol: "MPHASIS", name: "Mphasis Ltd" },
  { symbol: "COFORGE", name: "Coforge Ltd" }, { symbol: "PERSISTENT", name: "Persistent Systems Ltd" },
  { symbol: "LTTS", name: "L&T Technology Services Ltd" }, { symbol: "HAPPSTMNDS", name: "Happiest Minds Technologies Ltd" },
  { symbol: "KPITTECH", name: "KPIT Technologies Ltd" }, { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" },
  { symbol: "ZENTEC", name: "Zensar Technologies Ltd" }, { symbol: "SONATSOFTW", name: "Sonata Software Ltd" },
  { symbol: "CYIENT", name: "Cyient Ltd" }, { symbol: "DATAPATTNS", name: "Data Patterns (India) Ltd" },
  { symbol: "BEL", name: "Bharat Electronics Ltd" }, { symbol: "HAL", name: "Hindustan Aeronautics Ltd" },
  { symbol: "MAZAGONDOCK", name: "Mazagon Dock Shipbuilders Ltd" }, { symbol: "COCHINSHIP", name: "Cochin Shipyard Ltd" },
  { symbol: "GRSE", name: "Garden Reach Shipbuilders & Engineers Ltd" }, { symbol: "PARASDEFENCE", name: "Paras Defence and Space Technologies Ltd" },
  { symbol: "MAHLOGISTICS", name: "Maharashtra Corp Ltd" }, { symbol: "CAMPUS", name: "Campus Activewear Ltd" },
  { symbol: "METROBRAND", name: "Metro Brands Ltd" }, { symbol: "MEDPLUS", name: "MedPlus Health Services Ltd" },
  { symbol: "POLICYBZR", name: "PB Fintech Ltd" }, { symbol: "PAYTM", name: "One97 Communications Ltd" },
  { symbol: "ZOMATO", name: "Zomato Ltd" }, { symbol: "DELHIVERY", name: "Delhivery Ltd" },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures Ltd" }, { symbol: "DMART", name: "Avenue Supermarts Ltd" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd" }, { symbol: "BRITANNIA", name: "Britannia Industries Ltd" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd" }, { symbol: "VADILAL", name: "Vadilal Industries Ltd" },
  { symbol: "GODREJAGRO", name: "Godrej Agrovet Ltd" }, { symbol: "EMAMILTD", name: "Emami Ltd" },
  { symbol: "DABUR", name: "Dabur India Ltd" }, { symbol: "MARICO", name: "Marico Ltd" },
  { symbol: "COLPAL", name: "Colgate-Palmolive (India) Ltd" }, { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd" },
  { symbol: "PGHH", name: "Procter & Gamble Health Ltd" }, { symbol: "SANOFI", name: "Sanofi India Ltd" },
  { symbol: "GSKCONS", name: "GlaxoSmithKline Pharmaceuticals Ltd" }, { symbol: "ABBOTINDIA", name: "Abbott India Ltd" },
  { symbol: "ALKEM", name: "Alkem Laboratories Ltd" }, { symbol: "IPCALAB", name: "IPCA Laboratories Ltd" },
  { symbol: "LAURUSLABS", name: "Laurus Labs Ltd" }, { symbol: "GRANULES", name: "Granules India Ltd" },
  { symbol: "NATCOPHARM", name: "Natco Pharma Ltd" }, { symbol: "LUPIN", name: "Lupin Ltd" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd" }, { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Ltd" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd" }, { symbol: "GLENMARK", name: "Glenmark Pharmaceuticals Ltd" },
  { symbol: "MCX", name: "Multi Commodity Exchange of India Ltd" }, { symbol: "CAMS", name: "Computer Age Management Services Ltd" },
  { symbol: "CDSL", name: "Central Depository Services Ltd" }, { symbol: "BSOFT", name: "Birlasoft Ltd" },
  { symbol: "MPHASIS", name: "Mphasis Ltd" }, { symbol: "COFORGE", name: "Coforge Ltd" },
  { symbol: "PERSISTENT", name: "Persistent Systems Ltd" }, { symbol: "LTTS", name: "L&T Technology Services Ltd" },
  { symbol: "HAPPSTMNDS", name: "Happiest Minds Technologies Ltd" }, { symbol: "KPITTECH", name: "KPIT Technologies Ltd" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" }, { symbol: "ZENTEC", name: "Zensar Technologies Ltd" },
  { symbol: "SONATSOFTW", name: "Sonata Software Ltd" }, { symbol: "CYIENT", name: "Cyient Ltd" },
  { symbol: "DATAPATTNS", name: "Data Patterns (India) Ltd" }, { symbol: "BEL", name: "Bharat Electronics Ltd" },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd" }, { symbol: "MAZAGONDOCK", name: "Mazagon Dock Shipbuilders Ltd" },
  { symbol: "COCHINSHIP", name: "Cochin Shipyard Ltd" }, { symbol: "GRSE", name: "Garden Reach Shipbuilders & Engineers Ltd" },
  { symbol: "PARASDEFENCE", name: "Paras Defence and Space Technologies Ltd" }, { symbol: "TANLA", name: "Tanla Platforms Ltd" },
  { symbol: "ROUTE", name: "Route Mobile Ltd" }, { symbol: "IDEAFORGE", name: "Ideaforge Technology Ltd" },
  { symbol: "NETWEB", name: "Netweb Technologies India Ltd" }, { symbol: "KAYNES", name: "Kaynes Technology India Ltd" },
  { symbol: "SYRMA", name: "Syrma SGS Technology Ltd" }, { symbol: "DIXON", name: "Dixon Technologies (India) Ltd" },
  { symbol: "VOLTAS", name: "Voltas Ltd" }, { symbol: "BLUESTARCO", name: "Blue Star Ltd" },
  { symbol: "CROMPTON", name: "Crompton Greaves Consumer Electricals Ltd" }, { symbol: "HAVELLS", name: "Havells India Ltd" },
  { symbol: "POLYCAB", name: "Polycab India Ltd" }, { symbol: "KEI", name: "KEI Industries Ltd" },
  { symbol: "BECTORFOOD", name: "Mrs. Bectors Food Specialities Ltd" }, { symbol: "AMARAJABAT", name: "Amara Raja Energy & Mobility Ltd" },
  { symbol: "EXIDEIND", name: "Exide Industries Ltd" }, { symbol: "ZFCVINDIA", name: "ZF Commercial Vehicle Control Systems India Ltd" },
  { symbol: "SONACOMS", name: "Sona BLW Precision Forgings Ltd" }, { symbol: "MOTHERSON", name: "Motherson Sumi Systems Ltd" },
  { symbol: "BALKRISIND", name: "Balkrishna Industries Ltd" }, { symbol: "MRF", name: "MRF Ltd" },
  { symbol: "APOLLOTYRE", name: "Apollo Tyres Ltd" }, { symbol: "JKTYRE", name: "JK Tyre & Industries Ltd" },
  { symbol: "CEATLTD", name: "CEAT Ltd" }, { symbol: "ASHOKLEY", name: "Ashok Leyland Ltd" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd" }, { symbol: "M&M", name: "Mahindra & Mahindra Ltd" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd" }, { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd" },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd" }, { symbol: "TVSMOTOR", name: "TVS Motor Company Ltd" },
  { symbol: "SCHAEFFLER", name: "Schaeffler India Ltd" }, { symbol: "TIMKEN", name: "Timken India Ltd" },
  { symbol: "SKFINDIA", name: "SKF India Ltd" }, { symbol: "THERMAX", name: "Thermax Ltd" },
  { symbol: "CUMMINSIND", name: "Cummins India Ltd" }, { symbol: "TATACOMM", name: "Tata Communications Ltd" },
  { symbol: "INDUSTOWER", name: "Indus Towers Ltd" }, { symbol: "IDEA", name: "Vodafone Idea Ltd" },
  { symbol: "GPPL", name: "Gujarat Pipavav Port Ltd" }, { symbol: "CONCOR", name: "Container Corporation of India Ltd" },
  { symbol: "TTML", name: "Tata Teleservices (Maharashtra) Ltd" }, { symbol: "BHEL", name: "Bharat Heavy Electricals Ltd" },
  { symbol: "CGPOWER", name: "CG Power and Industrial Solutions Ltd" }, { symbol: "INDIGOPNTS", name: "Indigo Paints Ltd" },
  { symbol: "BERGEPAINT", name: "Berger Paints India Ltd" }, { symbol: "KANSAINER", name: "Kansai Nerolac Paints Ltd" },
  { symbol: "TIINDIA", name: "Tube Investments of India Ltd" }, { symbol: "MIDHANI", name: "Mishra Dhatu Nigam Ltd" },
  { symbol: "RAILTEL", name: "RailTel Corporation of India Ltd" }, { symbol: "IRFC", name: "Indian Railway Finance Corporation Ltd" },
  { symbol: "RECLTD", name: "Rural Electrification Corporation Ltd" }, { symbol: "PFC", name: "Power Finance Corporation Ltd" },
  { symbol: "IREDA", name: "Indian Renewable Energy Development Agency Ltd" }, { symbol: "NHPC", name: "NHPC Ltd" },
  { symbol: "SJVN", name: "SJVN Ltd" }, { symbol: "NTPC", name: "NTPC Ltd" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd" }, { symbol: "TATAPOWER", name: "Tata Power Company Ltd" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy Ltd" }, { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd" }, { symbol: "BRITANNIA", name: "Britannia Industries Ltd" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd" }, { symbol: "ITC", name: "ITC Ltd" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" }, { symbol: "DABUR", name: "Dabur India Ltd" },
  { symbol: "MARICO", name: "Marico Ltd" }, { symbol: "COLPAL", name: "Colgate-Palmolive (India) Ltd" },
  { symbol: "EMAMILTD", name: "Emami Ltd" }, { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd" },
  { symbol: "VSTIND", name: "VST Industries Ltd" }, { symbol: "GODREJIND", name: "Godrej Industries Ltd" },
  { symbol: "PGHH", name: "Procter & Gamble Health Ltd" }, { symbol: "SANOFI", name: "Sanofi India Ltd" },
  { symbol: "GSKCONS", name: "GlaxoSmithKline Pharmaceuticals Ltd" }, { symbol: "ABBOTINDIA", name: "Abbott India Ltd" },
  { symbol: "ALKEM", name: "Alkem Laboratories Ltd" }, { symbol: "IPCALAB", name: "IPCA Laboratories Ltd" },
  { symbol: "LAURUSLABS", name: "Laurus Labs Ltd" }, { symbol: "GRANULES", name: "Granules India Ltd" },
  { symbol: "NATCOPHARM", name: "Natco Pharma Ltd" }, { symbol: "LUPIN", name: "Lupin Ltd" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd" }, { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Ltd" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd" }, { symbol: "GLENMARK", name: "Glenmark Pharmaceuticals Ltd" },
  { symbol: "MCX", name: "Multi Commodity Exchange of India Ltd" }, { symbol: "CAMS", name: "Computer Age Management Services Ltd" },
  { symbol: "CDSL", name: "Central Depository Services Ltd" }, { symbol: "BSOFT", name: "Birlasoft Ltd" },
  { symbol: "MPHASIS", name: "Mphasis Ltd" }, { symbol: "COFORGE", name: "Coforge Ltd" },
  { symbol: "PERSISTENT", name: "Persistent Systems Ltd" }, { symbol: "LTTS", name: "L&T Technology Services Ltd" },
  { symbol: "HAPPSTMNDS", name: "Happiest Minds Technologies Ltd" }, { symbol: "KPITTECH", name: "KPIT Technologies Ltd" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Ltd" }, { symbol: "ZENTEC", name: "Zensar Technologies Ltd" },
  { symbol: "SONATSOFTW", name: "Sonata Software Ltd" }, { symbol: "CYIENT", name: "Cyient Ltd" },
  { symbol: "DATAPATTNS", name: "Data Patterns (India) Ltd" }, { symbol: "BEL", name: "Bharat Electronics Ltd" },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd" }, { symbol: "MAZAGONDOCK", name: "Mazagon Dock Shipbuilders Ltd" },
  { symbol: "COCHINSHIP", name: "Cochin Shipyard Ltd" }, { symbol: "GRSE", name: "Garden Reach Shipbuilders & Engineers Ltd" },
  { symbol: "PARASDEFENCE", name: "Paras Defence and Space Technologies Ltd" },
];

function getStockList(): StockInfo[] {
  const seen = new Set<string>();
  return ALL_STOCKS.filter(s => { if (seen.has(s.symbol)) return false; seen.add(s.symbol); return true; });
}

interface FundamentalData {
  name: string;
  sector: string;
  industry: string;
  description: string;
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
  analysis?: {
    overall: number;
    breakdown: Record<string, number>;
    strengths: string[];
    risks: string[];
    growthCatalysts: string[];
    bullCase: string;
    bearCase: string;
    verdict: string;
  };
}

interface RankedStock {
  symbol: string;
  name: string;
  score: number;
  pe: number;
  roe: number;
  roce: number;
  marketCap: number;
  price: number;
  dividendYield: number;
  error?: string;
}

const SCORE_COLORS: Record<number, string> = { 10: '#16a34a', 9: '#22c55e', 8: '#4ade80', 7: '#86efac', 6: '#fbbf24', 5: '#f59e0b', 4: '#f97316', 3: '#ef4444', 2: '#dc2626', 1: '#991b1b' };

function StarRating({ score, max = 10 }: { score: number; max?: number }) {
  const stars = Math.round((score / max) * 5);
  return (
    <span style={{ color: '#f59e0b', fontSize: '14px' }}>
      {Array.from({ length: 5 }, (_, i) => i < stars ? '★' : '☆').join('')}
    </span>
  );
}

function toFY(label: string): string {
  const m = label.match(/Mar\s+(\d{4})/);
  return m ? `FY${m[1]}` : label;
}

function TrendChart({ data, label }: { data: number[]; label: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 300;
  const height = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div style={{ marginTop: '4px' }}>
      <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
      </svg>
    </div>
  );
}

export default function FundamentalsTab() {
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState<FundamentalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Batch ranking state
  const [rankedList, setRankedList] = useState<RankedStock[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [batchCount, setBatchCount] = useState<10 | 50>(10);
  const [showTop, setShowTop] = useState<10 | 50>(10);

  const stocks = getStockList();

  const handleInputChange = (val: string) => {
    setSymbol(val);
    if (val.length >= 1) {
      const q = val.toUpperCase();
      const matches = stocks.filter(s => s.symbol.startsWith(q) || s.name.toUpperCase().includes(q)).slice(0, 10);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setHighlightIdx(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectStock = (s: StockInfo) => {
    setSymbol(s.symbol);
    setShowSuggestions(false);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectStock(suggestions[highlightIdx]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) && inputRef.current !== e.target) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const analyze = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const resp = await fetch(`/api/fundamental?symbol=${symbol.trim().toUpperCase()}`);
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Failed');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const scanBatch = async (count: 10 | 50) => {
    setBatchLoading(true);
    setBatchProgress('Starting batch scan...');
    setRankedList([]);
    setBatchCount(count);

    try {
      // Get unique stock list
      const seen = new Set<string>();
      const unique = stocks.filter(s => { if (seen.has(s.symbol)) return false; seen.add(s.symbol); return true; });
      const toScan = unique.slice(0, count);
      const symbols = toScan.map(s => s.symbol).join(',');

      setBatchProgress(`Scanning ${toScan.length} stocks (this may take a few minutes)...`);

      // Use batch API - split into chunks of 10 to avoid timeouts
      const chunkSize = 10;
      const allResults: RankedStock[] = [];
      for (let i = 0; i < toScan.length; i += chunkSize) {
        const chunk = toScan.slice(i, i + chunkSize);
        const chunkSymbols = chunk.map(s => s.symbol).join(',');
        setBatchProgress(`Scanning ${i + 1}-${Math.min(i + chunkSize, toScan.length)} of ${toScan.length}...`);

        const resp = await fetch(`/api/fundamental-batch?symbols=${chunkSymbols}`);
        const result = await resp.json();
        if (result.results) {
          allResults.push(...result.results.filter((r: RankedStock) => !r.error));
        }
        // Small delay between chunks
        if (i + chunkSize < toScan.length) await new Promise(r => setTimeout(r, 500));
      }

      // Sort all results by score
      allResults.sort((a, b) => b.score - a.score);
      setRankedList(allResults);
      setBatchProgress(`Done! Found ${allResults.length} valid stocks.`);
    } catch (e) {
      setBatchProgress(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Fundamental Analysis</h1>
      </div>

      {/* Search */}
      <div style={{ padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <input
            ref={inputRef}
            value={symbol}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Search stock (e.g. RELIANCE, TCS, TIMETECHNO)"
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0 0 8px 8px', maxHeight: '260px', overflowY: 'auto', zIndex: 100 }}>
              {suggestions.map((s, i) => (
                <div
                  key={s.symbol}
                  onClick={() => selectStock(s)}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #0f172a', backgroundColor: i === highlightIdx ? '#334155' : 'transparent' }}
                  onMouseEnter={() => setHighlightIdx(i)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.symbol}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={analyze}
          disabled={loading || !symbol.trim()}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading || !symbol.trim() ? 0.5 : 1 }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && <div style={{ padding: '12px 24px', color: '#ef4444', textAlign: 'center' }}>{error}</div>}

      {/* Batch Scan Buttons */}
      <div style={{ padding: '0 24px 16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => scanBatch(10)}
          disabled={batchLoading}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: batchLoading ? '#1e293b' : '#0f172a', color: '#e2e8f0', fontSize: '13px', cursor: batchLoading ? 'wait' : 'pointer', opacity: batchLoading ? 0.5 : 1 }}
        >
          {batchLoading && batchCount === 10 ? 'Scanning...' : 'Top 10 Scan'}
        </button>
        <button
          onClick={() => scanBatch(50)}
          disabled={batchLoading}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: batchLoading ? '#1e293b' : '#0f172a', color: '#e2e8f0', fontSize: '13px', cursor: batchLoading ? 'wait' : 'pointer', opacity: batchLoading ? 0.5 : 1 }}
        >
          {batchLoading && batchCount === 50 ? 'Scanning...' : 'Top 50 Scan'}
        </button>
        {batchProgress && <span style={{ fontSize: '12px', color: '#94a3b8', alignSelf: 'center' }}>{batchProgress}</span>}
      </div>

      {/* Ranked List */}
      {rankedList.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 24px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Top {showTop} Stocks by Fundamental Score
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowTop(10)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: showTop === 10 ? '#3b82f6' : '#0f172a', color: showTop === 10 ? '#fff' : '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                >
                  Top 10
                </button>
                <button
                  onClick={() => setShowTop(50)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: showTop === 50 ? '#3b82f6' : '#0f172a', color: showTop === 50 ? '#fff' : '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                >
                  Top 50
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Symbol</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Company</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>CMP</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>P/E</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>ROE%</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>ROCE%</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Mkt Cap</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Div Yld</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedList.slice(0, showTop).map((stock, i) => (
                    <tr
                      key={stock.symbol}
                      style={{ borderBottom: '1px solid #0f172a', cursor: 'pointer' }}
                      onClick={() => { setSymbol(stock.symbol); analyze(); }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 8px', color: '#6b7280' }}>{i + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: '#3b82f6' }}>{stock.symbol}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: (SCORE_COLORS[Math.round(stock.score)] || '#6b7280') + '22', color: SCORE_COLORS[Math.round(stock.score)] || '#94a3b8', fontWeight: 700, fontSize: '14px' }}>
                          {stock.score.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>₹{stock.price}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{stock.pe > 0 ? `${stock.pe}x` : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: stock.roe > 15 ? '#22c55e' : stock.roe > 10 ? '#f59e0b' : '#94a3b8' }}>{stock.roe}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: stock.roce > 20 ? '#22c55e' : stock.roce > 15 ? '#f59e0b' : '#94a3b8' }}>{stock.roce}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>₹{stock.marketCap.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{stock.dividendYield}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 48px' }}>
          {/* Company Overview */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{data.name}</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{data.sector} | {data.industry}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>₹{data.currentPrice}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>CMP</div>
              </div>
            </div>
            {data.description && (
              <p style={{ color: '#94a3b8', marginTop: '12px', fontSize: '13px', lineHeight: 1.6 }}>{data.description}</p>
            )}
          </div>

          {/* Financial Snapshot (Consolidated) */}
          {data.annualPL.years.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Financial Table */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Financial Snapshot (Consolidated) <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(₹ Crore)</span>
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #334155' }}>
                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Particulars</th>
                        {data.annualPL.years.slice(-3).map((y, i) => (
                          <th key={i} style={{ padding: '8px 6px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>{toFY(y)}</th>
                        ))}
                        <th style={{ padding: '8px 6px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>YoY Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const years = data.annualPL.years.slice(-3);
                        const latestIdx = data.annualPL.years.indexOf(years[years.length - 1]);
                        const prevIdx = data.annualPL.years.indexOf(years[years.length - 2]);
                        const calcYoY = (arr: number[], li: number, pi: number) => {
                          if (pi < 0 || li < 0 || !arr[pi]) return null;
                          return ((arr[li] - arr[pi]) / arr[pi]) * 100;
                        };
                        const fmtPct = (v: number | null) => v === null ? '-' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
                        const fmtBps = (v: number | null) => v === null ? '-' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} bps`;
                        const patMargin = (i: number) => data.annualPL.sales[i] > 0 ? (data.annualPL.netProfit[i] / data.annualPL.sales[i]) * 100 : 0;
                        const ebitdaMargin = (i: number) => data.annualPL.sales[i] > 0 && data.annualEBITDA[i] ? (data.annualEBITDA[i] / data.annualPL.sales[i]) * 100 : 0;

                        const rows = [
                          { label: 'Revenue from Operations', icon: '📊', values: years.map(y => { const i = data.annualPL.years.indexOf(y); return `₹${data.annualPL.sales[i]?.toLocaleString() || 0}`; }), yoy: fmtPct(calcYoY(data.annualPL.sales, latestIdx, prevIdx)) },
                          { label: 'EBITDA', icon: '📈', values: years.map(y => { const i = data.annualPL.years.indexOf(y); return `₹${data.annualEBITDA[i]?.toLocaleString() || 0}`; }), yoy: fmtPct(calcYoY(data.annualEBITDA, latestIdx, prevIdx)) },
                          { label: 'EBITDA Margin (%)', icon: '📉', values: years.map(y => { const i = data.annualPL.years.indexOf(y); return `${ebitdaMargin(i).toFixed(1)}%`; }), yoy: fmtBps(calcYoY(years.map((_, i) => ebitdaMargin(data.annualPL.years.indexOf(years[i]))), 2, 1)) },
                          { label: 'Profit After Tax (PAT)', icon: '💰', values: years.map(y => { const i = data.annualPL.years.indexOf(y); return `₹${data.annualPL.netProfit[i]?.toLocaleString() || 0}`; }), yoy: fmtPct(calcYoY(data.annualPL.netProfit, latestIdx, prevIdx)) },
                          { label: 'PAT Margin (%)', icon: '📊', values: years.map(y => { const i = data.annualPL.years.indexOf(y); return `${patMargin(i).toFixed(1)}%`; }), yoy: fmtBps(calcYoY(years.map((_, i) => patMargin(data.annualPL.years.indexOf(years[i]))), 2, 1)) },
                          { label: 'ROE (%)', icon: '📈', values: years.map(() => `${data.roe}%`), yoy: '-' },
                          { label: 'ROCE (%)', icon: '📈', values: years.map(() => `${data.roce}%`), yoy: '-' },
                        ];
                        return rows.map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: '1px solid #0f172a' }}>
                            <td style={{ padding: '8px 6px', color: '#e2e8f0', fontWeight: 500 }}>
                              <span style={{ marginRight: '6px' }}>{row.icon}</span>{row.label}
                            </td>
                            {row.values.map((v, vi) => (
                              <td key={vi} style={{ padding: '8px 6px', textAlign: 'right', color: '#e2e8f0' }}>{v}</td>
                            ))}
                            <td style={{ padding: '8px 6px', textAlign: 'right', color: row.yoy.startsWith('+') ? '#22c55e' : row.yoy.startsWith('-') ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                              {row.yoy}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5-Year Financial Trend */}
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  5-Year Financial Trend
                </h3>
                {/* Revenue Bar Chart */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Revenue from Operations (₹ Crore)</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                    {(() => {
                      const last5 = data.annualPL.years.length >= 5 ? 5 : data.annualPL.years.length;
                      const years5 = data.annualPL.years.slice(-last5);
                      const sales5 = data.annualPL.sales.slice(-last5);
                      const max = Math.max(...sales5);
                      return years5.map((y, i) => {
                        const h = max > 0 ? (sales5[i] / max) * 90 : 0;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>{sales5[i]}</div>
                            <div style={{ width: '100%', height: `${h}px`, backgroundColor: '#3b82f6', borderRadius: '3px 3px 0 0' }}></div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>{toFY(y)}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {data.growthRates.salesGrowth.length > 1 && (
                    <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '6px', fontWeight: 600 }}>
                      CAGR (5Y): {data.growthRates.salesGrowth[1]}%
                    </div>
                  )}
                </div>
                {/* PAT Bar Chart */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Profit After Tax (₹ Crore)</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
                    {(() => {
                      const last5 = data.annualPL.years.length >= 5 ? 5 : data.annualPL.years.length;
                      const years5 = data.annualPL.years.slice(-last5);
                      const profit5 = data.annualPL.netProfit.slice(-last5);
                      const max = Math.max(...profit5);
                      return years5.map((y, i) => {
                        const h = max > 0 ? (profit5[i] / max) * 70 : 0;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>{profit5[i]}</div>
                            <div style={{ width: '100%', height: `${h}px`, backgroundColor: '#ef4444', borderRadius: '3px 3px 0 0' }}></div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>{toFY(y)}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {data.growthRates.profitGrowth.length > 1 && (
                    <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>
                      CAGR (5Y): {data.growthRates.profitGrowth[1]}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Valuation Snapshot */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Valuation Snapshot <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(Approx.)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {[
                { label: 'Market Price', value: `₹${data.currentPrice}` },
                { label: 'Market Cap', value: `₹${data.marketCap.toLocaleString()} Cr` },
                { label: 'P/E (TTM)', value: `${data.stockPE}x` },
                { label: 'P/B (TTM)', value: `${data.priceToBook.toFixed(1)}x` },
                { label: 'EV/EBITDA', value: data.annualEBITDA[0] ? `${((data.marketCap / data.annualEBITDA[0]) || 0).toFixed(1)}x` : '-' },
                { label: 'Dividend Yield', value: `${data.dividendYield}%` },
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#0f172a', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quarterly Results */}
          {data.quarterlyResults.quarters.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>Quarterly Results</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Metric</th>
                      {data.quarterlyResults.quarters.slice(-8).map((q, i) => (
                        <th key={i} style={{ padding: '8px', textAlign: 'right', color: '#94a3b8' }}>{q}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>Sales</td>
                      {data.quarterlyResults.sales.slice(-8).map((v, i) => (
                        <td key={i} style={{ padding: '8px', textAlign: 'right' }}>₹{v}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>OPM</td>
                      {data.quarterlyResults.opm.slice(-8).map((v, i) => (
                        <td key={i} style={{ padding: '8px', textAlign: 'right' }}>{v}%</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>Net Profit</td>
                      {data.quarterlyResults.netProfit.slice(-8).map((v, i) => (
                        <td key={i} style={{ padding: '8px', textAlign: 'right' }}>₹{v}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>EPS</td>
                      {data.quarterlyResults.eps.slice(-8).map((v, i) => (
                        <td key={i} style={{ padding: '8px', textAlign: 'right' }}>₹{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Strengths & Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#22c55e' }}>Strengths</h3>
              {data.analysis?.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#22c55e' }}>✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#ef4444' }}>Risks</h3>
              {data.analysis?.risks.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#ef4444' }}>✗</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Growth Catalysts */}
          {data.analysis?.growthCatalysts && data.analysis.growthCatalysts.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>Key Growth Catalysts</h3>
              {data.analysis.growthCatalysts.map((c, i) => (
                <div key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>• {c}</div>
              ))}
            </div>
          )}

          {/* Fundamental Scorecard */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>Fundamental Scorecard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.entries(data.analysis?.breakdown || {}).map(([key, score]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{key}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StarRating score={score} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: SCORE_COLORS[score] || '#94a3b8' }}>{score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Score & Verdict */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: (data.analysis?.overall || 0) >= 7 ? '#22c55e' : (data.analysis?.overall || 0) >= 5 ? '#f59e0b' : '#ef4444' }}>
                {data.analysis?.overall}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>Overall Score</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{data.name}</p>
              </div>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', fontSize: '14px', lineHeight: 1.6 }}>
              {data.analysis?.verdict}
            </div>
          </div>

          {/* Bull / Bear Case */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#22c55e' }}>Bull Case</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{data.analysis?.bullCase}</p>
            </div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#ef4444' }}>Bear Case</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{data.analysis?.bearCase}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
