"use client";

import Link from "next/link";
import { useTransition } from "react";
import { cancelTaskAction, completeTaskAction } from "./actions";

type Props = {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    dueDate: string;
    clientId: string;
    clientName: string;
    assignee: string;
    overdue: boolean;
    relative: string;
  };
};

export function TaskRow({ task }: Props) {
  const [pending, start] = useTransition();
  const isDone = task.status === "COMPLETED" || task.status === "CANCELLED";
  const isHighPrio = task.priority === "HIGH" || task.priority === "CRITICAL";

  return (
    <div className="flex items-center justify-between gap-6 px-7 py-5">
      <div className="flex items-start gap-5 min-w-0 flex-1">
        <div
          className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
            task.overdue
              ? "bg-danger"
              : isDone
              ? "bg-ink-4"
              : isHighPrio
              ? "bg-accent"
              : "bg-ink/30"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {task.overdue ? <span className="chip-danger">Overdue</span> : null}
            {isHighPrio ? (
              <span className="chip-accent">{task.priority}</span>
            ) : null}
            <span className="text-[10px] uppercase tracking-wide-2 text-ink-3">
              {task.type.replace("_", " ")}
            </span>
          </div>
          <p
            className={`text-[14px] mt-2 ${isDone ? "line-through text-ink-4" : "text-ink"}`}
          >
            {task.title}
          </p>
          <p className="text-[11px] uppercase tracking-wide-2 text-ink-3 mt-1.5">
            <Link
              href={`/clients/${task.clientId}`}
              className="hover:text-ink underline-offset-4 hover:underline"
            >
              {task.clientName}
            </Link>
            <span className="mx-2 text-ink-4">·</span>
            <span>{task.assignee}</span>
            <span className="mx-2 text-ink-4">·</span>
            <span>Due {task.relative}</span>
          </p>
        </div>
      </div>
      {!isDone ? (
        <div className="flex gap-2 shrink-0">
          <button
            className="btn-primary btn-sm"
            disabled={pending}
            onClick={() => start(() => completeTaskAction(task.id))}
          >
            Complete
          </button>
          <button
            className="btn-ghost btn-sm"
            disabled={pending}
            onClick={() => start(() => cancelTaskAction(task.id))}
          >
            Cancel
          </button>
        </div>
      ) : (
        <span className="chip-quiet">{task.status}</span>
      )}
    </div>
  );
}
