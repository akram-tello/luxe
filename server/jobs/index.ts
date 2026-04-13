export { runSlaBreachJob } from "./slaBreach";
export { runStagnationJob } from "./stagnation";
export { runAnniversaryJob } from "./anniversary";
export { runServiceReminderJob } from "./serviceReminder";
export { runDormantClientJob } from "./dormantClient";

export type JobResult = {
  job: string;
  scanned: number;
  created: number;
  notified: number;
  startedAt: string;
  finishedAt: string;
};
