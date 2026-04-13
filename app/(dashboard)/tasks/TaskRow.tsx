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

  return (
    <div
      className={`flex items-center justify-between gap-6 px-6 py-5 ${
        task.overdue ? "bg-danger/5" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          {task.overdue ? <span className="pill-danger">Overdue</span> : null}
          {task.priority === "HIGH" || task.priority === "CRITICAL" ? (
            <span className="pill-gold">{task.priority}</span>
          ) : null}
          <span className="text-[10px] uppercase tracking-widest text-bone/50">
            {task.type.replace("_", " ")}
          </span>
        </div>
        <p className={`text-sm mt-2 ${isDone ? "line-through text-bone/40" : ""}`}>{task.title}</p>
        <p className="text-[11px] uppercase tracking-widest text-bone/40 mt-1">
          <Link href={`/clients/${task.clientId}`} className="hover:text-gold">
            {task.clientName}
          </Link>
          <span className="mx-2 text-bone/20">·</span>
          <span>{task.assignee}</span>
          <span className="mx-2 text-bone/20">·</span>
          <span>Due {task.relative}</span>
        </p>
      </div>
      {!isDone ? (
        <div className="flex gap-2">
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => start(() => completeTaskAction(task.id))}
          >
            Complete
          </button>
          <button
            className="btn-ghost"
            disabled={pending}
            onClick={() => start(() => cancelTaskAction(task.id))}
          >
            Cancel
          </button>
        </div>
      ) : (
        <span className="pill-muted">{task.status}</span>
      )}
    </div>
  );
}
