// TypeScript surface for the FastAPI backend at src/api.
// Hand-translated from src/core/*.py and src/api/routes/*.py.
// Long-term: codegen from OpenAPI. For now, keep this honest.

import { API_BASE, benchAuthDisabled } from "@/lib/env";
import {
  getBenchAuthHeaders,
  getBenchContextHeaders,
} from "@/lib/benchAuth";
import type {
  BenchMe,
  BenchMeContext,
  BenchTeam,
  BenchTeamDetail,
  GalleryRunEntry,
} from "@/types/bench";
export { benchAuthDisabled };

// ── Enums ──────────────────────────────────────────────────────────
export type Tier = "tier1" | "tier2";
export type DomainStatus = "draft" | "testing" | "published" | "archived";
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type RunVisibility = "private" | "gallery_public";
export type EpStatus =
  | "pending"
  | "running"
  | "completed"
  | "truncated"
  | "failed"
  | "timeout"
  | "cancelled";

export interface RunStatusDetail {
  detail?: string;
  episode_outcomes?: Partial<
    Record<"completed" | "failed" | "truncated" | "cancelled" | "timeout", number>
  >;
  failure_reasons?: string[];
  truncation_reasons?: string[];
  cancellation_reasons?: string[];
  primary_episode_reason?: string;
  num_episodes?: number;
  scoreable?: number;
  required_ratio?: number;
}

export interface RunStatusBatchItem {
  id: string;
  status: RunStatus;
  scores: Record<string, number>;
  completed_at?: string | null;
  status_reason?: string | null;
  status_detail?: RunStatusDetail;
  truncated_count?: number;
  failed_count?: number;
  cancelled_count?: number;
  failure_reasons?: string[];
  truncation_reasons?: string[];
}

export function isActiveRunStatus(status: RunStatus | string): boolean {
  return status === "pending" || status === "running";
}

export function isTerminalRunStatus(status: RunStatus | string): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
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

export const DEFAULT_SCORING: ScoringConfig = {
  primary_metric: "score",
  metrics: [],
  higher_is_better: true,
};

const UNKNOWN_SPACE: SpaceSpec = { type: "text", description: "" };

const DEFAULT_BINDING_VOW_TEMPLATE: Omit<BindingVow, "id" | "domain_id"> = {
  version: "0.0.0",
  tier: "tier1",
  observation_space: UNKNOWN_SPACE,
  action_space: UNKNOWN_SPACE,
  reward: { type: "scalar", description: "" },
  episode: {
    deterministic_reset: false,
    supports_seed: false,
    parallel_episodes: 1,
    observability: "full",
  },
  techniques: [],
  metadata: {},
  description: "",
};

export const DEFAULT_ENDPOINT: EnvironmentEndpoint = { mode: "remote" };

/** API list payloads sometimes omit nested vow/endpoint; gallery must not white-screen. */
export function domainBindingVow(
  domain: Pick<Domain, "id" | "binding_vow"> | { id: string; binding_vow?: BindingVow | null },
): BindingVow {
  const partial = domain.binding_vow;
  if (partial?.tier && partial.observation_space && partial.action_space && partial.reward) {
    return {
      ...DEFAULT_BINDING_VOW_TEMPLATE,
      ...partial,
      id: partial.id ?? domain.id,
      domain_id: partial.domain_id ?? domain.id,
      episode: { ...DEFAULT_BINDING_VOW_TEMPLATE.episode, ...partial.episode },
      techniques: partial.techniques ?? [],
      metadata: partial.metadata ?? {},
    };
  }
  return {
    ...DEFAULT_BINDING_VOW_TEMPLATE,
    ...(partial ?? {}),
    id: partial?.id ?? domain.id,
    domain_id: partial?.domain_id ?? domain.id,
    tier: partial?.tier ?? DEFAULT_BINDING_VOW_TEMPLATE.tier,
    version: partial?.version ?? DEFAULT_BINDING_VOW_TEMPLATE.version,
    observation_space: partial?.observation_space ?? UNKNOWN_SPACE,
    action_space: partial?.action_space ?? UNKNOWN_SPACE,
    reward: partial?.reward ?? DEFAULT_BINDING_VOW_TEMPLATE.reward,
    episode: {
      ...DEFAULT_BINDING_VOW_TEMPLATE.episode,
      ...(partial?.episode ?? {}),
    },
  };
}

export function domainEndpoint(
  endpoint: EnvironmentEndpoint | null | undefined,
): EnvironmentEndpoint {
  return endpoint?.mode ? endpoint : DEFAULT_ENDPOINT;
}

