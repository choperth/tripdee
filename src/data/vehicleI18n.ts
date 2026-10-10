import type { Locale } from '@/i18n/dictionaries';
import type { Vehicle } from './mockData';

export interface VehicleText {
  title: string;
  location: string;
  popularRoutes?: string[];
  amenities?: string[];
  description?: string;
  rateNote?: string;
}

export const VEHICLE_EN: Record<string, VehicleText> = {
  'v-std-1': {
    title: 'Toyota Commuter 10–13 Seats Standard (Full group, great value, cool A/C)',
    location: 'Chiang Mai / Mae Rim / Mon Jam / Doi Inthanon / San Kamphaeng',
    popularRoutes: ['Mon Jam', 'Doi Inthanon', 'Mae Kampong', 'Chiang Mai'],
    amenities: [
      'Original factory 4 rows (fits 10–13 passengers)',
      'Microbus A/C reaching every row',
      'Spacious rear luggage area',
      'Compulsory passenger insurance',
      'Polite, non-smoking driver skilled in northern mountain roads',
    ],
    description: 'Factory standard van, well maintained and clean. Ideal for large families, friend groups, company seminars traveling together in one van to save budget.',
  },
  'v-std-2': {
    title: 'All New Commuter 10–13 Seats Yellow Plate 30 (Corporate & Family Trips)',
    location: 'Chiang Mai / Chiang Rai / Mae Hong Son / Lampang',
    popularRoutes: ['Chiang Mai', 'Chiang Rai', 'Pai', 'Doi Inthanon'],
    amenities: [
      '4 rows 11 seats, comfortable and spacious',
      'Yellow plate 30 compliant with transport regulations',
      'Real-time GPS tracking system',
      'Fire extinguisher and emergency safety hammers',
      'Full corporate tax invoice and government reimbursement documents',
    ],
    description: 'Modern high-roof van with legal yellow plate 30 and GPS safety tracking. Suitable for corporate seminars, government agencies, and families needing official documents.',
  },
  'v-1': {
    title: 'Toyota Commuter VIP 9-Seater Electric Massage Seats Full Karaoke',
    location: 'Chiang Mai / Mon Jam / Doi Inthanon / Northern Thailand',
    popularRoutes: ['Mon Jam', 'Doi Inthanon', 'Mae Kampong', 'Chiang Mai', 'Chiang Rai'],
    amenities: [
      '9 electric massage seats',
      'Karaoke set + YouTube Smart TV',
      'High-speed WiFi on board',
      'Type-C / USB charging at every seat',
      'Class 1 passenger insurance',
      'Mini fridge on board',
    ],
    description:
      'Brand-new VIP minibus with icy air-conditioning and comfortable massage seats. Perfect for family trips, executives, and friend groups. Driver experienced on mountain routes, safe, basic English, non-smoker.',
  },
  'v-1b': {
    title: 'Toyota Fortuner 2.8 4WD 7-Seater Mountain Explorer with Driver (P\'Chai Chiang Mai Van)',
    location: 'Chiang Mai / Mon Jam / Doi Inthanon / Northern Thailand',
    popularRoutes: ['Mon Jam', 'Doi Inthanon', 'Mae Kampong', 'Chiang Dao', 'Pai'],
    amenities: [
      'True 4WD system safe on steep mountain roads',
      '7 leather seats with icy air-conditioning in every row',
      'Driver experienced on Doi Inthanon and Mae Hong Son routes',
      'Class 1 passenger insurance',
    ],
    description:
      '4WD SUV for high mountain trips. Ideal for small groups of 4-6 who want agility and comfort. Same experienced driver every time for peace of mind.',
  },
  'v-2': {
    title: 'Toyota Majesty Executive 7-Seater Premium Captain Seats (Bangkok & Pattaya & Hua Hin)',
    location: 'Bangkok & vicinity / Pattaya / Hua Hin / Ayutthaya',
    popularRoutes: ['Bangkok', 'Pattaya', 'Hua Hin', 'Ayutthaya', 'Suvarnabhumi Airport'],
    amenities: [
      'Front dual electric Captain Seats',
      'Power sliding doors on both sides',
      'Nanoe air purification system',
      'Driver speaks English and Chinese',
      'Full tax invoice available',
    ],
    description:
      'Premium executive level for VIP guests, corporate clients, foreign visitors, or family trips wanting maximum luxury and privacy. Company tax invoice available.',
    rateNote: 'Executive premium model, full tax invoice available',
  },
  'v-2b': {
    title: 'Toyota Alphard SC Package VIP 7-Seater Executive Style (P\'Jot VIP Limo)',
    location: 'Bangkok & vicinity / Pattaya / Hua Hin / Ayutthaya',
    popularRoutes: ['Bangkok', 'Suvarnabhumi Airport', 'Pattaya', 'Hua Hin'],
    amenities: [
      'Electric Mickey Mouse seats with calf support',
      'Twin Moonroof dual sunroof',
      'Surround sound system',
      'Smartly dressed driver, speaks English and Chinese',
    ],
    description:
      'Luxury-class van, smooth and whisper-quiet. Perfect for VIP guests, international conferences, or special family trips.',
    rateNote: 'Top-tier luxury, tax invoice available',
  },
  'v-3': {
    title: 'All New Commuter VIP 10-Seater High Roof (Phuket & Phang Nga & Krabi)',
    location: 'Phuket / Krabi / Phang Nga / Khao Lak',
    popularRoutes: ['Phuket', 'Phang Nga', 'Krabi', 'Phuket Airport'],
    amenities: [
      'Spacious 10 VIP seats',
      'Ceiling Android TV + karaoke',
      'Phone charging ports at every seat',
      'Class 1 passenger insurance',
      'Driver experienced on Andaman tourist routes',
    ],
    description:
      'Brand-new VIP van with soft leather seats and icy air-conditioning throughout. Ideal for Phuket airport transfers, Phang Nga Bay trips, Phi Phi Island, or crossing to Krabi and Khao Lak.',
  },
  'v-4': {
    title: 'Hyundai Staria VIP 9-Seater Modern Luxury (Pattaya & Chonburi & Rayong)',
    location: 'Pattaya / Chonburi / Sattahip / Rayong / Koh Chang',
    popularRoutes: ['Pattaya', 'Sattahip', 'Rayong', 'Koh Chang', 'U-Tapao Airport'],
    amenities: [
      'Spaceship-style cabin with panoramic windows',
      'Relaxing electric reclining massage seats',
      'Driver speaks English and Korean',
      '360° camera and full safety systems',
      'Receipt / tax invoice available',
    ],
    description:
      'Cutting-edge premium design, smooth and quiet ride. Great for business travelers, golf trips, and families relaxing in Pattaya and Rayong. Courteous, punctual driver.',
  },
  'v-5': {
    title: 'Toyota Fortuner 4WD 7-Seater Nature Explorer (Khao Yai & Korat & Isan)',
    location: 'Khao Yai / Pak Chong / Nakhon Ratchasima / Khon Kaen',
    popularRoutes: ['Khao Yai', 'Pak Chong', 'Wang Nam Khiao', 'Khon Kaen'],
    amenities: [
      '4WD system for easy nature routes',
      'Apple CarPlay / Android Auto',
      'Class 1 insurance covering passengers',
      'Driver experienced on Khao Yai-Wang Nam Khiao',
      'Door-to-door pickup and drop-off',
    ],
    description:
      'Excellent-condition SUV for small groups of 4-6. Fresh air trips in Khao Yai, Wang Nam Khiao, or business trips to Khon Kaen. Kind driver who knows photo spots and great restaurants.',
  },
  'v-6': {
    title: 'Toyota Coaster VIP Minibus 20-Seater for Seminars & Study Tours (Bangkok-Pattaya-Khao Yai)',
    location: 'Bangkok / vicinity / Pattaya / Khao Yai / Ayutthaya',
    popularRoutes: ['Bangkok', 'Pattaya', 'Khao Yai', 'Ayutthaya', 'Suvarnabhumi Airport'],
    amenities: [
      '20 VIP minibus seats with seatbelts',
      'Tour guide microphone & narration system',
      'Smart TV karaoke + YouTube',
      '100% Department of Land Transport GPS tracking',
      'Corporate tax invoice & receipt available',
    ],
    description:
      'Brand-new Toyota Coaster 20-seater minibus, VIP-decorated, comfortable without feeling cramped. Ideal for company seminars, study tours, or large families. Legal yellow-plate 30 with top insurance.',
    rateNote:
      'Yellow plate 30, full tax invoice + 3% withholding - convenient for legal entities',
  },
  'v-7': {
    title: 'Toyota Alphard First Class 5-Seater Super VIP Ottoman Reclining Seats (Bangkok & Airport)',
    location: 'Bangkok / Suvarnabhumi Airport / Don Mueang / Pattaya / Hua Hin',
    popularRoutes: ['Bangkok', 'Suvarnabhumi Airport', 'Pattaya', 'Hua Hin'],
    amenities: [
      'First Class electric Ottoman seats with massage',
      'Twin Moonroof for natural light',
      '13.3" ceiling screen + premium audio',
      'Suit-and-tie VVIP-trained courteous driver',
      'Mineral water, cool towels, and sun umbrella on board',
    ],
    description:
      'Ultimate VVIP comfort for senior executives, foreign VIP guests, national conferences, weddings, or special family days. Tax invoice available.',
    rateNote: 'First-class service, international business attire, mineral water welcome',
  },
  'v-8': {
    title: 'MG Maxus 9 Luxury 100% Electric 7-Seater Eco-Friendly Premium Quiet',
    location: 'Bangkok / vicinity / Pattaya / Hua Hin / Khao Yai',
    popularRoutes: ['Bangkok', 'Pattaya', 'Hua Hin', 'Khao Yai'],
    amenities: [
      '100% electric power - silent with zero emissions',
      '8-way electric Captain Seats with massage',
      'Full-width Panoramic Sunroof',
      'DC Fast Charging support, 540 km range',
      'Supports corporate ESG sustainability policies',
    ],
    description:
      '100% electric luxury MPV. Spacious, smooth, silent cabin with no vibration. Meets Net Zero and ESG policies of leading organizations, or health- and environment-loving family trips.',
    rateNote: '100% EV fits corporate ESG policy, zero pollution',
  },
  'v-9': {
    title: 'Toyota Camry 2.5 Premium Luxury Executive Sedan 4-Seater (Chiang Mai & Northern Thailand)',
    location: 'Chiang Mai / Nimman / Lamphun / Lampang / Chiang Rai',
    popularRoutes: ['Chiang Mai', 'Mon Jam', 'Mae Kampong', 'Chiang Rai'],
    amenities: [
      'Electric rear seats with digital control panel',
      'Nanoe 3-zone independent climate control',
      'Electric rear sunshades and side curtains',
      'Driver experienced Chiang Mai-Lamphun, smooth and safe',
      'Receipt available for company reimbursement',
    ],
    description:
      'Luxury sedan with driver. Ideal for Chiang Mai airport transfers, business meetings, government affairs, or couples touring Chiang Mai. Comfortable, smooth, highly private.',
  },
  'v-10': {
    title: 'Isuzu MU-X Ultimate 3.0 4WD 7-Seater CoolMax Comfort Seats (P\'Wit Northern Travel)',
    location: 'Chiang Mai / Mae Hong Son / Chiang Rai / Pai / Pang Ung',
    popularRoutes: ['Pai', 'Mae Hong Son', 'Doi Inthanon', 'Mon Jam', 'Chiang Dao'],
    amenities: [
      '7-seat true 4WD SUV for smooth high-mountain climbs',
      'Genuine CoolMax leather seats, icy 3-zone air-conditioning',
      'Driver experienced on Pai and Mae Hong Son curves, 15+ years',
      'Class 1 passenger insurance full coverage',
      'Drinking water and smartphone charging points',
    ],
    description:
      'Popular 7-seat SUV for family and friend trips of 4-6. High performance, road-hugging, comfortable throughout. Calm, safe, courteous driver who knows beautiful photo stops.',
  },
  'v-11': {
    title: 'Honda CR-V e:HEV RS 7-Seater Full-Option Hybrid Quiet Luxury (Bangkok & Pattaya & Rayong)',
    location: 'Bangkok & vicinity / Pattaya / Rayong / Hua Hin / Khao Yai',
    popularRoutes: ['Bangkok', 'Pattaya', 'Rayong', 'Khao Yai', 'Suvarnabhumi Airport'],
    amenities: [
      'Full Hybrid system - smooth, quiet, noise-free',
      '7 seats across 3 rows with Panoramic Sunroof',
      'Honda SENSING safety all around',
      'Background-checked driver, smartly dressed',
      'Receipt / tax invoice available',
    ],
    description:
      'Premium 7-seat SUV for modern families wanting luxury, smoothness, and excellent visibility. Great for airport transfers, golf trips, or weekend getaways.',
  },
  'v-12': {
    title: 'Mercedes-Benz E-Class Executive Sedan 4-Seater Executive Reception (Bangkok & Airport)',
    location: 'Bangkok / Suvarnabhumi Airport (BKK) / Don Mueang (DMK) / Chonburi',
    popularRoutes: ['Bangkok', 'Suvarnabhumi Airport', 'Don Mueang Airport', 'Pattaya'],
    amenities: [
      'First Class cabin, electric memory leather seats',
      'Burmester premium surround sound',
      'VVIP-trained suit-and-tie courteous punctual driver',
      'Drinking water, cool towels, and free on-board Wi-Fi',
      'Full corporate tax invoice available',
    ],
    description:
      'The ultimate executive luxury sedan. For VIP guests, foreign visitors, business conferences, weddings, or special journeys in the capital.',
    rateNote: 'Luxury premium, international business attire, mineral water welcome',
  },
  'v-sd-cm01': {
    title: 'Toyota Yaris Ativ Sport Eco Car Automatic 5-Seater (CNX Car Rent)',
    location: 'Chiang Mai / Chiang Mai Airport (CNX) / City Center',
    popularRoutes: ['Chiang Mai Airport', 'Nimman', 'Mae Rim', 'Mon Jam', 'Hang Dong'],
    amenities: [
      'CVT automatic - easy to drive, fuel-efficient',
      'Apple CarPlay / Android Auto with reverse camera',
      'Icy air-conditioning, brand-new clean condition',
      'Pickup zone at Chiang Mai Airport and city center',
      'Rental insurance available (ask shop for policy type)',
    ],
    description:
      'Brand-new, clean, fuel-efficient, agile Eco Car. Perfect for driving around Chiang Mai, Mae Rim, Hang Dong, cafes, and shopping. Book and arrange pickup directly with the shop.',
    rateNote:
      '24-hour self-drive rate, fuel not included (deposit and pickup point: contact shop directly)',
  },
  'v-sd-cm02': {
    title: 'Toyota Fortuner 2.8 4WD 7-Seater Mountain Explorer (Chiang Mai Offroad Rental)',
    location: 'Chiang Mai / Doi Inthanon / Ang Ka / Pai',
    popularRoutes: ['Doi Inthanon', 'Mon Jam', 'Ang Khang', 'Chiang Dao', 'Pai'],
    amenities: [
      '4WD system (Part-time 4WD)',
      '2.8L turbo diesel engine for steep mountain climbs',
      '7 leather seats across 3 rows, foldable for cargo',
      'Airport and city hotel pickup service',
      'Rental insurance (ask shop for coverage details)',
    ],
    description:
      'Powerful 4WD SUV with excellent road grip. Designed for high mountain tourism, sharp curves, and northern nature routes. Well-maintained, regularly serviced.',
    rateNote: 'True 4WD high performance, safe mountain climbs (ask shop for deposit terms)',
  },
  'v-sd-cm03': {
    title: 'Honda City e:HEV RS Fuel-Saving Hybrid 5-Seater (Lanna Smart Car)',
    location: 'Chiang Mai / Airport / Chiang Mai University / Nimman',
    popularRoutes: ['Nimman', 'Chiang Mai Airport', 'Mae Kampong', 'Chiang Rai'],
    amenities: [
      'Full Hybrid e:HEV - powerful and fuel-efficient',
      'Honda SENSING safety system',
      'Sport seats with rear passenger A/C',
      'Chiang Mai Airport and railway station drop-off',
      'Full corporate tax invoice available',
    ],
    description:
      'Top RS hybrid model with punchy acceleration yet excellent fuel economy. Comfortable on hills and valleys with all-around safety and complete documents.',
    rateNote: 'Hybrid saves over 27 km/liter, tax invoice available',
  },
  'v-sd-pkt01': {
    title: 'Toyota Yaris Cross HEV Premium Luxury 5-Seater (Andaman Auto Rent Phuket)',
    location: 'Phuket / Phuket Airport (HKT) / Patong / Kata / City Center',
    popularRoutes: ['Phuket Airport', 'Patong Beach', 'Promthep Cape', 'Old Phuket Town', 'Phang Nga'],
    amenities: [
      'Hybrid Compact SUV - wide visibility, agile driving',
      'Electric leather seats with electric parking brake & Auto Brake Hold',
      '360° surround camera, easy even in tight spots',
      'Pickup zone at Phuket Airport and Patong Beach',
      'Staff speaks English and Chinese',
    ],
    description:
      'Popular Compact SUV in Phuket. Raised clearance confidently tackles puddles and sloped island roads. Fuel-saving hybrid power. Convenient pickup at Phuket Airport and key tourist areas.',
    rateNote: 'Raised Compact SUV, convenient for touring Phuket (contact for pickup point)',
  },
  'v-sd-pkt02': {
    title: 'Honda HR-V e:HEV Crossover 5-Seater (Phuket Driving Center)',
    location: 'Phuket / Thalang / Chalong / Rawai / Airport',
    popularRoutes: ['Karon Beach', 'Kata Beach', 'Promthep Cape', 'Phuket Airport'],
    amenities: [
      'Ultra Seat folds flat and up in many configurations',
      'Panoramic Glass Roof for natural light',
      'GPS navigation with wireless Apple CarPlay',
      'Delivery service to arranged points in Phuket',
      'Ask shop for deposit and payment terms',
    ],
    description:
      'Sporty luxury crossover with versatile cabin. Folds to fit golf bags, 28" luggage, or surfboards. Fun to drive, quiet, and smooth.',
  },
  'v-sd-kb01': {
    title: 'Suzuki Swift 1.2 GLX Eco Car 5-Seater (Ao Nang & Krabi Car Rent)',
    location: 'Krabi / Ao Nang / Krabi Airport (KBV) / Klong Muang',
    popularRoutes: ['Krabi Airport', 'Ao Nang', 'Emerald Pool', 'Tha Pom Klong Song Nam'],
    amenities: [
      'CVT automatic - agile, easy to park',
      'Push Start & Keyless',
      'Automatic A/C - fast cooling against the sun',
      'Drop-off zone at Krabi Airport and Ao Nang Beach',
      'Cash and transfer deposit accepted',
    ],
    description:
      'Popular compact car for Krabi trips. Easy to drive, zips along coastal roads and tourist spots. Good visibility, cleaned carefully before every handover.',
  },
  'v-sd-bkk01': {
    title: 'Toyota Corolla Altis 1.8 Hybrid 5-Seater (Siam Car Leasing Suvarnabhumi/Don Mueang)',
    location: 'Bangkok / Suvarnabhumi Airport (BKK) / Don Mueang (DMK)',
    popularRoutes: ['Suvarnabhumi Airport', 'Don Mueang Airport', 'Pattaya', 'Hua Hin', 'Ayutthaya'],
    amenities: [
      'Hybrid sedan - smooth, quiet, fuel-efficient',
      'Pickup/drop-off at both Suvarnabhumi and Don Mueang',
      'Full receipt / tax invoice available',
      'Credit card hold for security deposit',
      'Open and bookable 24 hours',
    ],
    description:
      'Thailand’s #1 mid-size hybrid sedan. Great for both business and leisure. Spacious, comfortable, smooth - long interprovincial trips without fatigue.',
    rateNote: 'Full tax invoice + 3% withholding available - convenient for legal entities',
  },
  'v-sd-bkk02': {
    title: 'Honda Civic EL+ 1.5 Turbo Sport Sedan 5-Seater (BKK Drive Rental)',
    location: 'Bangkok / Bangna / Sukhumvit / Suvarnabhumi',
    popularRoutes: ['Bangkok', 'Khao Yai', 'Pattaya', 'Hua Hin'],
    amenities: [
      '1.5 Turbo engine - high performance',
      'Honda SENSING intelligent safety',
      'Electric front leather seats, premium sport design',
      'Drop-off zone in eastern Bangkok and Suvarnabhumi',
      'Ask shop directly for booking and rental documents',
    ],
    description:
      'Sharp sport sedan with excellent acceleration and confident road grip. For driving enthusiasts. Great for Bangkok-Khao Yai or Pattaya trips.',
    rateNote: 'VTEC Turbo 178 hp - fun to drive, responsive overtaking',
  },
  'v-sd-bkk03': {
    title: 'Toyota Majesty Executive 7-Seater Premium Self-Drive VIP (Prime Luxury Mobility)',
    location: 'Bangkok / Nonthaburi / vicinity / Suvarnabhumi',
    popularRoutes: ['Bangkok', 'Hua Hin', 'Pattaya', 'Khao Yai'],
    amenities: [
      'Electric Captain Seats with calf rest',
      'Dual power sliding doors - easy control',
      '360° camera and sensors for easy parking',
      'Full corporate tax invoice available',
      'Pickup at service center or arranged delivery',
    ],
    description:
      'For large families or executive groups wanting maximum privacy self-drive touring. Luxury, comfortable, easy to drive with excellent visibility and all-around driver aids.',
    rateNote: 'Luxury self-drive van with Captain Seats for large families wanting privacy',
  },
  'v-sd-pty01': {
    title: 'Toyota Veloz Smart 7-Seater Mini MPV Family (Pattaya City Car Rent)',
    location: 'Pattaya / Bang Lamung / Jomtien Beach / Sattahip / U-Tapao Airport',
    popularRoutes: ['Pattaya', 'Sattahip', 'Jomtien Beach', 'Nong Nooch Garden', 'Rayong'],
    amenities: [
      '7 seats across 3 rows - many configurations',
      'Wireless phone charger',
      'Touchscreen with Apple CarPlay / Android Auto',
      'Pickup zone in North/Central/South Pattaya and Jomtien',
      'Cash and transfer deposit accepted',
    ],
    description:
      'Versatile 7-seat Mini MPV. Perfect for family or friend trips to Pattaya, Sattahip, Koh Larn. Fits people and luggage completely at a budget price.',
    rateNote: '7 seats great value - fits lots of people and gear, ideal for Pattaya-Sattahip trips',
  },
  'v-sd-sm01': {
    title: 'Toyota Yaris Ativ 5-Seater Island Touring (Samui Island Rent A Car)',
    location: 'Koh Samui / Samui Airport (USM) / Na Thon Pier / Chaweng Beach',
    popularRoutes: ['Chaweng Beach', 'Lamai Beach', 'Bo Phut', 'Na Thon Pier', 'Samui Airport'],
    amenities: [
      'Automatic - easy driving on island routes',
      'Fast-cooling A/C against Koh Samui sun',
      'Drop-off at Na Thon Pier, Lipa Noi Pier, and Samui Airport',
      'Free map of island attractions and cafes',
      'Ask shop for deposit and pickup time terms',
    ],
    description:
      'Popular car for driving around Koh Samui. Easy to drive, easy to turn around, easy to park at cafes and beaches. Icy A/C, cleaned carefully.',
  },
};

