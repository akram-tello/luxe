"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireManager } from "@/lib/auth/guard";
import {
  createStageSchema,
  updateStageSchema,
  reorderStagesSchema,
  createStepSchema,
  updateStepSchema,
  reorderStepsSchema,
} from "@/lib/validators/journey";
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
} from "@/server/services/journey";
import { AppError } from "@/lib/errors";

type State = { error?: string; message?: string };

function handleErr(err: unknown): State {
  if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Invalid input" };
  if (err instanceof AppError) return { error: err.message };
  console.error(err);
  return { error: "Operation failed" };
}

function bump() {
  revalidatePath("/settings/journey");
}

export async function createStageAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const input = createStageSchema.parse({
      key: formData.get("key"),
      label: formData.get("label"),
      kind: formData.get("kind"),
      stagnationDays: formData.get("stagnationDays"),
      slaHours: formData.get("slaHours"),
      color: (formData.get("color") as string) || null,
    });
    await createStage(input);
    bump();
    return { message: "Stage created." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function updateStageAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const input = updateStageSchema.parse({
      id: formData.get("id"),
      label: formData.get("label"),
      kind: formData.get("kind"),
      stagnationDays: formData.get("stagnationDays"),
      slaHours: formData.get("slaHours"),
      color: (formData.get("color") as string) || null,
      active: formData.get("active") === "on",
    });
    await updateStage(input);
    bump();
    return { message: "Stage saved." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function deleteStageAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing id" };
    await deleteStage(id);
    bump();
    return { message: "Stage removed." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function reorderStagesAction(orderedIds: string[]): Promise<State> {
  try {
    await requireManager();
    const input = reorderStagesSchema.parse({ order: orderedIds });
    await reorderStages(input.order);
    bump();
    return { message: "Order saved." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function createStepAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const input = createStepSchema.parse({
      stageId: formData.get("stageId"),
      title: formData.get("title"),
      description: (formData.get("description") as string) || null,
    });
    await createStep(input);
    bump();
    return { message: "Step added." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function updateStepAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const input = updateStepSchema.parse({
      id: formData.get("id"),
      title: formData.get("title"),
      description: (formData.get("description") as string) || null,
      active: formData.get("active") === "on",
    });
    await updateStep(input);
    bump();
    return { message: "Step saved." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function deleteStepAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await requireManager();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing id" };
    await deleteStep(id);
    bump();
    return { message: "Step removed." };
  } catch (err) {
    return handleErr(err);
  }
}

export async function reorderStepsAction(stageId: string, orderedIds: string[]): Promise<State> {
  try {
    await requireManager();
    const input = reorderStepsSchema.parse({ stageId, order: orderedIds });
    await reorderSteps(input.stageId, input.order);
    bump();
    return { message: "Order saved." };
  } catch (err) {
    return handleErr(err);
  }
}
