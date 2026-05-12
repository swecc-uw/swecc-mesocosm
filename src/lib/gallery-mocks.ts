// Reference fixtures so /gallery can render all four <PracticalPlaque>
// states even when the API is empty / unavailable. These are merged
// after live results during the migration slice; a follow-up slice
// will retire them once seed data lives in the orchestrator DB.

import { Domain, LeaderboardEntry } from "./api";

export const MOCK_DOMAINS: Domain[] = [
  // 1. Active, populated — gold benchmark
  {
    id: "mock-webarena",
    name: "WebArena · realistic browsing",
    owner_id: "anthropic-eval",
    binding_vow: {
      id: "webarena-v2",
      version: "2.1.0",
      domain_id: "mock-webarena",
      tier: "tier2",
      observation_space: { fields: { dom: { type: "text", description: "" }, screenshot: { type: "image", description: "" } } },
      action_space: { type: "json", description: "{type, selector?, text?}" },
      reward: { type: "sparse", description: "1 on task success" },
      episode: {
        max_steps: 30,
        deterministic_reset: true,
        supports_seed: true,
        parallel_episodes: 4,
        observability: "full",
      },
      techniques: [],
      metadata: {},
      description: "",
    },
    endpoint: { mode: "remote", url: "https://webarena.example.com" },
    scoring: {
      primary_metric: "task_success",
      metrics: [{ name: "task_success", type: "terminal_field", aggregation: "mean", field: "success" }],
      higher_is_better: true,
    },
    status: "published",
    tags: ["browser", "tool-use", "long-horizon"],
    detail:
      "End-to-end web tasks across realistic mock sites. Agents must plan, navigate, and recover from page-level errors.",
    pricing: "free",
    version_history: [],
    has_gold_benchmark: true,
  },
  // 2. Active, populated — standard
  {
    id: "mock-trivia",
    name: "Simple-trivia · four-option recall",
    owner_id: "fielding-lab",
    binding_vow: {
      id: "simple-trivia-v1",
      version: "1.0.2",
      domain_id: "mock-trivia",
      tier: "tier1",
      observation_space: { type: "text", description: "Question + 4 choices" },
      action_space: { type: "discrete", enum_values: ["A", "B", "C", "D"], description: "" },
      reward: { type: "binary", description: "correct/incorrect" },
      episode: {
        max_steps: 1,
        deterministic_reset: true,
        supports_seed: true,
        parallel_episodes: 16,
        observability: "full",
      },
      techniques: [],
      metadata: {},
      description: "",
    },
    endpoint: { mode: "sandbox", image: "fielding/trivia:1.0.2" },
    scoring: {
      primary_metric: "accuracy",
      metrics: [{ name: "accuracy", type: "episode_reward", aggregation: "mean" }],
      higher_is_better: true,
    },
    status: "published",
    tags: ["recall", "single-step", "tier1"],
    detail:
      "A 5,000-item closed-book trivia bank. Single-step bench for raw factual recall calibration.",
    pricing: "free",
    version_history: [],
    has_gold_benchmark: false,
  },
  // 3. Active, empty — no runs yet
  {
    id: "mock-negotiate",
    name: "Negotiation · split-pie protocol",
    owner_id: "kurgan-research",
    binding_vow: {
      id: "negotiate-v1",
      version: "0.3.0",
      domain_id: "mock-negotiate",
      tier: "tier2",
      observation_space: { type: "json", description: "Round state + opponent move history" },
      action_space: { type: "discrete", enum_values: ["accept", "counter", "walk"], description: "" },
      reward: { type: "scalar", description: "Pareto-weighted utility" },
      episode: {
        max_steps: 12,
        deterministic_reset: false,
        supports_seed: true,
        parallel_episodes: 1,
        observability: "partial",
      },
      techniques: [],
      metadata: {},
      description: "",
    },
    endpoint: { mode: "remote" },
    scoring: {
      primary_metric: "utility",
      metrics: [{ name: "utility", type: "episode_reward", aggregation: "mean" }],
      higher_is_better: true,
    },
    status: "published",
    tags: ["multi-turn", "game-theory"],
    detail:
      "Two-agent integrative bargaining over 5 indivisible items. Tracks Pareto efficiency, not just self-utility.",
    pricing: "free",
    version_history: [],
    has_gold_benchmark: false,
  },
  // 4. In-development
  {
    id: "mock-codediff",
    name: "Code-diff · merge-conflict synthesis",
    owner_id: "kurgan-research",
    binding_vow: {
      id: "codediff-v0",
      version: "0.0.1",
      domain_id: "mock-codediff",
      tier: "tier2",
      observation_space: { fields: { base: { type: "text", description: "" }, ours: { type: "text", description: "" }, theirs: { type: "text", description: "" } } },
      action_space: { type: "text", description: "Resolved diff" },
      reward: { type: "sparse", description: "AST-equiv check" },
      episode: {
        max_steps: 1,
        deterministic_reset: true,
        supports_seed: true,
        parallel_episodes: 8,
        observability: "full",
      },
      techniques: [],
      metadata: {},
      description: "",
    },
    endpoint: { mode: "sandbox", image: "kurgan/codediff:0.0.1" },
    scoring: {
      primary_metric: "ast_equiv",
      metrics: [{ name: "ast_equiv", type: "terminal_field", aggregation: "mean", field: "ok" }],
      higher_is_better: true,
    },
    status: "testing",
    tags: ["code", "diff", "static"],
    detail:
      "Real merge conflicts harvested from open-source repos. Reward only fires on bytewise- or AST-equivalent resolution.",
    pricing: "free",
    version_history: [],
    has_gold_benchmark: false,
  },
];

export const MOCK_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  "mock-webarena": [
    { run_id: "r1", model: "claude-opus-4-7", binding_vow_version: "2.1.0", num_episodes: 200, primary_score: 0.612, all_scores: { task_success: 0.612 } },
    { run_id: "r2", model: "gpt-4o", binding_vow_version: "2.1.0", num_episodes: 200, primary_score: 0.547, all_scores: { task_success: 0.547 } },
    { run_id: "r3", model: "gemini-1.5-pro", binding_vow_version: "2.1.0", num_episodes: 200, primary_score: 0.498, all_scores: { task_success: 0.498 } },
  ],
  "mock-trivia": [
    { run_id: "r4", model: "claude-opus-4-7", binding_vow_version: "1.0.2", num_episodes: 5000, primary_score: 0.892, all_scores: { accuracy: 0.892 } },
    { run_id: "r5", model: "claude-sonnet-4-6", binding_vow_version: "1.0.2", num_episodes: 5000, primary_score: 0.871, all_scores: { accuracy: 0.871 } },
    { run_id: "r6", model: "gpt-4o", binding_vow_version: "1.0.2", num_episodes: 5000, primary_score: 0.858, all_scores: { accuracy: 0.858 } },
    { run_id: "r7", model: "claude-haiku-4-5", binding_vow_version: "1.0.2", num_episodes: 5000, primary_score: 0.823, all_scores: { accuracy: 0.823 } },
  ],
  "mock-negotiate": [],
  "mock-codediff": [],
};
