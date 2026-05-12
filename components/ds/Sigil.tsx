const SIGIL_NAMES = [
  "fern",
  "frond",
  "ivy",
  "moss",
  "oak",
  "seed",
  "shell",
  "sprig",
  "stem",
  "willow",
] as const;

export type SigilName = (typeof SIGIL_NAMES)[number];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function sigilFor(id: string): SigilName {
  return SIGIL_NAMES[hash(id) % SIGIL_NAMES.length];
}

interface Props {
  name?: SigilName;
  id?: string;
  size?: number;
  className?: string;
}

export function Sigil({ name, id, size = 64, className = "" }: Props) {
  const chosen = name ?? (id ? sigilFor(id) : "fern");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/sigils/${chosen}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}
