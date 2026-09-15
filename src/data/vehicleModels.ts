/**
 * Comprehensive Vehicle Models Registry for TripDee Thailand
 * Covers commercial vans, VIP luxury MPVs, minibuses, SUVs, and passenger cars.
 */

export interface VehicleModelItem {
  id: string;
  name: string;
  category: 'van' | 'luxury_mpv' | 'minibus' | 'suv' | 'sedan' | 'other';
  categoryName: string;
  typicalSeats: number;
  type: 'van' | 'suv' | 'car';
}

export interface VehicleCategoryGroup {
  category: string;
  label: string;
  icon: string;
  models: string[];
}

export const VEHICLE_CATEGORY_GROUPS: VehicleCategoryGroup[] = [
  {
    category: 'van',
    label: '🚐 รถตู้ยอดนิยม / Commercial Van (9-14 ที่นั่ง)',
    icon: '🚐',
    models: [
      'Toyota Commuter D4D (หลังคาสูง 9-13 ที่นั่ง)',
      'All New Toyota Commuter GD (เครื่อง 2.8 VIP)',
      'Toyota HiAce (หลังคาเตี้ย / Eco Commuter)',
      'Hyundai H-1 (Deluxe / Elite 11 ที่นั่ง)',
      'Nissan Urvan / NV350 (9-14 ที่นั่ง)',
      'Ford Transit (หลังคาสูง 11-14 ที่นั่ง)',
    ],
  },
  {
    category: 'luxury_mpv',
    label: '✨ รถตู้พรีเมียม / Luxury VIP MPV (4-11 ที่นั่ง)',
    icon: '✨',
    models: [
      'Toyota Majesty (VIP Executive เบาะ Captain Seats 7-11 ที่นั่ง)',
      'Toyota Alphard / Vellfire (Super VIP First Class 4-7 ที่นั่ง)',
      'Hyundai Staria (VIP สไตล์โมเดิร์น 9-11 ที่นั่ง)',
      'Hyundai Custin (พรีเมียม MPV 7 ที่นั่ง)',
      'Mercedes-Benz Vito / V-Class (ยุโรป VIP พรีเมียม)',
      'MG Maxus 9 / Maxus 7 (EV ไฟฟ้าพรีเมียม 100%)',
      'Kia Carnival / Grand Carnival (7-11 ที่นั่ง)',
      'Denza D9 / Zeekr 009 (Ultra Luxury EV)',
    ],
  },
  {
    category: 'minibus',
    label: '🚌 มินิบัส / ไมโครบัส สำหรับกรุ๊ปสัมมนา (16-24 ที่นั่ง)',
    icon: '🚌',
    models: [
      'Toyota Coaster (มินิบัส VIP พรีเมียม 20 ที่นั่ง)',
      'Hino Liesse II (มินิบัสท่องเที่ยว 20-22 ที่นั่ง)',
      'Isuzu Minibus (มินิบัสพาณิชย์ 20-24 ที่นั่ง)',
      'Hyundai County (มินิบัสท่องเที่ยว 18-22 ที่นั่ง)',
    ],
  },
  {
    category: 'suv',
    label: '🚙 รถยนต์ SUV / MPV ครอบครัวลุยดอย (5-7 ที่นั่ง)',
    icon: '🚙',
    models: [
      'Toyota Fortuner (SUV 7 ที่นั่ง ขับเคลื่อน 4 ล้อ)',
      'Isuzu MU-X (SUV 7 ที่นั่ง นุ่มนวลประหยัดน้ำมัน)',
      'Ford Everest (SUV พรีเมียม 7 ที่นั่ง)',
      'Mitsubishi Pajero Sport (SUV 7 ที่นั่ง)',
      'Toyota Innova Zenix / Crysta (MPV 7 ที่นั่ง)',
      'Mitsubishi Xpander / Toyota Veloz (Mini MPV 7 ที่นั่ง)',
      'Honda CR-V / HR-V (Crossover 5-7 ที่นั่ง)',
    ],
  },
  {
    category: 'sedan',
    label: '🚗 รถเก๋ง / Sedan ผู้บริหาร & ขับเอง (4-5 ที่นั่ง)',
    icon: '🚗',
    models: [
      'Toyota Camry (Sedan พรีเมียม ผู้บริหาร)',
      'Honda Accord (Sedan พรีเมียม ผู้บริหาร)',
      'Mercedes-Benz E-Class / C-Class (ยุโรปพรีเมียม)',
      'Toyota Yaris Ativ / Honda City (Sedan Eco Car)',
      'Toyota Yaris Cross (Compact SUV ขับคล่องตัว)',
    ],
  },
];

export const ALL_VEHICLE_MODELS: string[] = VEHICLE_CATEGORY_GROUPS.flatMap((g) => g.models);

export const SEAT_CAPACITY_OPTIONS = [
  { value: 'all', label: 'ทุกขนาดที่นั่ง (4 - 24 ที่นั่ง)' },
  { value: '4-5', label: '4 - 5 ที่นั่ง (Sedan / Eco Car / Compact SUV)' },
  { value: '7', label: '7 ที่นั่ง (VIP MPV / SUV 7 ที่นั่ง)' },
  { value: '9', label: '9 ที่นั่ง (VIP Van เบาะใหญ่ยอดนิยม)' },
  { value: '10', label: '10 ที่นั่ง (VIP Commuter / Staria)' },
  { value: '11-14', label: '11 - 14 ที่นั่ง (Commuter / HiAce / H1)' },
  { value: '20', label: '16 - 24 ที่นั่ง (มินิบัส Coaster / กรุ๊ปสัมมนา)' },
];
