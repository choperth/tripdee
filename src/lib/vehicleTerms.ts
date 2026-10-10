import { STANDARD_TERMS, Vehicle, PlateType, InsuranceType } from '@/data/mockData';

/**
 * Service terms a driver controls: normal working hours, overtime, overnight
 * stay, license plate type, insurance tier, and the fuel policy. They are stored inside the free-text `rateNote`
 * column so no Supabase migration is required, and older rows keep working unchanged.
 */
export interface VehicleTerms {
  workHoursPerDay: number;
  workStart?: string;
  workEnd?: string;
  overtimeRatePerHour: number;
  overnightStayRate: number;
  fuelIncluded: boolean;
  /** Driver's extra fuel/toll note. Empty string means "not customised". */
  fuelNote: string;
  plateType?: PlateType;
  insuranceType?: InsuranceType;
}

/** The subset of `Vehicle` the parser can read terms from — every key optional. */
export type VehicleTermsSource = Partial<
  Pick<
    Vehicle,
    | 'rateNote'
    | 'workHoursPerDay'
    | 'workStart'
    | 'workEnd'
    | 'overtimeRatePerHour'
    | 'overnightStayRate'
    | 'fuelIncluded'
    | 'plateType'
    | 'insuranceType'
  >
>;

export const FUEL_INCLUDED_PREFIX = 'ราคารวมน้ำมัน';
export const FUEL_EXCLUDED_PREFIX = 'ไม่รวมน้ำมัน';

/** Machine-readable tag appended to `rateNote`, e.g. `[[td-term:h=10,ot=200,plate=yellow,ins=class1]]` or `td-term[h:10,...]`. */
export const TERMS_TAG_REGEX = /(?:\[\[td-term:([^\]]*)\]\]|td-term\[([^\]]*)\])/;

export const DEFAULT_VEHICLE_TERMS: VehicleTerms = {
  workHoursPerDay: STANDARD_TERMS.workHoursPerDay,
  workStart: STANDARD_TERMS.workStart,
  workEnd: STANDARD_TERMS.workEnd,
  overtimeRatePerHour: STANDARD_TERMS.overtimeRatePerHour,
  overnightStayRate: STANDARD_TERMS.overnightStayRate,
  fuelIncluded: false,
  fuelNote: '',
  plateType: 'yellow',
  insuranceType: 'transport_passenger',
};

/** Parse the `[[td-term:...]]` or `td-term[...]` tag, if present, into partial terms. */
function readTaggedTerms(rateNote: string): Partial<VehicleTerms> {
  const match = rateNote.match(TERMS_TAG_REGEX);
  if (!match) return {};

  const content = match[1] ?? match[2] ?? '';
  const out: Partial<VehicleTerms> = {};
  for (const pair of content.split(',')) {
    const separator = pair.search(/[=:]/);
    if (separator < 0) continue;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!key || !value) continue;

    switch (key) {
      case 'h': {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) out.workHoursPerDay = n;
        break;
      }
      case 'ws':
        out.workStart = value;
        break;
      case 'we':
        out.workEnd = value;
        break;
      case 'ot': {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) out.overtimeRatePerHour = n;
        break;
      }
      case 'stay': {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) out.overnightStayRate = n;
        break;
      }
      case 'fi':
        out.fuelIncluded = value === '1' || value === 'true';
        break;
      case 'plate':
        if (['yellow', 'green', 'blue', 'white'].includes(value)) {
          out.plateType = value as PlateType;
        }
        break;
      case 'ins':
        if (['class1', 'class2_plus', 'transport_passenger', 'compulsory_only'].includes(value)) {
          out.insuranceType = value as InsuranceType;
        }
        break;
      default:
        break;
    }
  }
  return out;
}

/** Pull the legacy fuel prefix + note out of the human-readable part. */
function readFuelText(rateNote: string): { included: boolean | null; note: string } {
  const withoutTag = rateNote.replace(/(?:\[\[td-term:[^\]]*\]\]|td-term\[[^\]]*\])/g, '').trim();
  const human = withoutTag.replace(/\s*•\s*$/, '').trim();
  const stripPrefix = (value: string) => value.replace(/^\s*•\s*/, '').trim();

  if (human.startsWith(FUEL_INCLUDED_PREFIX)) {
    return { included: true, note: stripPrefix(human.slice(FUEL_INCLUDED_PREFIX.length)) };
  }
  if (human.startsWith(FUEL_EXCLUDED_PREFIX)) {
    return { included: false, note: stripPrefix(human.slice(FUEL_EXCLUDED_PREFIX.length)) };
  }
  return { included: null, note: '' };
}

