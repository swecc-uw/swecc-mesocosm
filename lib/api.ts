// TypeScript surface for the FastAPI backend at src/api.
// Hand-translated from src/core/*.py and src/api/routes/*.py.
// Long-term: codegen from OpenAPI. For now, keep this honest.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// ── Enums ──────────────────────────────────────────────────────────
export type Tier = "tier1" | "tier2";
export type DomainStatus = "draft" | "testing" | "published" | "archived";
export type RunStatus = "pending" | "running" | "completed" | "failed";
export type EpStatus = "pending" | "running" | "completed" | "failed" | "timeout";
export type EndpointMode = "remote" | "sandbox";
export type SpaceType =
  | "discrete"
  | "continuous"
  | "text"
  | "json"
  | "image"
  | "multi_modal"
  | "composite";
export type RewardType = "scalar" | "vector" | "sparse" | "binary";
export type Observability = "full" | "partial";
export type AggKind = "mean" | "median" | "max" | "min" | "sum" | "pass_rate";
export type MetricKind =
  | "episode_reward"
  | "terminal_field"
  | "trajectory_judge"
  | "human_judge";

// ── Spaces ─────────────────────────────────────────────────────────
export interface SpaceSpec {
  type: SpaceType;
  dtype?: string;
  shape?: number[];
  bounds?: { low: number; high: number };
  enum_values?: string[];
  schema_ref?: string;
  description: string;
}

export interface CompositeSpace {
  fields: Record<string, SpaceSpec | CompositeSpace>;
}

export type AnySpace = SpaceSpec | CompositeSpace;

export function isCompositeSpace(s: AnySpace): s is CompositeSpace {
  return (s as CompositeSpace).fields !== undefined;
}

// ── Reward / episode / techniques ──────────────────────────────────
export interface RewardSpec {
  type: RewardType;
  range?: { low: number; high: number };
  description: string;
}

export interface EpisodeSemantics {
  max_steps?: number;
  max_wall_seconds?: number;
  deterministic_reset: boolean;
  supports_seed: boolean;
  parallel_episodes: number;
  observability: Observability;
}

export interface TechniqueDeclaration {
  technique_id: string;
  version: string;
  config_schema?: Record<string, unknown>;
  required: boolean;
}

// ── Binding vow ────────────────────────────────────────────────────
export interface BindingVow {
  id: string;
  version: string;
  domain_id: string;
  tier: Tier;
  observation_space: AnySpace;
  action_space: AnySpace;
  reward: RewardSpec;
  episode: EpisodeSemantics;
  techniques: TechniqueDeclaration[];
  metadata: Record<string, unknown>;
  description: string;
}

// ── Endpoint / scoring / version ───────────────────────────────────
export interface ResourceSpec {
  cpu: string;
  memory: string;
  gpu?: string;
  timeout_seconds: number;
}

export interface EnvironmentEndpoint {
  mode: EndpointMode;
  url?: string;
  image?: string;
  resources?: ResourceSpec;
}

export interface MetricDef {
  name: string;
  type: MetricKind;
  aggregation: AggKind;
  field?: string;
}

export interface ScoringConfig {
  primary_metric: string;
  metrics: MetricDef[];
  higher_is_better: boolean;
}

export interface VersionEntry {
  version: string;
  date: string;
  changes: string;
}

// ── Domain ─────────────────────────────────────────────────────────
export interface Domain {
  id: string;
  name: string;
  owner_id: string;
  binding_vow: BindingVow;
  endpoint: EnvironmentEndpoint;
  scoring: ScoringConfig;
  status: DomainStatus;
  tags: string[];
  detail: string;
  pricing: string;
  version_history: VersionEntry[];
  image_url?: string;
  profile_picture_url?: string;
  has_gold_benchmark: boolean;
}

// ── Leaderboard / runs ─────────────────────────────────────────────
export interface LeaderboardEntry {
  run_id: string;
  model: string;
  binding_vow_version: string;
  num_episodes: number;
  primary_score: number;
  all_scores: Record<string, number>;
}

export interface AgentConfig {
  model: string;
  system_prompt?: string;
  techniques?: { technique_id: string; params: Record<string, unknown> }[];
  temperature?: number;
  max_tokens?: number;
}

export interface RunConfig {
  domain_id: string;
  binding_vow_version: string;
  agent_config: AgentConfig;
  seed_set?: number[];
  num_episodes: number;
  max_parallel?: number;
}

export interface Run {
  id: string;
  config: RunConfig;
  requester_id: string;
  status: RunStatus;
  created_at: string;
  completed_at?: string;
  scores: Record<string, number>;
}

export interface Episode {
  id: string;
  run_id: string;
  seed?: number;
  status: EpStatus;
  started_at?: string;
  ended_at?: string;
  steps: number;
  total_reward: number;
  terminal_info: Record<string, unknown>;
}

// ── Developer environments ─────────────────────────────────────────
export interface DeveloperEnvironment {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  github_url: string;
  status: string;
  domain_id: string | null;
  env_url: string | null;
  error_message: string | null;
  created_at: string;
}

