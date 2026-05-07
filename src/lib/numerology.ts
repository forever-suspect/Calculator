export type NumerologySystem = 'Pythagorean' | 'Chaldean' | 'Standard';

export const PYTHAGOREAN_CHART: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9
};

export const CHALDEAN_CHART: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8
};

export function reduceNumber(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n; // Master numbers
  if (n < 10) return n;
  const sum = String(n).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  return reduceNumber(sum);
}

export function calculateLifePath(dateStr: string): { total: number, master: boolean, steps: number[] } {
  // Standard Life Path: Sum month, day, year separately then sum together
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { total: 0, master: false, steps: [] };
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  const rYear = reduceNumber(year);
  const rMonth = reduceNumber(month);
  const rDay = reduceNumber(day);

  const total = reduceNumber(rYear + rMonth + rDay);
  return { 
    total, 
    master: total === 11 || total === 22 || total === 33,
    steps: [rMonth, rDay, rYear, rYear + rMonth + rDay, total]
  };
}

export function calculateNameNumber(name: string, system: NumerologySystem): number {
  const chart = system === 'Pythagorean' ? PYTHAGOREAN_CHART : CHALDEAN_CHART;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
  
  let sum = 0;
  for (const char of normalized) {
    sum += chart[char] || 0;
  }
  
  return reduceNumber(sum);
}

export const PATH_DESCRIPTIONS: Record<number, string> = {
  1: "The Leader. Independent, creative, and ambitious. You are a pioneer who creates your own path.",
  2: "The Peacemaker. Cooperative, sensitive, and intuitive. You excel at creating harmony and working behind the scenes.",
  3: "The Communicator. Expressive, social, and artistic. You have a natural talent for self-expression and joy.",
  4: "The Builder. Practical, disciplined, and steady. You provide structure and reliability to the world.",
  5: "The Adventurer. Versatile, freedom-loving, and curious. You thrive on change and new experiences.",
  6: "The Nurturer. Responsible, loving, and protective. You are dedicated to family, community, and service.",
  7: "The Seeker. Analytical, spiritual, and introspective. You weigh the truth and seek hidden meanings.",
  8: "The Powerhouse. Ambitious, efficient, and authoritative. You are destined for material success and leadership.",
  9: "The Humanitarian. Compassionate, generous, and selfless. You are a natural-born counselor and visionary.",
  11: "The Intuitive Messenger (Master Number). Spiritually aware, idealistic, and inspirational. You shine light on others.",
  22: "The Master Builder (Master Number). Visionary and practical. You have the power to turn great dreams into reality.",
  33: "The Master Teacher (Master Number). Altruistic and nurturing. You embody selfless service to humanity."
};
