import { requireUserForPage } from "@/lib/auth/guard";
import { listTemplates } from "@/server/services/templates";
import { ALLOWED_TEMPLATE_VARS } from "@/lib/validators/template";
import { TemplateEditor } from "./TemplateEditor";

export default async function TemplatesPage() {
  const actor = await requireUserForPage();
  const templates = await listTemplates();

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Messaging</p>
        <h1 className="font-serif text-3xl mt-1">Templates</h1>
        <p className="text-sm text-bone/50 mt-2">
          Supported variables: {ALLOWED_TEMPLATE_VARS.map((v) => `{{${v}}}`).join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-8">
        <div className="panel divide-y divide-line">
          {templates.length === 0 ? (
            <p className="p-10 text-center text-bone/40">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-lg">{t.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-bone/40 mt-1">{t.category}</p>
                  </div>
                  {t.active ? (
                    <span className="pill-success">Active</span>
                  ) : (
                    <span className="pill-muted">Inactive</span>
                  )}
                </div>
                <p className="mt-4 text-sm text-bone/80 whitespace-pre-wrap border-l border-gold/30 pl-4">
                  {t.body}
                </p>
              </div>
            ))
          )}
        </div>

        {actor.role === "MANAGER" ? (
          <div className="panel p-6 h-fit sticky top-6">
            <p className="label">New template</p>
            <TemplateEditor />
          </div>
        ) : (
          <div className="panel p-6 h-fit">
            <p className="label">Read-only</p>
            <p className="text-sm text-bone/60 mt-3">
              Only managers may create or edit templates. You may use them from any client detail screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