export const VEHICLE_ZH: Record<string, Partial<VehicleText>> = {
  'v-std-1': {
    title: '丰田 Commuter 10–13座 标准型（整团出行 高性价比 冷气充足）',
    location: '清迈 / 湄林 / 梦境山 / 因他农山 / 山甘烹',
    popularRoutes: ['梦境山', '因他农山', '湄康蓬', '清迈市区'],
    amenities: [
      '原厂4排座椅（可容纳 10–13 位乘客）',
      '全车冷气出风口 直达每排',
      '车尾宽敞行李存放区',
      '含乘客法定强制保险',
      '礼貌司机 不吸烟 熟悉泰北山路',
    ],
    description: '原厂标准面包车，定期保养清洁。非常适合大家庭、好友出游或企业研讨会包车，同乘一车经济实惠。',
  },
  'v-std-2': {
    title: 'All New Commuter 10–13座 黄牌30合规运营（企业考察与家庭出游）',
    location: '清迈 / 清莱 / 夜丰颂 / 南邦',
    popularRoutes: ['清迈', '清莱', '拜县', '因他农山'],
    amenities: [
      '4排11座 空间宽敞舒适',
      '黄牌30 符合陆路交通运输法规',
      '配备GPS速度追踪系统',
      '急救箱与安全锤配备齐全',
      '熟悉企业与商务接待流程',
    ],
    description: '新款丰田 Commuter 黄牌30营运车，适合企业团建、政府机关考察及追求正规高标准的家庭旅游。',
  },
  'v-1': {
    title: '丰田 Commuter VIP 9座 航空软包座椅（Kru Boy）',
    location: '清迈 / 素贴山 / 宁曼路 / 梦境山 / 因他农山',
    popularRoutes: ['梦境山', '因他农山', '湄康蓬', '素贴寺'],
    amenities: ['VIP 9座超大舒适皮椅', '冷气充足', 'USB手机充电口', '全套环绕音响系统', '免费饮用水'],
    description: '豪华丰田 Commuter VIP 9座，车内整洁如新，司机 Kru Boy 驾驶稳健，深谙泰北各处小众景点与网红咖啡厅。',
  },
  'v-1b': {
    title: 'All New Commuter VIP 9座 泰北全境包车（Kru Boy Fleet）',
    location: '清迈 / 清莱 / 拜县 / 夜丰颂',
    popularRoutes: ['清莱白庙黑庙', '拜县', '茶房村', '指天山'],
    amenities: ['新款高顶 VIP 空间', '独立航空座椅', '全车遮阳帘', '泰北全境长途经验'],
    description: '新款高顶 Commuter VIP，动力强劲，爬坡平稳，专为长途泰北环线打造，乘坐舒适不晕车。',
  },
  'v-2': {
    title: '丰田 Commuter VIP 9座 舒适大空间商务车（P\'Nan）',
    location: '清迈及周边 / 拜县 / 清莱 / 因他农山',
    popularRoutes: ['清迈古城', '拜县小镇', '清莱一日游', '因他农国家公园'],
    amenities: ['高级真皮包覆座椅', '前后分区冷气', '超大后备箱空间', '安全气囊与行车记录仪'],
    description: '10年以上泰北山区安全驾驶经验，车内无烟异味，服务耐心热情，深得自由行旅客好评。',
  },
  'v-2b': {
    title: 'Commuter VIP 9座 清迈清莱长线专车（Team P\'Nan）',
    location: '清迈 / 清莱 / 帕夭 / 金三角',
    popularRoutes: ['清莱金三角', '美斯乐', '蓝庙白庙', '夜丰颂'],
    amenities: ['长途舒适悬挂调校', '全天候道路救援保障', 'USB快充插口'],
    description: '清迈至清莱长途深度游专业车队，熟悉泰北各大高山盘山公路，平稳安全，保障出行安心。',
  },
  'v-3': {
    title: '丰田 Commuter VIP 8座 独立尊贵航空大座（P\'Taeng）',
    location: '清迈市中心 / 机场接送 / 湄林 / 湄康蓬',
    popularRoutes: ['湄康蓬生态村', '诗丽吉王后植物园', '草莓园', '清迈夜市'],
    amenities: ['奢华独立单人扶手座椅', '超大腿部活动空间', '高速车载Wi-Fi', '优质音响'],
    description: '精装8座VIP面包车，每位乘客均享宽敞独立大座，专为追求品质与舒适的游客量身定制。',
  },
  'v-4': {
    title: '丰田 Commuter VIP 9座 泰北环线穿越专线（Uncle Chai）',
    location: '清迈 / 夜丰颂 1864弯 / 拜县 / 密窝村',
    popularRoutes: ['夜丰颂1864弯', '密窝村茶园', '拜县大峡谷', '清莱美斯乐'],
    amenities: ['山路防晕调教与平稳驾驶', '车载急救箱与薄荷醒神油', '行李系紧装置'],
    description: '20余年山区驾驶老兵 Uncle Chai，精通夜丰颂1864弯道，平稳驾驶不颠簸，带您安心领略泰北秘境。',
  },
  'v-5': {
    title: '丰田 Commuter VIP 10座 亲友与小团队超值首选（Sam）',
    location: '清迈及近郊 / 蓝庙 / 温泉 / 茵他侬山',
    popularRoutes: ['山甘烹温泉', '南奔哈利奔猜寺', '杭东手工艺村', '大象保护区'],
    amenities: ['10座合理布局', '高制冷双蒸发器空调', '随车清洁无异味', '矿泉水提供'],
    description: '超高性价比10座包车，兼顾载客量与舒适度，适合多家庭结伴出游与研学小团队。',
  },
  'v-6': {
    title: '丰田 Commuter VIP 9座 豪华影音与娱乐系统（P\'Art）',
    location: '清迈全境 / 派对包车 / 婚礼与会议接送',
    popularRoutes: ['清迈市区', '会登套湖', '素贴山观景台', '宁曼一号'],
    amenities: ['智能大屏影音系统', '车顶氛围灯', '舒适真皮座椅', '手机无线/有线充电'],
    description: '时尚豪华内饰配置，高清大屏配合优质环绕立体声，路途欢歌笑语，旅行时光更精彩。',
  },
  'v-7': {
    title: '丰田 Commuter VIP 9座 清迈-拜县舒适专线（P\'Golf）',
    location: '清迈 / 拜县 / 湄宏顺 / 清莱',
    popularRoutes: ['拜县黄色小屋', '树顶咖啡', '二战纪念桥', '拜县步行街'],
    amenities: ['专跑拜县舒适悬挂', '晕车药备用', '冷气充足清爽', '免费瓶装水'],
    description: '常年往返清迈与拜县，走山路平稳有节律，乘客好评率极高，拜县度假首选用车。',
  },
  'v-8': {
    title: 'All New Commuter VIP 10座 商务接待与家庭出游（P\'Ton）',
    location: '清迈 / 清莱 / 南邦 / 曼谷长途接送',
    popularRoutes: ['清迈国际会议中心', '清迈大学', '清莱长颈族村', '南邦古城'],
    amenities: ['新款高强度车身结构', '双安全气囊与主动刹车辅助', 'ISOFIX儿童座椅接口'],
    description: '新款丰田 Commuter，行驶静谧平顺，安全配置全面，家庭亲子与企业客户一致推崇。',
  },
  'v-9': {
    title: '丰田 Commuter VIP 9座 宽敞空间与超大行李舱（P\'Nok）',
    location: '清迈机场接送 / 高尔夫球场包车 / 购物一日游',
    popularRoutes: ['高山高尔夫俱乐部', '绿谷高尔夫球场', '尚泰清迈机场商场', '奥特莱斯'],
    amenities: ['后排座椅可灵活折叠', '可容纳多套高尔夫球包与大号行李箱', '免费伞具提供'],
    description: '专为高尔夫球友与带多件大行李的旅客设计，车厢宽大干净，接送机准时可靠。',
  },
  'v-10': {
    title: 'All New Commuter VIP 9座 尊贵奢华款（P\'Lek）',
    location: '清迈 / 清莱 / 普吉 / 曼谷商务长途',
    popularRoutes: ['四季酒店', '安纳塔拉度假酒店', '清迈美利亚', '清迈香格里拉'],
    amenities: ['VIP 顶级软包工艺', '静音降噪地毯', '柔和阅读灯', '尊贵礼宾驾驶员'],
    description: '全车高档内饰定制，礼宾级专车礼遇，适合五星级酒店接送、高端商务贵宾接待。',
  },
  'v-11': {
    title: '丰田 Majesty VIP 7座 奢华商务旗舰MPV（Bangkok-Chiang Mai Premium）',
    location: '清迈及曼谷各大商圈 / 国际机场VIP接送',
    popularRoutes: ['素万那普机场', '廊曼机场', '清迈全境', '芭堤雅'],
    amenities: ['原厂第二排电动队长座椅', '电动侧滑门', '全速域自适应巡航', '隐私隔热玻璃'],
    description: '丰田高端商务MPV Majesty，配备独立电动奥托曼航空座椅，尊贵静谧，商务洽谈与高端奢华游首选。',
  },
  'v-12': {
    title: '现代 H-1 VIP 7座 豪华家庭保姆车（CM Family Fleet）',
    location: '清迈古城 / 杭东 / 湄林 / 动物园与亲子乐园',
    popularRoutes: ['清迈夜间动物园', '大象噗噗纸园', '美旺大象营', '老虎王国'],
    amenities: ['低地台方便老人儿童上下车', '二排座椅可旋转对坐', '双天窗全景采光', '儿童安全座椅'],
    description: '经典现代 H-1 豪华保姆车，空间灵活多变，二排座椅可旋转与后排对聊，温馨家庭出游的最佳伴侣。',
  },
  'v-sd-cm01': {
    title: '丰田 Yaris Ativ 自驾紧凑型轿车（Chiang Mai Rent A Car）',
    location: '清迈国际机场 / 清迈古城 / 宁曼路送车上门',
    popularRoutes: ['清迈古城', '宁曼路', '素贴寺', '湄林咖啡街'],
    amenities: ['自动挡 轻松易开', '极佳燃油经济性', '支持苹果 CarPlay 与安卓 Auto', '倒车雷达与影像', '免押金信用卡预授权'],
    description: '清迈自由行代步首选，小巧灵活，古城小巷穿梭自如，停车极为方便，空调制冷迅猛。',
  },
  'v-sd-cm02': {
    title: '本田 City Hatchback 自驾两厢车（Nimman Car Rental）',
    location: '清迈宁曼一号 / 机场取还车',
    popularRoutes: ['宁曼路探店', '悟孟寺', '会登套湖', '杭东手作街'],
    amenities: ['魔术座椅多变行李空间', '涡轮增压充沛动力', '倒车高清影像', '无钥匙进入一键启动'],
    description: '深受年轻人推崇的潮酷两厢车，提速敏捷，后备箱魔术座椅折叠后可装载大件行李与露营装备。',
  },
  'v-sd-cm03': {
    title: '丰田 Fortuner 4WD 四驱硬派自驾 SUV（North Mountain 4x4）',
    location: '清迈机场 / 泰北全境自驾',
    popularRoutes: ['因他农山顶', '美斯乐茶山', '指天山云海', '清莱湄斯隆'],
    amenities: ['全时四驱系统', '高离地间隙轻松过坎', '7座充裕乘坐空间', '下坡辅助控制与差速锁'],
    description: '征服泰北高山险峻山路的得力座驾，四驱动力澎湃，底盘扎实稳健，雨季与山路自驾安心无忧。',
  },
  'v-sd-pkt01': {
    title: '丰田 Yaris 5座经济型两厢自驾车（Phuket Drive Center）',
    location: '普吉国际机场（HKT） / 芭东海滩 / 卡伦卡塔 / 普吉镇',
    popularRoutes: ['芭东海滩', '神仙半岛日落', '普吉老街', '卡塔观景台', '查龙寺'],
    amenities: ['海岛自驾灵活好停', '强效冷气吹散海岛炎热', '免清洗还车', '24小时普吉机场快速取还'],
    description: '普吉岛环岛自驾高性价比之选，排量经济，在沿海陡坡与狭窄街巷中停车游刃有余。',
  },
  'v-sd-pkt02': {
    title: '本田 CR-V 5座豪华自驾 SUV（Phuket Premium SUV）',
    location: '普吉机场 / 邦涛海滩乐古浪 / 攀牙湾码头',
    popularRoutes: ['攀牙湾山峦', '迈考海滩观飞机', '普吉大佛', '拉威海鲜市场'],
    amenities: ['高级真皮内饰', '全景天窗沐浴阳光', '电动尾门', '全方位安全超感系统'],
    description: '尊享海岛度假体验的豪华城市 SUV，舒适悬挂隔绝路面颠簸，开往攀牙湾自驾游的高品质选择。',
  },
  'v-sd-kb01': {
    title: '丰田 Veloz 7座实用型自驾 MPV（Krabi Road Trip）',
    location: '甲米国际机场（KBV） / 奥南海滩 / 功孟海滩 / 甲米镇',
    popularRoutes: ['奥南海滩', '翡翠池', '虎穴寺', '宏岛码头', '莱利渡口'],
    amenities: ['7座多乘员灵活空间', '无线充电板', '360度全景影像', '后排独立空调'],
    description: '甲米家庭与好友拼车出游的理想自驾车，能装能坐，轻松容纳多人及浮潜赶海装备。',
  },
  'v-sd-bkk01': {
    title: '丰田 Yaris Ativ 经济自驾轿车（Bangkok City Wheels）',
    location: '素万那普机场（BKK） / 廊曼机场（DMK） / 曼谷各BTS沿线',
    popularRoutes: ['曼谷暹罗商圈', '湄南河畔', '大城府古迹', '安帕瓦水上市场'],
    amenities: ['自动挡平稳省油', 'USB手机快充', '全车贴隔热膜', '免费车载手机支架'],
    description: '曼谷自由行代步优选，极低油耗，轻松往返大城古迹与安帕瓦水上市场。',
  },
  'v-sd-bkk02': {
    title: '本田 Civic FE 运动自驾轿车（BKK Prestige Rent）',
    location: '素万那普机场 / 通罗 / 是隆商业区',
    popularRoutes: ['芭堤雅高速', '考艾国家公园', '挽盛海滩', '高尔夫乡村俱乐部'],
    amenities: ['VTEC 涡轮增压强劲动力', '全液晶仪表盘', 'Bose 高级音响', '本田安全超感驾驶辅助'],
    description: '时尚动感的现代轿跑，动力随叫随到，高速行驶沉稳扎实，非常适合曼谷周边高尔夫与度假自驾。',
  },
  'v-sd-bkk03': {
    title: '丰田 Fortuner 7座旗舰自驾 SUV（Bangkok Safari & Touring）',
    location: '曼谷双机场 / 市区酒店送车',
    popularRoutes: ['考艾酒庄度假区', '华欣海滩', '北碧桂河大桥', '七岩'],
    amenities: ['7座越野底盘', '超大行李承载量', '巡航定速', '四轮盘刹强劲制动'],
    description: '曼谷出发前往考艾、北碧与华欣自驾的硬核 SUV，视野开阔坐姿威风，山路与雨天行驶安全感十足。',
  },
  'v-sd-pty01': {
    title: '马自达 2 Sedan 灵动自驾轿车（Pattaya Coastal Cars）',
    location: '芭堤雅市区 / 乌塔堡机场 / 中天海滩 / 梭桃邑',
    popularRoutes: ['中天海滩海滨路', '东芭乐园', '真理寺', '银湖葡萄园', '沙美岛渡口'],
    amenities: ['创驰蓝天精准操控', '运动型座椅', '省油省心', '免费海滨停车指南'],
    description: '操控灵活的精品日系轿车，底盘调校运动有韧性，畅游芭堤雅海滨路与沙滩海岸线轻松自在。',
  },
  'v-sd-sm01': {
    title: '丰田 Yaris Ativ 5座海岛自驾车（Samui Island Rent A Car）',
    location: '苏梅国际机场（USM） / 那通码头 / 查汶海滩',
    popularRoutes: ['查汶海滩', '拉迈海滩', '波普波希米亚渔村', '那通码头', '苏梅机场'],
    amenities: ['自动挡环岛无压力', '冰爽冷气对抗海岛艳阳', '那通码头与利巴诺伊码头免费还车', '免费提供苏梅景点与咖啡馆离线地图'],
    description: '苏梅岛环岛自驾网红车，穿梭在查汶海滩与各悬崖海景咖啡馆之间，好开好停，全车深层清洁消毒。',
  },
};

