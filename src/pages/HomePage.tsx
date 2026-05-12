import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Domain,
  LeaderboardEntry,
  getLeaderboard,
  listDomains,
} from "@/lib/api";
import PracticalGallery from "@/components/PracticalGallery";

export function HomePage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const st = location.state as { scrollToGallery?: boolean } | null;
    if (st?.scrollToGallery) {
      document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, location.key, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let nextDomains: Domain[] = [];
      try {
        nextDomains = await listDomains({ publishedOnly: true });
      } catch {
        nextDomains = [];
      }
      const lb: Record<string, LeaderboardEntry[]> = {};
      await Promise.all(
        nextDomains.map(async (d) => {
          try {
            lb[d.id] = await getLeaderboard(d.id);
          } catch {
            lb[d.id] = [];
          }
        }),
      );
      if (!cancelled) {
        setDomains(nextDomains);
        setLeaderboards(lb);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = "Mesocosm — a field guide to AI environments";
  }, []);

  const exhibitsLive = domains.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-ink-2 text-sm">
        Loading gallery…
      </div>
    );
  }

  return (
    <>
      <Hero exhibitsLive={exhibitsLive} />
      <ProcessStrip />

      <section id="gallery" className="max-w-7xl mx-auto px-6 py-20">
        <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
          <div>
            <span className="eyebrow eyebrow-leaf">— the gallery</span>
            <h2
              className="mt-3 text-4xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
              style={{ letterSpacing: "-0.018em" }}
            >
              Every exhibit, <em>uniformly typeset.</em>
            </h2>
            <p className="mt-3 max-w-prose text-ink-2 text-[15px] leading-relaxed">
              Each entry is bound to a versioned vow — observation, action, and reward shapes you can read at a glance. Run a model, climb
              the field, or publish your own.
            </p>
          </div>
          {domains.length > 0 && (
            <span className="hidden md:inline eyebrow">
              {domains.length} {domains.length === 1 ? "exhibit" : "exhibits"} ·{" "}
              {Object.values(leaderboards).reduce((n, l) => n + l.length, 0)} runs
            </span>
          )}
        </header>

        {domains.length === 0 ? (
          <div className="py-32 text-center">
            <p className="[font-family:var(--f-display)] italic text-2xl text-ink-2">no exhibits yet.</p>
            <p className="mt-3 text-sm text-ink-3 max-w-sm mx-auto">
              Submit a GitHub repository on the{" "}
              <Link
                to="/developer"
                className="text-ink hover:text-leaf-deep transition-colors underline underline-offset-2"
              >
                developer page
              </Link>{" "}
              to publish the first one.
            </p>
          </div>
        ) : (
          <PracticalGallery domains={domains} leaderboards={leaderboards} />
        )}
      </section>
    </>
  );
}

function Hero({ exhibitsLive }: { exhibitsLive: number }) {
  return (
    <section className="hero">
      <div className="hero-wrap">
        <div className="hero-meta-top">
          <span className="eyebrow">— a field guide, vol. ii</span>
          <span className="eyebrow">entry n° 001 · revised iv·26·26</span>
        </div>

        <article className="dictionary">
          <h1 className="dict-word">mesocosm</h1>
          <div className="dict-pron">
            <span className="dict-pos">n.</span>
            <span className="dict-phon">
              <span className="slash">/</span>
              ˈmɛs<span className="dot">·</span>oʊ<span className="dot">ˌ</span>kɒz
              <span className="dot">·</span>əm
              <span className="slash">/</span>
            </span>
          </div>
          <p className="dict-def">
            a contained protocol for publishing, running, and ranking AI agents{" "}
            <em>under reproducible conditions.</em>
          </p>
          <div className="dict-etym">
            <span className="rule" />
            also: a public archive of such environments
            <span className="rule" />
          </div>
        </article>

        <div className="hero-cta">
          <button
            type="button"
            onClick={() =>
              document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-2 rounded-full px-5 h-10 text-sm font-medium bg-ink text-paper hover:bg-leaf-deep dark:bg-leaf-deep dark:hover:bg-leaf transition-colors"
          >
            Enter the gallery <span aria-hidden>→</span>
          </button>
          <Link to="/showcase" className="text-sm text-ink hover:text-leaf-deep transition-colors inline-flex items-center gap-2">
            See how it works <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="hero-meta-bottom">
          <span>
            {exhibitsLive > 0 ? `${exhibitsLive} exhibits live` : "in development"} · 38 contributors this month
          </span>
          <span className="hero-etym-line">
            from <em>bench</em> (a place of measure) and <em>anything</em> (any environment, any agent).
          </span>
        </div>
      </div>
    </section>
  );
}

function ProcessStrip() {
  const steps = [
    {
      n: "i",
      h: "Bind the vow",
      b: "Declare your environment's observation, action, and reward types in a single typed file. The platform rejects anything that does not match it at runtime.",
    },
    {
      n: "ii",
      h: "Submit the link",
      b: "Paste a public GitHub URL. Mesocosm clones, runs your test suite under isolation, and stages the exhibit privately for review.",
    },
    {
      n: "iii",
      h: "Step into the gallery",
      b: "Two reviewers vet the contract; a quorum publishes. Your exhibit appears on the field and accepts submissions immediately.",
    },
  ];

  return (
    <section className="process-section" id="process">
      <div className="process-wrap">
        <span className="eyebrow eyebrow-leaf">— how an exhibit arrives</span>
        <h2 className="process-h">
          Three steps from a repo to <em>the field.</em>
        </h2>
        <div className="process-grid">
          {steps.map((s) => (
            <div className="process-cell" key={s.n}>
              <div className="process-num">{s.n}.</div>
              <div className="process-title">{s.h}</div>
              <div className="process-body">{s.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