/** Strip machine-readable terms tag from rate note so it never leaks into UI */
export function stripTermsTag(rateNote?: string): string {
  if (!rateNote) return '';
  return rateNote
    .replace(/(?:\[\[td-term:[^\]]*\]\]|td-term\[[^\]]*\])/g, '')
    .replace(/\s*•\s*$/, '')
    .replace(/^\s*•\s*/, '')
    .trim();
}

/**
 * Resolve the terms for a vehicle. Priority: explicit vehicle fields, then the
 * encoded tag, then the legacy fuel prefix, then `STANDARD_TERMS` defaults.
 */
export function parseVehicleTerms(vehicle: VehicleTermsSource | null | undefined): VehicleTerms {
  const terms: VehicleTerms = { ...DEFAULT_VEHICLE_TERMS };
  const rateNote = vehicle?.rateNote ?? '';

  Object.assign(terms, readTaggedTerms(rateNote));

  if (typeof vehicle?.workHoursPerDay === 'number' && vehicle.workHoursPerDay > 0) {
    terms.workHoursPerDay = vehicle.workHoursPerDay;
  }
  if (vehicle?.workStart) terms.workStart = vehicle.workStart;
  if (vehicle?.workEnd) terms.workEnd = vehicle.workEnd;
  if (typeof vehicle?.overtimeRatePerHour === 'number' && vehicle.overtimeRatePerHour >= 0) {
    terms.overtimeRatePerHour = vehicle.overtimeRatePerHour;
  }
  if (typeof vehicle?.overnightStayRate === 'number' && vehicle.overnightStayRate >= 0) {
    terms.overnightStayRate = vehicle.overnightStayRate;
  }
  if (typeof vehicle?.fuelIncluded === 'boolean') terms.fuelIncluded = vehicle.fuelIncluded;
  if (vehicle?.plateType) terms.plateType = vehicle.plateType;
  if (vehicle?.insuranceType) terms.insuranceType = vehicle.insuranceType;

  const fuel = readFuelText(rateNote);
  if (typeof vehicle?.fuelIncluded !== 'boolean' && fuel.included !== null) {
    terms.fuelIncluded = fuel.included;
  }
  if (fuel.note) terms.fuelNote = fuel.note;

  return terms;
}

/**
 * Serialise terms back into `rateNote`. Returns `undefined` when everything is
 * at its default and there is no fuel note, so untouched listings stay clean.
 */
export function encodeRateNoteWithTerms(terms: VehicleTerms): string | undefined {
  const note = terms.fuelNote.trim();
  const isDefault =
    terms.workHoursPerDay === DEFAULT_VEHICLE_TERMS.workHoursPerDay &&
    terms.overtimeRatePerHour === DEFAULT_VEHICLE_TERMS.overtimeRatePerHour &&
    terms.overnightStayRate === DEFAULT_VEHICLE_TERMS.overnightStayRate &&
    !terms.fuelIncluded &&
    (!terms.plateType || terms.plateType === DEFAULT_VEHICLE_TERMS.plateType) &&
    (!terms.insuranceType || terms.insuranceType === DEFAULT_VEHICLE_TERMS.insuranceType);

  if (isDefault && !note) return undefined;

  const fuelPrefix = terms.fuelIncluded ? FUEL_INCLUDED_PREFIX : FUEL_EXCLUDED_PREFIX;
  const human = terms.fuelIncluded || note ? `${fuelPrefix}${note ? ` • ${note}` : ''}` : '';

  const parts: string[] = [
    `h=${terms.workHoursPerDay}`,
    terms.workStart ? `ws=${terms.workStart}` : '',
    terms.workEnd ? `we=${terms.workEnd}` : '',
    `ot=${terms.overtimeRatePerHour}`,
    `stay=${terms.overnightStayRate}`,
    `fi=${terms.fuelIncluded ? 1 : 0}`,
    terms.plateType ? `plate=${terms.plateType}` : '',
    terms.insuranceType ? `ins=${terms.insuranceType}` : '',
  ].filter(Boolean);

  const tag = `[[td-term:${parts.join(',')}]]`;

  return [human, tag].filter(Boolean).join(' • ');
}
