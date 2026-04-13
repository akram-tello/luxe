import { z } from "zod";
import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(5000).optional(),
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
  dueDate: z.string().datetime({ message: "dueDate must be ISO datetime" }),
  clientId: z.string().min(1),
  assigneeId: z.string().min(1).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(300).optional(),
    description: z.string().trim().max(5000).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    assigneeId: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  type: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  overdue: z.enum(["true", "false"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
