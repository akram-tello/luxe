import { requireUserForPage } from "@/lib/auth/guard";
import { listTemplates } from "@/server/services/templates";
import { ALLOWED_TEMPLATE_VARS } from "@/lib/validators/template";
import { TemplateEditor } from "./TemplateEditor";
import { PageHeader, SectionHead, Empty } from "../_components/primitives";

export default async function TemplatesPage() {
  const actor = await requireUserForPage();
  const templates = await listTemplates();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Messaging"
        title="Templates"
        subtitle="Your voice, consistent across every touch. Variables injected at send time — the system prepares, never transmits."
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide-3 text-ink-3 mr-1">
          Variables
        </span>
        {ALLOWED_TEMPLATE_VARS.map((v) => (
          <code
            key={v}
            className="numeric text-[11px] px-2 h-6 inline-flex items-center rounded-full bg-paper-soft border border-hair-2 text-ink-2"
          >
            {"{{"}
            {v}
            {"}}"}
          </code>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-6 items-start">
        <div className="surface-flat overflow-hidden">
          {templates.length === 0 ? (
            <Empty>No templates yet.</Empty>
          ) : (
            <ul>
              {templates.map((t, i) => (
                <li key={t.id}>
                  <div className="px-7 py-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="eyebrow">{t.category}</p>
                        <p className="font-display text-[22px] leading-tight tracking-tight-2 mt-1">
                          {t.name}
                        </p>
                      </div>
                      {t.active ? (
                        <span className="chip-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      ) : (
                        <span className="chip-quiet">Inactive</span>
                      )}
                    </div>
                    <div className="mt-5 rounded-xl bg-paper-soft/60 border border-hair-2 p-5">
                      <p className="text-[13px] leading-relaxed text-ink-2 whitespace-pre-wrap text-pretty">
                        {t.body}
                      </p>
                    </div>
                  </div>
                  {i < templates.length - 1 ? <div className="divider" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {actor.role === "MANAGER" ? (
          <div className="surface-flat p-6 sticky top-[88px]">
            <SectionHead eyebrow="Compose" title="New template" />
            <TemplateEditor />
          </div>
        ) : (
          <div className="surface-quiet p-6">
            <p className="eyebrow">Read-only</p>
            <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">
              Only managers create or edit templates. You may use them from any client detail screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
