import type { SessionUser } from "@/lib/auth/session";
import type { AdvanceStageInput } from "@/lib/validators/pipeline";
import { advanceStage, listStageHistory } from "@/server/services/pipeline";

type Ctx = { actor: SessionUser; ip?: string; userAgent?: string };

export function advance(clientId: string, input: AdvanceStageInput, ctx: Ctx) {
  return advanceStage(clientId, input, ctx);
}

export function history(clientId: string) {
  return listStageHistory(clientId);
}