// ── Bench ──────────────────────────────────────────────────────────
export interface BenchJob {
  id: string;
  env_id: string;
  domain_id: string | null;
  github_url: string;
  status: "queued" | "running" | "completed" | "failed";
  model_results: Record<string, { run_id: string | null; status: string; primary_score: number | null }> | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DevBenchStatus {
  busy: boolean;
}

export interface EnvPollResult {
  id: string;
  status: string;
  domain_id: string | null;
  env_url: string | null;
  error_message: string | null;
}

export interface TestBenchRequest {
  env_id: string;
  model: string;
  num_episodes?: number;
  seed?: number;
}

export const SUPPORTED_MODELS: { id: string; label: string }[] = [
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "openai/gpt-4o",               label: "GPT-4o" },
  { id: "google/gemini-2.0-flash",     label: "Gemini 2.0 Flash" },
  { id: "deepseek/deepseek-chat",      label: "DeepSeek Chat" },
  { id: "xai/grok-2",                  label: "Grok 2" },
];

export interface DomainUsageStats {
  domain_id: string;
  total_runs: number;
  total_episodes: number;
  avg_score: number | null;
  best_score: number | null;
  leaderboard_entries: number;
}

export interface DeveloperEnvironmentWithUsage extends DeveloperEnvironment {
  usage: DomainUsageStats | Record<string, never>;
}

// ── Fetcher helpers ────────────────────────────────────────────────
async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Domain endpoints ───────────────────────────────────────────────
export async function listDomains(
  opts: { publishedOnly?: boolean } = {},
): Promise<Domain[]> {
  const q = opts.publishedOnly ? "?published=true" : "";
  return getJson<Domain[]>(`/v1/domains${q}`);
}

export async function getDomain(id: string): Promise<Domain> {
  return getJson<Domain>(`/v1/domains/${encodeURIComponent(id)}`);
}

// ── Leaderboard ────────────────────────────────────────────────────
export async function getLeaderboard(
  domainId: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  return getJson<LeaderboardEntry[]>(
    `/v1/leaderboards/${encodeURIComponent(domainId)}?limit=${limit}`,
  );
}

// ── Runs ───────────────────────────────────────────────────────────
export async function createRun(config: RunConfig): Promise<Run> {
  return getJson<Run>(`/v1/runs`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function listRuns(domainId?: string): Promise<Run[]> {
  const q = domainId ? `?domain_id=${encodeURIComponent(domainId)}` : "";
  return getJson<Run[]>(`/v1/runs${q}`);
}

export async function getRun(runId: string): Promise<Run> {
  return getJson<Run>(`/v1/runs/${encodeURIComponent(runId)}`);
}

export async function listRunEpisodes(runId: string): Promise<Episode[]> {
  return getJson<Episode[]>(`/v1/runs/${encodeURIComponent(runId)}/episodes`);
}

// ── Developer ──────────────────────────────────────────────────────
export async function listDeveloperEnvironments(
  ownerId?: string,
): Promise<DeveloperEnvironment[]> {
  const q = ownerId ? `?owner_id=${encodeURIComponent(ownerId)}` : "";
  return getJson<DeveloperEnvironment[]>(`/v1/developer/environments${q}`);
}

export async function submitDeveloperEnvironment(req: {
  owner_id: string;
  name: string;
  description?: string;
  github_url: string;
}): Promise<DeveloperEnvironment> {
  return getJson<DeveloperEnvironment>(`/v1/developer/environments`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function pollEnvStatus(envId: string): Promise<EnvPollResult> {
  return getJson<EnvPollResult>(
    `/v1/developer/environments/${encodeURIComponent(envId)}/poll`,
  );
}

export async function retryEnvironment(envId: string): Promise<DeveloperEnvironment> {
  return getJson<DeveloperEnvironment>(
    `/v1/developer/environments/${encodeURIComponent(envId)}/retry`,
    { method: "POST" },
  );
}

export async function deleteEnvironment(envId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/developer/environments/${encodeURIComponent(envId)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
}

export async function publishDomain(domainId: string): Promise<Domain> {
  return getJson<Domain>(
    `/v1/domains/${encodeURIComponent(domainId)}/publish`,
    { method: "POST" },
  );
}

// ── Bench ──────────────────────────────────────────────────────────
export async function getDevBenchStatus(): Promise<DevBenchStatus> {
  return getJson<DevBenchStatus>(`/v1/bench/status`);
}

export async function testBench(req: TestBenchRequest): Promise<Episode> {
  return getJson<Episode>(`/v1/bench/test`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function startFullBench(envId: string): Promise<BenchJob> {
  return getJson<BenchJob>(`/v1/bench/full/${encodeURIComponent(envId)}`, {
    method: "POST",
  });
}

export async function getBenchJobs(envId?: string): Promise<BenchJob[]> {
  const q = envId ? `?env_id=${encodeURIComponent(envId)}` : "";
  return getJson<BenchJob[]>(`/v1/bench/jobs${q}`);
}

export async function getBenchJob(jobId: string): Promise<BenchJob> {
  return getJson<BenchJob>(`/v1/bench/jobs/${encodeURIComponent(jobId)}`);
}