/** API payloads occasionally omit scoring; never crash the gallery on it. */
export function domainScoring(
  domain: Pick<Domain, "scoring"> | { scoring?: ScoringConfig | null },
): ScoringConfig {
  return domain.scoring ?? DEFAULT_SCORING;
}

function normalizeDomain(raw: Domain): Domain {
  const id = raw.id?.trim() || "";
  return {
    ...raw,
    id,
    name: raw.name?.trim() || id || "Untitled exhibit",
    owner_id: raw.owner_id ?? "—",
    binding_vow: domainBindingVow({ id, binding_vow: raw.binding_vow }),
    endpoint: domainEndpoint(raw.endpoint),
    tags: raw.tags ?? [],
    detail: raw.detail ?? "",
    scoring: domainScoring(raw),
    pricing: raw.pricing ?? "",
    status: raw.status ?? "draft",
    version_history: raw.version_history ?? [],
    has_gold_benchmark: raw.has_gold_benchmark ?? false,
  };
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
  team_id?: string;
  env_id?: string;
  visibility?: RunVisibility;
}

export interface Run {
  id: string;
  config: RunConfig;
  requester_id: string;
  status: RunStatus;
  created_at: string;
  completed_at?: string;
  scores: Record<string, number>;
  team_id?: string | null;
  env_id?: string | null;
  visibility?: RunVisibility | null;
  status_reason?: string | null;
  status_detail?: RunStatusDetail;
  completed_count?: number;
  failed_count?: number;
  truncated_count?: number;
  cancelled_count?: number;
  timeout_count?: number;
  failure_reasons?: string[];
  truncation_reasons?: string[];
  cancellation_reasons?: string[];
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
  scope?: "solo" | "team";
  team_id?: string | null;
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

/** Must match swecc-core bench_common.model_catalog.FULL_BENCH_MODELS (gemini/ prefix). */
export const SUPPORTED_MODELS: { id: string; label: string }[] = [
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "gemini/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
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
async function parseError(res: Response, path: string): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { detail?: string | unknown };
    if (typeof body.detail === "string") return body.detail;
    if (body.detail) return JSON.stringify(body.detail);
  } catch {
    /* not json */
  }
  return text || `${res.status} ${res.statusText} — ${path}`;
}

async function benchFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...getBenchAuthHeaders(),
        ...getBenchContextHeaders(),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    const hint =
      e instanceof TypeError
        ? `Cannot reach bench API at ${API_BASE}. Check docker compose (bench-api + nginx) and that you are signed in.`
        : null;
    throw new Error(hint ?? (e instanceof Error ? e.message : "Request failed"));
  }
  if (!res.ok) {
    throw new Error(await parseError(res, path));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  return benchFetch<T>(path, init);
}

// ── Domain endpoints ───────────────────────────────────────────────
export async function listDomains(
  opts: { publishedOnly?: boolean } = {},
): Promise<Domain[]> {
  const q = opts.publishedOnly ? "?published=true" : "";
  const rows = await getJson<Domain[]>(`/v1/domains${q}`);
  return rows.filter((d) => Boolean(d?.id?.trim())).map(normalizeDomain);
}

export async function getDomain(id: string): Promise<Domain> {
  const domain = await getJson<Domain>(`/v1/domains/${encodeURIComponent(id)}`);
  return normalizeDomain(domain);
}

// ── Leaderboard ────────────────────────────────────────────────────
/** Home gallery cards request a small limit (top 3 shown); domain detail uses default 50. */
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

export async function listRuns(opts?: {
  domainId?: string;
  envId?: string;
  limit?: number;
}): Promise<Run[]> {
  const params = new URLSearchParams();
  if (opts?.domainId) params.set("domain_id", opts.domainId);
  if (opts?.envId) params.set("env_id", opts.envId);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const q = params.toString() ? `?${params}` : "";
  return getJson<Run[]>(`/v1/runs${q}`);
}

export async function listEnvironmentRuns(envId: string, limit = 50): Promise<Run[]> {
  return getJson<Run[]>(
    `/v1/developer/environments/${encodeURIComponent(envId)}/runs?limit=${limit}`,
  );
}

export async function getRun(runId: string): Promise<Run> {
  return getJson<Run>(`/v1/runs/${encodeURIComponent(runId)}`);
}

export async function batchRunStatus(runIds: string[]): Promise<Record<string, RunStatusBatchItem>> {
  if (runIds.length === 0) return {};
  const ids = runIds.map(encodeURIComponent).join(",");
  const body = await getJson<{ runs: Record<string, RunStatusBatchItem> }>(
    `/v1/runs/status?ids=${ids}`,
  );
  return body.runs ?? {};
}