export function vehicleTitle(v: Pick<Vehicle, 'id' | 'title'>, locale: Locale): string {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.title;
    if (zh) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.title;
    if (en) return en;
  }
  return v.title;
}

export function vehicleLocation(v: Pick<Vehicle, 'id' | 'location'>, locale: Locale): string {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.location;
    if (zh) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.location;
    if (en) return en;
  }
  return v.location;
}

export function vehicleAmenities(v: Pick<Vehicle, 'id' | 'amenities'>, locale: Locale): string[] {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.amenities;
    if (zh && zh.length > 0) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.amenities;
    if (en && en.length > 0) return en;
  }
  return v.amenities ?? [];
}

export function vehicleDescription(
  v: Pick<Vehicle, 'id' | 'description'>,
  locale: Locale,
): string {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.description;
    if (zh) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.description;
    if (en) return en;
  }
  return v.description;
}

export function vehicleRateNote(
  v: Pick<Vehicle, 'id' | 'rateNote'>,
  locale: Locale,
): string | undefined {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.rateNote;
    if (zh) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.rateNote;
    if (en) return en;
  }
  return v.rateNote;
}

export function vehiclePopularRoutes(
  v: Pick<Vehicle, 'id' | 'popularRoutes'>,
  locale: Locale,
): string[] {
  if (locale === 'zh') {
    const zh = VEHICLE_ZH[v.id]?.popularRoutes;
    if (zh && zh.length > 0) return zh;
  }
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.popularRoutes;
    if (en && en.length > 0) return en;
  }
  return v.popularRoutes ?? [];
}
