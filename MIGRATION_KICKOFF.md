# Mesocosm migration + practical plaque — kickoff

Self-contained brief for picking this work up cold. Read this end-to-end before touching code; do not re-derive the plan.

## Context

**BenchAnything** is a distributed evaluation protocol for AI agents. Clients own environments ("Domains"); the platform runs agents against them, records traces, and ranks runs on a leaderboard. The data model lives in Python pydantic at `src/core/*.py` (canonical source of truth) with a FastAPI surface at `src/api/`. There's a SQLite orchestrator DB at `data/orchestrator.db`.

Two UI surfaces exist in this repo:

- **`ui/`** — Next.js 16 + React 19 + TypeScript 5 + Tailwind v4. Routes: `/` (marketplace), `/domains/[id]`, `/developer`. Already wired to FastAPI via a (currently absent) `lib/api.ts`. ~1,300 lines across 10 components. Uses a warm cream/coral aesthetic with `font-display`, "Gold Benchmark" pills.
- **`uiv2/`** — A babel-standalone HTML+JSX prototype (no toolchain). Contains:
  - `BenchAnything Design System (1)/` — the new **Mesocosm "field-guide" design system**: paper-and-ink, Cormorant Garamond + Jost, single leaf-green accent, dictionary-entry hero, sigils, plaques. See its `SKILL.md` for the rules.
  - `benchanything mock lander + animation (3)/` — a marketing lander built against the system. Includes two **showcase plaques** with bespoke per-env animations (Connections, Day Trader). Has a working dark-mode toggle ("night reading"). Local server: `python3 -m http.server 8765` from that folder; URL: <http://localhost:8765/BenchAnything%20Landing.html>.

Two commits live on `main` ahead of `origin/main` (not yet pushed):

- `92f28f2` — Add BenchAnything design system + restyle lander to dictionary-entry aesthetic
- `b16e142` — Add dark mode ("night reading") to design system + lander

Do not push without explicit user approval.

## The decision (do not relitigate)

We considered using **Claude Design** to mock a "practical, data-backed gallery item" alongside the existing showcase plaques. We rejected that path. Reason: the practical plaque's value is being **type-locked to the live data model** (`Domain`, `BindingVow`, `LeaderboardEntry`); a sandboxed visual mock cannot validate that, and the schema will evolve. We are doing this locally in TypeScript, in the existing `ui/` Next.js scaffold, against real types — and treating it as the **first slice** of a broader migration that brings the Mesocosm design system into `ui/`.

The babel-standalone prototype at `uiv2/` is now the "vintage reference" — keep it for visual context (especially the dark mode and the showcase plaques) until the showcase plaques get ported as bespoke routes in `ui/` later. Do not delete it.

## IA reframe

Going forward the gallery splits into two surfaces:

- **`/gallery`** (practical, main entry) — uniform data-driven cards. Every published `Domain` renders here automatically with the same plaque shape. The card content is the binding-vow contract + live operational data + actionable CTAs hitting real endpoints. The bread and butter.
- **`/showcase`** (separate, curated) — a small set of hand-crafted environments with bespoke per-env animations. Connections and Day Trader become the first two showcase entries. Marketing-focused; not the bar to entry.

This kickoff is scoped to the **practical plaque + the migration prerequisites**. Showcase routes come later.

## Mission, in order

1. **Sanity check** — read `ui/components/*.tsx` and `ui/app/page.tsx` to ground yourself in what's already there. Read `uiv2/BenchAnything Design System (1)/SKILL.md` and `colors_and_type.css` for the design rules. Read `src/core/binding_vow.py`, `src/core/domain.py`, `src/core/run.py`, `src/core/scoring.py` for the canonical data model.
2. **Port Mesocosm tokens into `ui/`.** Tailwind v4 reads CSS variables directly via `@theme` blocks. Add the contents of `uiv2/BenchAnything Design System (1)/colors_and_type.css` (light + dark) to `ui/app/globals.css`, exposed as Tailwind theme tokens. Self-host the four font files (Cormorant Garamond regular + italic, Jost regular + italic) under `ui/public/fonts/` and add the `@font-face` rules. Do not bring in EB Garamond / Inter / Libre Baskerville / JetBrains Mono — those belonged to the old warm-clay system. Keep Tailwind, do not rip it out.
3. **Create the type definitions.** If `ui/lib/api.ts` does not exist, create it with TypeScript interfaces that mirror the pydantic models below. If it does exist (gitignored), align it. Long-term: codegen these from FastAPI's OpenAPI spec; for now, hand-write them and keep them honest.
4. **Build a small primitives layer** at `ui/components/ds/` (or similar): `<Eyebrow>`, `<ItalicEm>`, `<Sigil>` (sigils live as SVGs at `uiv2/BenchAnything Design System (1)/assets/sigils/`; copy the ten of them — fern, frond, ivy, moss, oak, seed, shell, sprig, stem, willow — into `ui/public/sigils/` and pick by stable hash of `domain.id`), `<Plaque>` (the shared shell — vellum plate, body, three-figure metric strip), `<Btn>` (primary / ghost / link variants from the lander), `<ThemeToggle>` (the leaf-glyph toggle — see the existing one in `uiv2/.../landing.jsx`).
5. **Build `<PracticalPlaque>`** at `ui/components/PracticalPlaque.tsx` against the spec below, with mocked data inline.
6. **Wire to the live API.** Implement `listDomains({ publishedOnly })` and `getLeaderboard(domainId)` in `lib/api.ts` against `GET /v1/domains?published=true` and `GET /v1/leaderboards/{domain_id}`. Render the practical gallery at `/gallery` — server component that fetches both, hands them to a client `<PracticalGallery>` for tag filtering.
7. **Stop there.** Do not restyle the existing `MarketplaceClient` at `/`, do not touch `/developer`, do not touch `/domains/[id]`. Those are subsequent slices. The goal of this slice is: a working, type-safe, design-system-correct `/gallery` page wired to real data, alongside the existing untouched routes.

