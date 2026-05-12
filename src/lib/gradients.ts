const PALETTES: [string, string][] = [
  ["#D97757", "#F0C4B0"],
  ["#7B8FA1", "#C4D4DF"],
  ["#8A7BA1", "#C9C1D9"],
  ["#6A9E7F", "#B8D9C5"],
  ["#A18A5A", "#D9C99B"],
  ["#9E6A6A", "#D9AAAA"],
  ["#5A7EA1", "#A0C0D9"],
  ["#A17A5A", "#D9C0A0"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientForId(id: string): string {
  const [from, to] = PALETTES[hashString(id) % PALETTES.length];
  const angle = (hashString(id + "angle") % 120) + 120;
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}
