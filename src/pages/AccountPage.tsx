import { useEffect, useState, type FormEvent } from "react";
import { Btn } from "@/components/ds/Btn";
import { SubmittingAsBanner } from "@/components/SubmittingAsBanner";
import { ScopePill } from "@/components/ScopePill";
import { useAuth } from "@/hooks/useAuth";
import { useBenchAuth } from "@/hooks/useBenchAuth";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import {
  createTeam,
  fetchBenchMeContext,
  getTeam,
  joinTeam,
  leaveTeam,
  listMyRuns,
  listTeams,
  regenerateTeamCode,
  type Run,
} from "@/lib/api";
import type { BenchMeContext, BenchTeam, BenchTeamDetail } from "@/types/bench";

export function AccountPage() {
  const { member, logout } = useAuth();
  const { benchMe, endGuestSession, refreshBench } = useBenchAuth();
  const { team: activeTeam, selectTeam } = useActiveTeam();

  const [ctx, setCtx] = useState<BenchMeContext | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [teams, setTeams] = useState<BenchTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<BenchTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamsBusy, setTeamsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  async function reloadAccount() {
    setLoading(true);
    setError(null);
    try {
      const [context, myRuns, teamList] = await Promise.all([
        fetchBenchMeContext(),
        listMyRuns(activeTeam?.id),
        listTeams(),
      ]);
      setCtx(context);
      setRuns(myRuns);
      setTeams(teamList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load account");
      setCtx(null);
      setRuns([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = member?.username
      ? `${member.username} — Mesocosm`
      : "Account — Mesocosm";
  }, [member?.username]);

  useEffect(() => {
    const t = window.setTimeout(() => void reloadAccount(), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when active team changes
  }, [activeTeam?.id]);

  useEffect(() => {
    if (window.location.hash === "#teams") {
      document.getElementById("teams")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setTeamsBusy(true);
    setError(null);
    try {
      const t = await createTeam(createName.trim());
      setCreateName("");
      await reloadAccount();
      setSelectedTeam(await getTeam(t.team_id));
      document.getElementById("teams")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setTeamsBusy(false);
    }
  }

  async function handleJoinTeam(e: FormEvent) {
    e.preventDefault();
    if (joinCode.trim().length !== 4) {
      setError("Join code must be 4 characters.");
      return;
    }
    setTeamsBusy(true);
    setError(null);
    try {
      await joinTeam(joinCode.trim());
      setJoinCode("");
      await reloadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setTeamsBusy(false);
    }
  }

  const displayName =
    member && (member.firstName || member.lastName)
      ? [member.firstName, member.lastName].filter(Boolean).join(" ")
      : member?.username;

  const teamCtx =
    ctx && activeTeam ? ctx.teams.find((t) => t.team_id === activeTeam.id) : null;
  const envLabel = activeTeam ? `${activeTeam.name} environments` : "Solo environments";
  const runLabel = activeTeam ? `${activeTeam.name} runs` : "Solo runs";
  const envValue = activeTeam ? (teamCtx?.env_count ?? 0) : (ctx?.solo.env_count ?? 0);
  const runValue = activeTeam ? (teamCtx?.run_count ?? 0) : (ctx?.solo.run_count ?? 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
        <span className="eyebrow eyebrow-leaf">— your account</span>
        <h1
          className="mt-3 text-4xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          {displayName ? (
            <>
              {displayName}
              {member?.username && displayName !== member.username && (
                <span className="text-ink-2 font-normal text-2xl ml-2 num-tab">
                  @{member.username}
                </span>
              )}
            </>
          ) : (
            <>
              Your <em>bench account</em>
            </>
          )}
        </h1>
        {member && (
          <p className="mt-3 text-sm text-ink-2">
            {member.email}
            {member.discordUsername ? (
              <> · Discord <span className="text-ink">{member.discordUsername}</span></>
            ) : null}
          </p>
        )}
        <p className="mt-2 text-sm text-ink-2">
          Bench: <strong className="text-ink">{benchMe.type}</strong>
          {benchMe.type === "member" && benchMe.user_id != null && (
            <> · user #{benchMe.user_id}</>
          )}
        </p>
        </div>
        <Btn variant="link" onClick={() => void logout()} className="shrink-0 mt-1">
          Sign out
        </Btn>
      </header>

      <SubmittingAsBanner />

      {error && (
        <p className="text-sm text-bad border border-line rounded-[2px] px-3 py-2 bg-paper-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-2">Loading…</p>
      ) : ctx ? (
        <section className="grid grid-cols-2 gap-4">
          <Stat label={envLabel} value={envValue} />
          <Stat label={runLabel} value={runValue} />
        </section>
      ) : null}

      <section id="teams" className="scroll-mt-24 space-y-6">
        <div>
          <h2 className="eyebrow mb-2">Teams</h2>
          <p className="text-sm text-ink-2 max-w-prose leading-relaxed">
            Up to four members per team. Join with a 4-character code from the owner. Pick a team
            when you want the next run or developer submission credited to the group, not just you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <form
            onSubmit={handleCreateTeam}
            className="border border-line rounded-[2px] p-5 space-y-3"
          >
            <h3 className="eyebrow">Create team</h3>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Team name"
              className="w-full px-3 py-2 text-sm border border-line rounded-[2px] bg-paper"
              required
            />
            <Btn variant="primary" type="submit" disabled={teamsBusy}>
              Create
            </Btn>
          </form>

          <form
            onSubmit={handleJoinTeam}
            className="border border-line rounded-[2px] p-5 space-y-3"
          >
            <h3 className="eyebrow">Join with code</h3>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="K7M2"
              maxLength={4}
              className="w-full px-3 py-2 text-sm border border-line rounded-[2px] bg-paper uppercase tracking-widest"
              required
            />
            <Btn variant="primary" type="submit" disabled={teamsBusy}>
              Join
            </Btn>
          </form>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-ink-2 italic">You are not on any teams yet.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-[2px]">
            {teams.map((t) => (
              <li key={t.team_id} className="px-4 py-3 flex items-center justify-between gap-4">
                <button
                  type="button"
                  className="text-left flex-1 min-w-0"
                  onClick={async () => {
                    try {
                      setSelectedTeam(await getTeam(t.team_id));
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to load team");
                    }
                  }}
                >
                  <span className="text-sm font-medium text-ink">{t.name}</span>
                  <span className="text-xs text-ink-3 ml-2">
                    {t.role} · {t.member_count}/{t.max_members}
                  </span>
                </button>
                <Btn
                  variant={activeTeam?.id === t.team_id ? "primary" : "link"}
                  onClick={() => {
                    if (activeTeam?.id === t.team_id) {
                      selectTeam(null);
                    } else {
                      selectTeam({ id: t.team_id, name: t.name });
                    }
                    setLoading(true);
                    void reloadAccount();
                    void refreshBench();
                  }}
                >
                  {activeTeam?.id === t.team_id ? "Switch to solo" : "Switch to team"}
                </Btn>
              </li>
            ))}
          </ul>
        )}

        {selectedTeam && (
          <div className="border border-line rounded-[2px] p-5 space-y-4">
            <h3 className="text-lg font-medium text-ink [font-family:var(--f-display)]">
              {selectedTeam.name}
            </h3>
            {selectedTeam.role === "owner" && selectedTeam.join_code && (
              <p className="text-sm num-tab">
                Join code:{" "}
                <strong className="text-ink text-lg">{selectedTeam.join_code}</strong>
              </p>
            )}
            <p className="text-sm text-ink-2 leading-relaxed">
              {activeTeam?.id === selectedTeam.team_id
                ? "New benchmark runs and developer submissions are attributed to this team."
                : "Switch to this team when you want the next submission or exhibit run on the team roster."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn
                variant={activeTeam?.id === selectedTeam.team_id ? "primary" : "link"}
                onClick={() => {
                  if (activeTeam?.id === selectedTeam.team_id) {
                    selectTeam(null);
                  } else {
                    selectTeam({ id: selectedTeam.team_id, name: selectedTeam.name });
                  }
                  setLoading(true);
                  void reloadAccount();
                  void refreshBench();
                }}
              >
                {activeTeam?.id === selectedTeam.team_id
                  ? "Switch to solo"
                  : "Switch to team"}
              </Btn>
              {selectedTeam.role === "owner" && (
                <Btn
                  variant="link"
                  onClick={async () => {
                    setTeamsBusy(true);
                    try {
                      const { join_code } = await regenerateTeamCode(selectedTeam.team_id);
                      setSelectedTeam({ ...selectedTeam, join_code });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Regenerate failed");
                    } finally {
                      setTeamsBusy(false);
                    }
                  }}
                >
                  Regenerate code
                </Btn>
              )}
              {selectedTeam.role !== "owner" && (
                <Btn
                  variant="link"
                  onClick={async () => {
                    setTeamsBusy(true);
                    try {
                      await leaveTeam(selectedTeam.team_id);
                      setSelectedTeam(null);
                      await reloadAccount();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Leave failed");
                    } finally {
                      setTeamsBusy(false);
                    }
                  }}
                >
                  Leave team
                </Btn>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="eyebrow mb-4">
          Your runs{activeTeam ? ` (${activeTeam.name})` : " (solo)"}
        </h2>
        {runs.length === 0 ? (
          <p className="text-sm text-ink-2 italic">No runs in this scope yet.</p>
        ) : (
          <div
            className={
              runs.length > 5
                ? "max-h-[17.5rem] overflow-y-auto overscroll-y-contain border border-line rounded-[2px]"
                : "border border-line rounded-[2px]"
            }
          >
            <ul className="divide-y divide-line">
              {runs.map((r) => (
                <li
                  key={r.id}
                  className="px-4 py-3 text-sm num-tab flex flex-wrap items-center gap-2"
                >
                  <ScopePill teamId={r.team_id} teamName={activeTeam?.name} />
                  <span className="text-ink">{r.config.domain_id}</span>
                  <span className="text-ink-3">·</span>
                  <span className="text-ink-2">{r.config.agent_config.model}</span>
                  <span className="text-ink-3">·</span>
                  <span className={r.status === "completed" ? "text-ok" : "text-ink-3"}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {benchMe.type === "guest" && (
        <Btn variant="link" onClick={() => void endGuestSession()}>
          End guest session
        </Btn>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line rounded-[2px] p-5 bg-paper">
      <p className="num-old text-3xl text-ink">{value}</p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}
