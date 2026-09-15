import { SPONSORS, Sponsor } from '@/data/mockData';

interface SponsorsDatabase {
  sponsors: Sponsor[];
}

declare global {
  // eslint-disable-next-line no-var
  var __tripdee_sponsors__: SponsorsDatabase | undefined;
}

function getDb(): SponsorsDatabase {
  if (!globalThis.__tripdee_sponsors__) {
    globalThis.__tripdee_sponsors__ = {
      sponsors: [...SPONSORS],
    };
  }
  if (!Array.isArray(globalThis.__tripdee_sponsors__.sponsors)) {
    globalThis.__tripdee_sponsors__.sponsors = [...SPONSORS];
  }
  return globalThis.__tripdee_sponsors__;
}

export function getAllSponsors(): Sponsor[] {
  return getDb().sponsors;
}

export function addSponsor(data: Omit<Sponsor, 'id'> & { id?: string }): Sponsor {
  const db = getDb();
  const newSponsor: Sponsor = {
    ...data,
    id: data.id || `sp-${Date.now().toString().slice(-4)}`,
  };
  db.sponsors.unshift(newSponsor);
  return newSponsor;
}

export function updateSponsor(id: string, updates: Partial<Sponsor>): Sponsor | null {
  const db = getDb();
  const idx = db.sponsors.findIndex((s) => s.id === id);
  if (idx >= 0) {
    db.sponsors[idx] = { ...db.sponsors[idx], ...updates };
    return db.sponsors[idx];
  }
  return null;
}

export function deleteSponsor(id: string): boolean {
  const db = getDb();
  const initialLen = db.sponsors.length;
  db.sponsors = db.sponsors.filter((s) => s.id !== id);
  return db.sponsors.length < initialLen;
}
