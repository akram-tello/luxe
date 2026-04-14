import { requireManagerForPage } from "@/lib/auth/guard";
import { getJourneyConfig } from "@/lib/journey/config";
import { PageHeader } from "../../_components/primitives";
import { JourneyEditor } from "./JourneyEditor";

export const dynamic = "force-dynamic";

export default async function JourneySettingsPage() {
  await requireManagerForPage();
  const stages = await getJourneyConfig();

  const dto = stages.map((s) => ({
    id: s.id,
    key: s.key,
    label: s.label,
    kind: s.kind,
    order: s.order,
    stagnationDays: s.stagnationDays,
    slaHours: s.slaHours,
    color: s.color,
    active: s.active,
    steps: s.steps.map((st) => ({
      id: st.id,
      title: st.title,
      description: st.description,
      order: st.order,
      active: st.active,
    })),
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Configuration"
        title="Client journey"
        subtitle="Design the stages every client moves through, and the checklist that lives inside each one."
      />
      <JourneyEditor stages={dto} />
    </div>
  );
}
