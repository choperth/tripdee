import { SPONSORS, Sponsor } from '@/data/mockData';
import { isMockDataEnabled } from '@/lib/mockConfig';

interface SponsorsDatabase {
  sponsors: Sponsor[];
}

declare global {
  var __tripdee_sponsors__: SponsorsDatabase | undefined;
}

function getDb(): SponsorsDatabase {
  if (!globalThis.__tripdee_sponsors__) {
    globalThis.__tripdee_sponsors__ = {
      sponsors: isMockDataEnabled() ? [...SPONSORS] : [],
    };
  }
  if (!Array.isArray(globalThis.__tripdee_sponsors__.sponsors)) {
    globalThis.__tripdee_sponsors__.sponsors = isMockDataEnabled() ? [...SPONSORS] : [];
  } else if (isMockDataEnabled()) {
    const mockIds = new Set(SPONSORS.map((s) => s.id));
    globalThis.__tripdee_sponsors__.sponsors = globalThis.__tripdee_sponsors__.sponsors.filter(
      (s) => !s.id.startsWith('sp-') || mockIds.has(s.id)
    );
    for (const mockSp of SPONSORS) {
      const existing = globalThis.__tripdee_sponsors__.sponsors.find((s) => s.id === mockSp.id);
      if (!existing) {
        globalThis.__tripdee_sponsors__.sponsors.push(mockSp);
      } else {
        existing.image = mockSp.image;
        existing.title = mockSp.title;
        existing.tagline = mockSp.tagline;
        existing.discountText = mockSp.discountText;
        existing.category = mockSp.category;
        existing.categoryLabel = mockSp.categoryLabel;
      }
    }
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
