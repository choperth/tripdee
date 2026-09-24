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
      '4WD SUV for high mountain trips. Ideal for small groups of 4–6 who want agility and comfort. Same experienced driver every time for peace of mind.',
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
      'Driver experienced on Khao Yai–Wang Nam Khiao',
      'Door-to-door pickup and drop-off',
    ],
    description:
      'Excellent-condition SUV for small groups of 4–6. Fresh air trips in Khao Yai, Wang Nam Khiao, or business trips to Khon Kaen. Kind driver who knows photo spots and great restaurants.',
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
      'Yellow plate 30, full tax invoice + 3% withholding — convenient for legal entities',
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
      '100% electric power — silent with zero emissions',
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
      'Driver experienced Chiang Mai–Lamphun, smooth and safe',
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
      'Popular 7-seat SUV for family and friend trips of 4–6. High performance, road-hugging, comfortable throughout. Calm, safe, courteous driver who knows beautiful photo stops.',
  },
  'v-11': {
    title: 'Honda CR-V e:HEV RS 7-Seater Full-Option Hybrid Quiet Luxury (Bangkok & Pattaya & Rayong)',
    location: 'Bangkok & vicinity / Pattaya / Rayong / Hua Hin / Khao Yai',
    popularRoutes: ['Bangkok', 'Pattaya', 'Rayong', 'Khao Yai', 'Suvarnabhumi Airport'],
    amenities: [
      'Full Hybrid system — smooth, quiet, noise-free',
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
      'CVT automatic — easy to drive, fuel-efficient',
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
      'Full Hybrid e:HEV — powerful and fuel-efficient',
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
      'Hybrid Compact SUV — wide visibility, agile driving',
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
      'CVT automatic — agile, easy to park',
      'Push Start & Keyless',
      'Automatic A/C — fast cooling against the sun',
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
      'Hybrid sedan — smooth, quiet, fuel-efficient',
      'Pickup/drop-off at both Suvarnabhumi and Don Mueang',
      'Full receipt / tax invoice available',
      'Credit card hold for security deposit',
      'Open and bookable 24 hours',
    ],
    description:
      'Thailand’s #1 mid-size hybrid sedan. Great for both business and leisure. Spacious, comfortable, smooth — long interprovincial trips without fatigue.',
    rateNote: 'Full tax invoice + 3% withholding available — convenient for legal entities',
  },
  'v-sd-bkk02': {
    title: 'Honda Civic EL+ 1.5 Turbo Sport Sedan 5-Seater (BKK Drive Rental)',
    location: 'Bangkok / Bangna / Sukhumvit / Suvarnabhumi',
    popularRoutes: ['Bangkok', 'Khao Yai', 'Pattaya', 'Hua Hin'],
    amenities: [
      '1.5 Turbo engine — high performance',
      'Honda SENSING intelligent safety',
      'Electric front leather seats, premium sport design',
      'Drop-off zone in eastern Bangkok and Suvarnabhumi',
      'Ask shop directly for booking and rental documents',
    ],
    description:
      'Sharp sport sedan with excellent acceleration and confident road grip. For driving enthusiasts. Great for Bangkok–Khao Yai or Pattaya trips.',
    rateNote: 'VTEC Turbo 178 hp — fun to drive, responsive overtaking',
  },
  'v-sd-bkk03': {
    title: 'Toyota Majesty Executive 7-Seater Premium Self-Drive VIP (Prime Luxury Mobility)',
    location: 'Bangkok / Nonthaburi / vicinity / Suvarnabhumi',
    popularRoutes: ['Bangkok', 'Hua Hin', 'Pattaya', 'Khao Yai'],
    amenities: [
      'Electric Captain Seats with calf rest',
      'Dual power sliding doors — easy control',
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
      '7 seats across 3 rows — many configurations',
      'Wireless phone charger',
      'Touchscreen with Apple CarPlay / Android Auto',
      'Pickup zone in North/Central/South Pattaya and Jomtien',
      'Cash and transfer deposit accepted',
    ],
    description:
      'Versatile 7-seat Mini MPV. Perfect for family or friend trips to Pattaya, Sattahip, Koh Larn. Fits people and luggage completely at a budget price.',
    rateNote: '7 seats great value — fits lots of people and gear, ideal for Pattaya-Sattahip trips',
  },
  'v-sd-sm01': {
    title: 'Toyota Yaris Ativ 5-Seater Island Touring (Samui Island Rent A Car)',
    location: 'Koh Samui / Samui Airport (USM) / Na Thon Pier / Chaweng Beach',
    popularRoutes: ['Chaweng Beach', 'Lamai Beach', 'Bo Phut', 'Na Thon Pier', 'Samui Airport'],
    amenities: [
      'Automatic — easy driving on island routes',
      'Fast-cooling A/C against Koh Samui sun',
      'Drop-off at Na Thon Pier, Lipa Noi Pier, and Samui Airport',
      'Free map of island attractions and cafes',
      'Ask shop for deposit and pickup time terms',
    ],
    description:
      'Popular car for driving around Koh Samui. Easy to drive, easy to turn around, easy to park at cafes and beaches. Icy A/C, cleaned carefully.',
  },
};

export function vehicleTitle(v: Pick<Vehicle, 'id' | 'title'>, locale: Locale): string {
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.title;
    if (en) return en;
  }
  return v.title;
}

export function vehicleLocation(v: Pick<Vehicle, 'id' | 'location'>, locale: Locale): string {
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.location;
    if (en) return en;
  }
  return v.location;
}

export function vehicleAmenities(v: Pick<Vehicle, 'id' | 'amenities'>, locale: Locale): string[] {
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.amenities;
    if (en) return en;
  }
  return v.amenities;
}

export function vehicleDescription(
  v: Pick<Vehicle, 'id' | 'description'>,
  locale: Locale,
): string {
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
  if (locale !== 'th') {
    const en = VEHICLE_EN[v.id]?.popularRoutes;
    if (en) return en;
  }
  return v.popularRoutes ?? [];
}
