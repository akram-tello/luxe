import { formatRelative } from "@/lib/utils/format";

type StageHistoryEntry = {
  id: string;
  stage: string;
  fromStage: string | null;
  note: string;
  createdAt: Date;
  changedBy: { name: string };
};

type OpenTask = {
  id: string;
  title: string;
  type: string;
  dueDate: Date;
};

type RecentActivity = {
  id: string;
  type: string;
  summary: string;
  occurredAt: Date;
};

export type JourneyStageData = {
  key: string;
  label: string;
  kind: "ACTIVE" | "WON" | "LOST";
  steps: { id: string; title: string }[];
};

export function ClientJourneyBoard({
  currentStage,
  stages,
  stageLabels,
  stageHistory,
  openTasks,
  recentActivities,
}: {
  currentStage: string;
  stages: JourneyStageData[];
  stageLabels: Map<string, string>;
  stageHistory: StageHistoryEntry[];
  openTasks: OpenTask[];
  recentActivities: RecentActivity[];
}) {
  const funnel = stages.filter((s) => s.kind !== "LOST");
  const currentIndex = funnel.findIndex((s) => s.key === currentStage);
  const isLost = stages.find((s) => s.key === currentStage)?.kind === "LOST";

  const transitionsByStage = new Map<string, StageHistoryEntry[]>();
  for (const s of stageHistory) {
    const list = transitionsByStage.get(s.stage) ?? [];
    list.push(s);
    transitionsByStage.set(s.stage, list);
  }

  const nextStageKey: string | null =
    !isLost && currentIndex >= 0 && currentIndex < funnel.length - 1
      ? funnel[currentIndex + 1]!.key
      : null;

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
        {funnel.map((stage, i) => {
          const status: "done" | "current" | "upcoming" = isLost
            ? "upcoming"
            : i < currentIndex
            ? "done"
            : i === currentIndex
            ? "current"
            : "upcoming";

          const transitions = transitionsByStage.get(stage.key) ?? [];
          const cards: React.ReactNode[] = [];

          if (status === "done") {
            for (const t of transitions.slice(0, 2)) {
              cards.push(
                <MiniCard
                  key={t.id}
                  tone="done"
                  title={`→ ${stageLabels.get(t.stage) ?? t.stage}`}
                  body={t.note}
                  footer={`${t.changedBy.name} · ${formatRelative(t.createdAt)}`}
                />,
              );
            }
            if (transitions.length === 0) {
              cards.push(
                <MiniCard key={`d-${stage.key}`} tone="done" title="Completed" body="Stage passed" />,
              );
            }
          } else if (status === "current") {
            for (const t of openTasks.slice(0, 2)) {
              const overdue = t.dueDate < new Date();
              cards.push(
                <MiniCard
                  key={t.id}
                  tone="current"
                  title={t.title}
                  body={t.type.replace("_", " ")}
                  footer={overdue ? `Overdue · ${formatRelative(t.dueDate)}` : formatRelative(t.dueDate)}
                  footerTone={overdue ? "danger" : undefined}
                />,
              );
            }
            if (recentActivities[0] && openTasks.length < 2) {
              const a = recentActivities[0];
              cards.push(
                <MiniCard
                  key={a.id}
                  tone="current"
                  title={a.summary}
                  body={a.type.replace("_", " ")}
                  footer={formatRelative(a.occurredAt)}
                />,
              );
            }
            if (cards.length === 0) {
              for (const step of stage.steps.slice(0, 2)) {
                cards.push(
                  <MiniCard key={`c-${stage.key}-${step.id}`} tone="current" title={step.title} body="Suggested" />,
                );
              }
            }
          } else {
            const tint = stage.key === nextStageKey ? "next" : "upcoming";
            for (const step of stage.steps.slice(0, 2)) {
              cards.push(
                <MiniCard
                  key={`u-${stage.key}-${step.id}`}
                  tone={tint}
                  title={step.title}
                  body={tint === "next" ? "Up next" : "Later"}
                />,
              );
            }
          }

          return (
            <div key={stage.key} className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 px-1 mb-2.5">
                <StageDot status={status} />
                <p className="eyebrow text-ink-2">{stage.label}</p>
                {status === "current" ? (
                  <span className="ml-auto chip-ink h-5 px-2 text-[10px]">Now</span>
                ) : stage.key === nextStageKey ? (
                  <span className="ml-auto chip-accent h-5 px-2 text-[10px]">Next</span>
                ) : status === "done" ? (
                  <span className="ml-auto text-[10px] text-ink-4 uppercase tracking-wide-3">
                    Done
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                {cards.length > 0 ? (
                  cards
                ) : (
                  <div className="rounded-xl border border-dashed border-hair-3 p-3 text-[11px] text-ink-4 italic">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageDot({ status }: { status: "done" | "current" | "upcoming" }) {
  if (status === "done") {
    return (
      <span className="h-4 w-4 rounded-full bg-ink flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="rgb(var(--paper))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 5.5l2 2 5-5" />
        </svg>
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="h-4 w-4 rounded-full border-2 border-ink flex items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-ink" />
      </span>
    );
  }
  return <span className="h-4 w-4 rounded-full border-2 border-hair-3" />;
}

function MiniCard({
  tone,
  title,
  body,
  footer,
  footerTone,
}: {
  tone: "done" | "current" | "next" | "upcoming";
  title: string;
  body?: string;
  footer?: string;
  footerTone?: "danger";
}) {
  const toneClass =
    tone === "current"
      ? "bg-ink text-paper border-ink"
      : tone === "next"
      ? "bg-chalk border-accent/30"
      : tone === "done"
      ? "bg-paper-soft/70 border-hair-2"
      : "bg-chalk border-hair border-dashed";

  const bodyClass =
    tone === "current" ? "text-paper/70" : "text-ink-3";

  const footerClass =
    footerTone === "danger"
      ? "text-danger"
      : tone === "current"
      ? "text-paper/60"
      : "text-ink-4";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[12.5px] font-medium leading-snug line-clamp-2">{title}</p>
      {body ? (
        <p className={`text-[10.5px] uppercase tracking-wide-2 mt-1 ${bodyClass} truncate`}>
          {body}
        </p>
      ) : null}
      {footer ? (
        <p className={`text-[10.5px] mt-2 ${footerClass} truncate`}>{footer}</p>
      ) : null}
    </div>
  );
}
