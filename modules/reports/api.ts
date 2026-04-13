import { UserRole } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import {
  associateLeaderboard,
  associateSummary,
  defaultRange,
  managerOverview,
  pipelineDistribution,
} from "@/server/services/reports";

export function forActor(actor: SessionUser) {
  if (actor.role === UserRole.MANAGER) {
    return Promise.all([
      managerOverview(),
      associateLeaderboard(defaultRange(90)),
    ]).then(([overview, leaderboard]) => ({ overview, leaderboard }));
  }
  return Promise.all([
    associateSummary(actor.id),
    pipelineDistribution(actor.id),
  ]).then(([summary, pipeline]) => ({ summary, pipeline }));
}

export { associateLeaderboard, associateSummary, managerOverview, pipelineDistribution };