export async function listRunEpisodes(runId: string): Promise<Episode[]> {
  return getJson<Episode[]>(`/v1/runs/${encodeURIComponent(runId)}/episodes`);
}

export async function cancelRun(runId: string): Promise<Run> {
  return getJson<Run>(`/v1/runs/${encodeURIComponent(runId)}/cancel`, {
    method: "POST",
  });
}

export async function updateRunVisibility(
  runId: string,
  visibility: RunVisibility,
): Promise<Run> {
  return getJson<Run>(`/v1/runs/${encodeURIComponent(runId)}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ visibility }),
  });
}

// ── Developer ──────────────────────────────────────────────────────
export async function listDeveloperEnvironments(opts?: {
  scope?: "solo" | "team";
  teamId?: string;
}): Promise<DeveloperEnvironment[]> {
  const params = new URLSearchParams();
  if (opts?.scope) params.set("scope", opts.scope);
  if (opts?.teamId) params.set("team_id", opts.teamId);
  const q = params.toString() ? `?${params}` : "";
  return getJson<DeveloperEnvironment[]>(`/v1/developer/environments${q}`);
}

export async function submitDeveloperEnvironment(req: {
  name: string;
  description?: string;
  github_url: string;
  team_id?: string;
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

export async function fetchEnvironmentUsage(envId: string): Promise<DomainUsageStats> {
  return getJson<DomainUsageStats>(
    `/v1/developer/environments/${encodeURIComponent(envId)}/usage`,
  );
}

export async function retryEnvironment(envId: string): Promise<DeveloperEnvironment> {
  return getJson<DeveloperEnvironment>(
    `/v1/developer/environments/${encodeURIComponent(envId)}/retry`,
    { method: "POST" },
  );
}

export async function deleteEnvironment(envId: string): Promise<void> {
  await benchFetch<void>(
    `/v1/developer/environments/${encodeURIComponent(envId)}`,
    { method: "DELETE" },
  );
}

// ── Me / gallery / teams (bench auth) ───────────────────────────────

export async function fetchBenchMe(): Promise<BenchMe> {
  return getJson<BenchMe>("/v1/me");
}

export async function fetchBenchMeContext(): Promise<BenchMeContext> {
  return getJson<BenchMeContext>("/v1/me/context");
}

export async function listMyRuns(opts?: { teamId?: string; limit?: number }): Promise<Run[]> {
  const params = new URLSearchParams();
  if (opts?.teamId) params.set("team_id", opts.teamId);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const q = params.toString() ? `?${params}` : "";
  return getJson<Run[]>(`/v1/me/runs${q}`);
}

export async function listGalleryRuns(
  domainId?: string,
  limit = 50,
): Promise<GalleryRunEntry[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (domainId) params.set("domain_id", domainId);
  return getJson<GalleryRunEntry[]>(`/v1/gallery/runs?${params}`);
}

export async function listTeams(): Promise<BenchTeam[]> {
  return getJson<BenchTeam[]>("/v1/teams");
}

export async function createTeam(name: string, slug?: string): Promise<BenchTeam & { join_code: string }> {
  return getJson("/v1/teams", {
    method: "POST",
    body: JSON.stringify({ name, slug: slug || undefined }),
  });
}

export async function joinTeam(code: string): Promise<BenchTeam> {
  return getJson("/v1/teams/join", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}

export async function getTeam(teamId: string): Promise<BenchTeamDetail> {
  return getJson<BenchTeamDetail>(`/v1/teams/${encodeURIComponent(teamId)}`);
}

export async function leaveTeam(teamId: string): Promise<void> {
  await benchFetch(`/v1/teams/${encodeURIComponent(teamId)}/members/me`, {
    method: "DELETE",
  });
}

export async function regenerateTeamCode(teamId: string): Promise<{ join_code: string }> {
  return getJson(`/v1/teams/${encodeURIComponent(teamId)}/join-code/regenerate`, {
    method: "POST",
  });
}

export async function deleteTeam(teamId: string): Promise<void> {
  await benchFetch(`/v1/teams/${encodeURIComponent(teamId)}`, { method: "DELETE" });
}

export async function publishDomain(domainId: string): Promise<Domain> {
  const domain = await getJson<Domain>(
    `/v1/domains/${encodeURIComponent(domainId)}/publish`,
    { method: "POST" },
  );
  return normalizeDomain(domain);
}

export async function unpublishDomain(domainId: string): Promise<Domain> {
  const domain = await getJson<Domain>(
    `/v1/domains/${encodeURIComponent(domainId)}/unpublish`,
    { method: "POST" },
  );
  return normalizeDomain(domain);
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