## The data model (for `lib/api.ts`)

Translate verbatim from `src/core/*.py`. Field summary (full source in those files):

```ts
type Tier = "tier1" | "tier2";
type DomainStatus = "draft" | "testing" | "published" | "archived";
type RunStatus = "pending" | "running" | "completed" | "failed";
type EpStatus = "pending" | "running" | "completed" | "failed" | "timeout";
type EndpointMode = "remote" | "sandbox";
type SpaceType = "discrete" | "continuous" | "text" | "json" | "image" | "multi_modal" | "composite";
type RewardType = "scalar" | "vector" | "sparse" | "binary";
type Observability = "full" | "partial";
type AggKind = "mean" | "median" | "max" | "min" | "sum" | "pass_rate";
type MetricKind = "episode_reward" | "terminal_field" | "trajectory_judge" | "human_judge";

interface SpaceSpec {
  type: SpaceType;
  dtype?: string;
  shape?: number[];
  bounds?: { low: number; high: number };
  enum_values?: string[];
  schema_ref?: string;
  description: string;
}
interface CompositeSpace { fields: Record<string, SpaceSpec | CompositeSpace>; }
interface RewardSpec { type: RewardType; range?: { low: number; high: number }; description: string; }
interface EpisodeSemantics {
  max_steps?: number; max_wall_seconds?: number;
  deterministic_reset: boolean; supports_seed: boolean;
  parallel_episodes: number; observability: Observability;
}
interface TechniqueDeclaration {
  technique_id: string; version: string;
  config_schema?: Record<string, unknown>; required: boolean;
}
interface BindingVow {
  id: string; version: string; domain_id: string; tier: Tier;
  observation_space: SpaceSpec | CompositeSpace;
  action_space: SpaceSpec | CompositeSpace;
  reward: RewardSpec; episode: EpisodeSemantics;
  techniques: TechniqueDeclaration[];
  metadata: Record<string, unknown>; description: string;
}
interface EnvironmentEndpoint {
  mode: EndpointMode; url?: string; image?: string;
  resources?: { cpu: string; memory: string; gpu?: string; timeout_seconds: number };
}
interface MetricDef { name: string; type: MetricKind; aggregation: AggKind; field?: string; }
interface ScoringConfig { primary_metric: string; metrics: MetricDef[]; higher_is_better: boolean; }
interface VersionEntry { version: string; date: string; changes: string; }

interface Domain {
  id: string; name: string; owner_id: string;
  binding_vow: BindingVow;
  endpoint: EnvironmentEndpoint;
  scoring: ScoringConfig;
  status: DomainStatus;
  tags: string[];
  detail: string; pricing: string;
  version_history: VersionEntry[];
  image_url?: string; profile_picture_url?: string;
  has_gold_benchmark: boolean;
}
interface LeaderboardEntry {
  run_id: string; model: string; binding_vow_version: string;
  num_episodes: number; primary_score: number; all_scores: Record<string, number>;
}
```

## `<PracticalPlaque>` — exact spec

Each line is a designed slot. Field references map to the model above.

