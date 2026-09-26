import { Sponsor } from '@/data/mockData';
import { Locale } from '@/i18n/dictionaries';

export interface LocalizedSponsorFields {
  title: string;
  categoryLabel: string;
  tagline: string;
  badgeText: string;
  discountText: string;
  location: string;
}

export const SPONSOR_TRANSLATIONS: Record<string, Partial<Record<Locale, LocalizedSponsorFields>>> = {
  'sp-1': {
    en: {
      title: 'Mok Fah Pool Villa & Glamping Mon Jam',
      categoryLabel: 'Featured Stays',
      tagline: 'Witness the sea of mist from your bedroom, with a private pool and evening mookata BBQ.',
      badgeText: 'Popular Mon Jam Stay',
      discountText: '360° mist panorama with private plunge pool',
      location: 'Mon Jam, Chiang Mai',
    },
    zh: {
      title: '雾空全景泳池别墅与豪华露营（蒙占山）',
      categoryLabel: '精选住宿推荐',
      tagline: '在客房前静赏壮美云海，配备私人露天泳池与泰式炭烤猪肉火锅。',
      badgeText: '蒙占山人气住宿',
      discountText: '360度云海景观与私享泳池',
      location: '清迈府蒙占山',
    },
  },
  'sp-2': {
    en: {
      title: 'CNX Service & Tire (Van Brake & Tire Center)',
      categoryLabel: 'Vehicle Maintenance',
      tagline: 'Professional brake inspection, oil change, and tire replacements tailored for passenger vans and commercial vehicles.',
      badgeText: 'Certified Service Center',
      discountText: 'Pre-trip brake and suspension safety checks',
      location: 'Superhighway Road, Chiang Mai',
    },
    zh: {
      title: 'CNX 专业车服与轮胎养护中心（商务车刹车特约）',
      categoryLabel: '车辆保养检修服务',
      tagline: '提供专业刹车制动检查、机油更换及商务运营车辆专用轮胎服务。',
      badgeText: '标准认证服务中心',
      discountText: '出行前刹车底盘全方位安全检测',
      location: '清迈超级高速公路',
    },
  },
  'sp-3': {
    en: {
      title: 'Dhipaya Insurance — Travel & Rental Protection',
      categoryLabel: 'Travel Insurance',
      tagline: 'Travel with complete peace of mind. 24/7 comprehensive coverage for driver, passengers, and vehicle damage.',
      badgeText: 'Travel Insurance',
      discountText: 'Accident and medical emergency travel insurance plans',
      location: 'Nationwide Thailand Coverage',
    },
    zh: {
      title: '德瓦亚保险（Dhipaya）— 旅游出行与租车保障',
      categoryLabel: '旅行安全保险',
      tagline: '出行无忧，全天候24小时为司机、乘客及车辆车损提供全面保障。',
      badgeText: '旅行意外保险',
      discountText: '涵盖意外与医疗救援的专业旅行保障计划',
      location: '全泰国境内有效',
    },
  },
  'sp-4': {
    en: {
      title: 'PT Station & Punthai Coffee',
      categoryLabel: 'Fuel Station & Rest Stop',
      tagline: 'Fueling stations, driver rest areas, and signature Punthai Coffee stops along all major routes in Thailand.',
      badgeText: 'Highway Rest Stop',
      discountText: 'Quality fuel stop and relaxing rest break on your journey',
      location: 'PT Stations Nationwide',
    },
    zh: {
      title: 'PT加油站与攀泰咖啡（Punthai Coffee）',
      categoryLabel: '加油补给与司机驿站',
      tagline: '沿线高品质燃油加注、舒适司机休息区与地道泰式攀泰咖啡。',
      badgeText: '旅途中途休息驿站',
      discountText: '高品质燃油加注与舒适中途休息站',
      location: '全泰PT加油站网络',
    },
  },
  'sp-5': {
    en: {
      title: 'Ran-Tong (Save & Help Elephant Center) Ethical Sanctuary',
      categoryLabel: 'Ethical Elephant Sanctuary',
      tagline: 'Experience ethical elephant care with No Riding & No Chains. Feed, prepare herbal medicine, and bathe elephants in natural mountain streams.',
      badgeText: 'Ethical Sanctuary Mae Taeng',
      discountText: 'Ethical elephant care, feeding & natural stream bathing',
      location: 'Baan Chang, Mae Taeng, Chiang Mai',
    },
    zh: {
      title: 'Ran-Tong（拯救与保护大象中心）清迈伦理大象保护营',
      categoryLabel: '伦理大象生态保护体验',
      tagline: '不骑大象、不戴铁链的纯爱护体验。喂食大象、制作草药保健球并在天然溪流中为大象洗澡（清迈湄登区）。',
      badgeText: '湄登伦理大象保护营',
      discountText: '爱护大象、亲手喂食与溪流洗澡特色体验',
      location: '清迈府湄登县象村',
    },
  },
  'sp-6': {
    en: {
      title: 'Vespa Adventures Chiang Mai — Classic Vespa Tours',
      categoryLabel: 'Tours & Activities',
      tagline: 'Ride vintage Vespas on 5 curated routes: City Highlights, After Dark, Foodie (MICHELIN), Countryside, and Sunrise Monk Blessing.',
      badgeText: 'Classic Vespa City Tour',
      discountText: 'Classic vintage Vespa tours exploring Chiang Mai culture',
      location: 'Chiang Mai, Northern Thailand',
    },
    zh: {
      title: 'Vespa Adventures Chiang Mai — 清迈经典复古踏板车游',
      categoryLabel: '特色体验与旅行团',
      tagline: '乘坐经典Vespa游览清迈5大特色路线：市区精选、夜幕探索、米其林美食之旅、宁静乡野及清晨布施祈福。',
      badgeText: '复古踏板车深度游',
      discountText: '经典复古踏板车文化探访与地道生活体验',
      location: '清迈 / 泰北地区',
    },
  },
  'sp-7': {
    en: {
      title: 'The Connect Chiang Mai',
      categoryLabel: 'Featured Stays',
      tagline: 'Modern loft daily & monthly rooms in a quiet location near Chiang Mai International Airport and Central Airport Plaza, with Coffee Connect cafe & parking.',
      badgeText: 'Airport Area Stay',
      discountText: 'Clean rooms, warm hospitality, on-site cafe and ample parking',
      location: 'Mae Hia, Mueang, Chiang Mai (Near Chiang Mai Intl Airport)',
    },
    zh: {
      title: 'The Connect Chiang Mai（清迈连接酒店/公寓）',
      categoryLabel: '精选推荐住宿',
      tagline: '现代Loft工业风日租与月租客房，环境清幽静谧，临近清迈国际机场与Central商场，内设Coffee Connect咖啡厅及便利停车位。',
      badgeText: '机场便利住宿',
      discountText: '客房整洁舒适、温馨如家，自带精品咖啡厅与充裕车位',
      location: '清迈直辖市湄希区（邻近清迈国际机场）',
    },
  },
  'sp-8': {
    en: {
      title: 'Baan Thip Villa — Scenic Waterfront Pool Villa',
      categoryLabel: 'Riverside Pool Villa',
      tagline: '4-bedroom waterfront retreat featuring a private pool and lush architect-designed gardens. Ideal for families and friend getaways.',
      badgeText: 'Riverside Pool Villa ★4.85',
      discountText: 'Entire 4-bedroom villa with private pool along the Ping River',
      location: 'Riverside, Mueang Chiang Mai, Chiang Mai',
    },
    zh: {
      title: 'Baan Thip Villa — 清迈滨河景观私享泳池别墅',
      categoryLabel: '滨河独栋泳池别墅',
      tagline: '建筑师精心设计的4卧滨河度假别墅，配备私人露天泳池与开阔绿意花园，非常适合家庭与好友包栋聚会。',
      badgeText: '清迈滨河泳池别墅 ★4.85',
      discountText: '整栋独享4间卧室4张床，平河畔私人泳池',
      location: '清迈直辖市平河畔',
    },
  },
  'sp-9': {
    en: {
      title: 'Baan Sri Dha — Charming Wooden House in the City',
      categoryLabel: 'Charming Wooden House',
      tagline: 'Entire 5-bedroom wooden home accommodating 9 guests near Chiang Mai Gate and Wualai Walking Street, including homemade breakfast and free airport transfer.',
      badgeText: 'Top 1% Rated Stay ★4.94',
      discountText: 'Entire 5-bedroom home with free breakfast & airport transfer',
      location: 'Hai Ya, Mueang Chiang Mai (Near Chiang Mai Gate & Walking Street)',
    },
    zh: {
      title: 'Baan Sri Dha — 市区兰纳风情魅力独栋木屋',
      categoryLabel: '兰纳传统风情木屋',
      tagline: '独栋5卧泰式木屋可容纳9人，紧邻清迈门及瓦莱周六夜市，包含手工暖心早餐与免费接送机服务。',
      badgeText: '爱彼迎前1%精选好评 ★4.94',
      discountText: '整栋5卧独享，含自制早餐与免费接送机服务',
      location: '清迈直辖市海雅区（临近清迈门与瓦莱周六步行街）',
    },
  },
  'sp-10': {
    en: {
      title: 'Lanna Apartment — Spacious 5-Bedroom City Center Stay',
      categoryLabel: 'Spacious 5-Bedroom Stay',
      tagline: 'Entire private ground floor with 5 en-suite air-conditioned bedrooms, 3 surrounding living rooms, and outdoor patio for up to 10 guests.',
      badgeText: 'Top 10% Rated Stay ★4.96',
      discountText: 'Free airport transfer · Breakfast available · 287 Mbps fiber Wi-Fi · Free parking',
      location: 'Hai Ya, Mueang Chiang Mai (6-min walk to Chiang Mai Gate Market)',
    },
    zh: {
      title: 'Lanna Apartment — 清迈市中心宽敞舒适5卧套间',
      categoryLabel: '市中心5卧独立套间',
      tagline: '独享建筑首层全层空间，5间全独立卫浴空调卧室、3间环绕式起居客厅及户外露台，最多可舒适容纳10位客人。',
      badgeText: '爱彼迎前10%高分房源 ★4.96',
      discountText: '免费机场接送 · 可选早餐 · 287Mbps极速光纤网络 · 免费专属车位',
      location: '清迈直辖市海雅区（步行6分钟直达清迈门市场）',
    },
  },
  'sp-11': {
    en: {
      title: 'Baan Sri Dha — Lanna Teak House & Yoga Sanctuary',
      categoryLabel: 'Lanna Heritage & Yoga Home',
      tagline: 'Standalone 3-bedroom, 3-bathroom teakwood home for 5 guests with lush green space and private yoga patio near Chiang Mai Gate. Includes homemade breakfast & airport shuttle.',
      badgeText: 'Guest Favorite ★4.96 (477 reviews)',
      discountText: 'Entire 3-bedroom teak home with fresh breakfast + airport shuttle',
      location: 'Hai Ya, Mueang Chiang Mai (6-10 min walk to Chiang Mai Gate & Walking Street)',
    },
    zh: {
      title: 'Baan Sri Dha — 兰纳柚木风情居所与瑜伽花园',
      categoryLabel: '兰纳柚木风情与瑜伽别墅',
      tagline: '独栋柚木兰纳风格3卧3卫住宅（可住5人），坐拥私密绿荫花园与瑜伽露台，临近清迈门，包含自制元气早餐及免费接送机服务。',
      badgeText: '房客最爱 ★4.96（477条好评）',
      discountText: '整栋3卧3卫柚木居所，含每日现做早餐与接送机',
      location: '清迈直辖市海雅区（步行6-10分钟至清迈门与瓦莱周六夜市）',
    },
  },
  'sp-12': {
    en: {
      title: 'Sukjai Home Cooking School Chiang Mai',
      categoryLabel: 'Thai Cooking Workshop',
      tagline: 'Warm home-style Thai cooking class in a countryside garden. Includes local market tour, popular recipes like Khao Soi, Tom Yum, and free roundtrip transfers.',
      badgeText: 'Chiang Mai Cooking Workshop',
      discountText: 'Authentic Thai cooking class in countryside garden + market tour & transfers',
      location: 'Chiang Mai (Free pickup within city limits)',
    },
    zh: {
      title: 'Sukjai Home Cooking School（清迈素克哉泰式家常料理工坊）',
      categoryLabel: '泰式烹饪料理课',
      tagline: '乡村花园风温馨泰式家常料理课，包含当地菜市场食材采购体验，亲手制作清迈咖喱面、冬阴功、泰式炒河粉及免费接送。',
      badgeText: '清迈泰式料理体验',
      discountText: '正宗泰式家常料理课 · 乡村花园环境 · 含菜市场导览与专车接送',
      location: '清迈（含清迈市区免费往返接送）',
    },
  },
};

export function getLocalizedSponsor(sponsor: Sponsor, locale: Locale): Sponsor {
  if (locale === 'th') return sponsor;
  const trans = SPONSOR_TRANSLATIONS[sponsor.id]?.[locale];
  if (!trans) return sponsor;
  return {
    ...sponsor,
    title: trans.title || sponsor.title,
    categoryLabel: trans.categoryLabel || sponsor.categoryLabel,
    tagline: trans.tagline || sponsor.tagline,
    badgeText: trans.badgeText || sponsor.badgeText,
    discountText: trans.discountText || sponsor.discountText,
    location: trans.location || sponsor.location,
  };
}
