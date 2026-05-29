import {
  AnySpace,
  BindingVow,
  isCompositeSpace,
  SpaceSpec,
} from "@/lib/api";

function spaceLabel(s: AnySpace): string {
  if (isCompositeSpace(s)) return "composite";
  return (s as SpaceSpec).type;
}

function actionLabel(s: AnySpace): string {
  const base = spaceLabel(s);
  if (!isCompositeSpace(s)) {
    const sp = s as SpaceSpec;
    if (sp.enum_values && sp.enum_values.length > 0) {
      return `${base}[${sp.enum_values.length}]`;
    }
  }
  return base;
}

/** Observation → action → reward strip (shared by gallery plaques and developer cards). */
export default function BindingVowChip({ vow }: { vow: BindingVow }) {
  const obs = spaceLabel(vow.observation_space);
  const act = actionLabel(vow.action_space);
  const rew = vow.reward.type;
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 border-y border-line text-[11px] uppercase tracking-[0.16em] font-medium text-ink-2 [font-family:var(--f-body)]">
      <span>{obs}</span>
      <span className="text-ink-3">→</span>
      <span>{act}</span>
      <span className="text-ink-3">→</span>
      <span>{rew}</span>
    </div>
  );
}