1. **Eyebrow row** — left: italic Cormorant tier numeral (`i.` for tier1, `ii.` for tier2) followed by italic owner name (`{owner_id}`). Right: gold-benchmark mark if `has_gold_benchmark`; otherwise a status pill if `status !== "published"` (draft / testing / archived).
2. **Plate** — vellum panel containing the env's sigil (stable hash of `domain.id` → one of the ten sigils) AND a **binding-vow contract chip**: a single horizontal glyph reading `{obs.type} → {action.type}{action.enum_values ? "[" + action.enum_values.length + "]" : ""} → {reward.type}`. e.g. `text → discrete[4] → binary` or `composite → json → sparse`. Set in Jost caps ≤ 11px, hairline rule above and below, ≤ 36px tall total. **This chip is the practical plaque's signature visual moment** — it is what replaces the bespoke per-env animation that showcase plaques carry.
3. **Title** — `domain.name`, Cormorant 24px / weight 500 / tracking -0.012em.
4. **Owner line** — `{owner_id} · v{binding_vow.version}` in Jost 11 muted.
5. **One-liner** — `domain.detail`, Jost 12.5px, line-clamp 2.
6. **Tag row** — first three of `domain.tags` rendered as the existing `.tag` style, plus a tier chip and a mode chip (`remote` / `sandbox` from `endpoint.mode`).
7. **Mini-leaderboard strip** — three rows, hairline-separated. Each row: rank (italic Cormorant numeral, `i / ii / iii`), model (Jost 11 caps), primary_score (italic Cormorant old-style figures, value rounded to 3 decimals). Empty state: a single italic Cormorant line "be the first to bench" linking to the run-creation flow.
8. **Three-figure metric strip** (same shape as showcase plaque): `primary_score top` / `runs · 7d` / `models tracked`. If status ≠ published, collapse to "draft · n/a · n/a" muted.
9. **CTA row** — primary `Start a run` button (ink bg → leaf-deep on hover, leaf-deep bg in dark mode), secondary link `Read the vow →` to `/domains/{id}`.

### States

- **Active, populated** — published, ≥ 1 completed run; populate rows + metrics from real data.
- **Active, empty** — published, 0 runs; "be the first to bench" italic line replaces the leaderboard strip; primary CTA still active.
- **In-development** — `status` is `draft` or `testing`; muted tones, no Start CTA, only Read the vow.
- **Gold benchmark** — `has_gold_benchmark === true`; gold-tinted mark in eyebrow + thin gold hairline above the metric strip. Gold is a **deliberate scoped exception** to the single-accent rule for this one mark. Nothing else on the card uses gold.

## Design rules (do not break)

From `uiv2/BenchAnything Design System (1)/SKILL.md`:

- Cormorant Garamond for display; Jost for everything else. Italic-leaf for one phrase per heading.
- White paper, formal black ink, one leafy-green accent. No second hue except the scoped gold-benchmark mark.
- No gradients except the leaf-mark itself.
- 2px or 999px radii; nothing in between. Borders, not shadows.
- Italic Cormorant old-style figures for editorial numerals (leaderboard rank + score, metric strip values). Tabular Jost numerals for tables.
- Sentence case in UI; lowercase for the wordmark; ALL CAPS only for eyebrows and CAPS labels.
- No emoji, no photography, no generated illustration.
- Card must look at home next to the showcase plaque but read as visibly **different** — the binding-vow contract chip vs the bespoke animation is the primary tell.

## Verification

```bash
cd ui
npm install   # or pnpm install
npm run dev   # → http://localhost:3000
```

Smoke checklist before declaring the slice done:

- `/gallery` renders without TypeScript errors.
- All four states of `<PracticalPlaque>` render correctly (active-populated, active-empty, in-development, gold-benchmark) — verify by mocking three Domains in addition to whatever the API returns.
- Dark mode toggle works (the leaf-glyph toggle from the lander, ported into the new nav primitive).
- The contract chip renders correctly for at least these three obs/action shapes: `text → discrete[4] → binary` (simple-trivia), `composite → json → sparse` (browser agent), `json → discrete → scalar` (negotiation).
- Leaderboard strip renders 3 entries when `LeaderboardEntry[]` has ≥3, fewer when not, and the empty-state italic line when `.length === 0`.
- Tailwind v4 is still active and resolving the new `--paper`, `--ink`, `--leaf-deep` etc. tokens.
- `/`, `/developer`, `/domains/[id]` are visually unchanged — this slice does not touch them.

## Things explicitly NOT in scope

- Restyling the existing marketplace at `/`, the developer dashboard at `/developer`, or the domain detail page at `/domains/[id]`. They keep their cream/coral look until later slices.
- Porting the showcase plaques (Connections, Day Trader) into `ui/`. Those become bespoke routes under `/showcase/[slug]` later. Reference their visuals in `uiv2/` for now.
- Pushing the two ahead-of-origin commits.
- Touching the FastAPI backend or pydantic models. The data model is correct as-is.
- Generating types from OpenAPI. Hand-write `lib/api.ts` for now; codegen is a follow-up slice.
- Removing Tailwind. Keep it; the Mesocosm tokens layer cleanly on top.

## When in doubt

- Design questions → `uiv2/BenchAnything Design System (1)/SKILL.md` and the existing lander in `uiv2/benchanything mock lander + animation (3)/`. The dark-mode rules in particular live in the SKILL doc.
- Data model questions → `src/core/*.py`, then `src/api/routes/*.py` for the endpoint surface.
- Field semantics questions → `design_doc.md` at the repo root has the long-form spec.
- Anything about the warm cream/coral aesthetic in the existing `ui/components/*` — that is the **old** system. It is being phased out. Do not preserve it; replace it as you go in subsequent slices, but keep it untouched in this one.
