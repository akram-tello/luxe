import { prisma } from "@/lib/db/prisma";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type {
  CreateStageInput,
  UpdateStageInput,
  CreateStepInput,
  UpdateStepInput,
} from "@/lib/validators/journey";

export async function createStage(input: CreateStageInput) {
  const existing = await prisma.journeyStage.findUnique({ where: { key: input.key } });
  if (existing) throw new BusinessRuleError("A stage with that key already exists");
  const max = await prisma.journeyStage.aggregate({ _max: { order: true } });
  const order = (max._max.order ?? 0) + 1;
  return prisma.journeyStage.create({
    data: {
      key: input.key,
      label: input.label,
      kind: input.kind,
      stagnationDays: input.stagnationDays,
      slaHours: input.slaHours,
      color: input.color ?? null,
      order,
    },
  });
}

export async function updateStage(input: UpdateStageInput) {
  const stage = await prisma.journeyStage.findUnique({ where: { id: input.id } });
  if (!stage) throw new NotFoundError("Stage not found");
  return prisma.journeyStage.update({
    where: { id: input.id },
    data: {
      label: input.label,
      kind: input.kind,
      stagnationDays: input.stagnationDays,
      slaHours: input.slaHours,
      color: input.color ?? null,
      active: input.active ?? stage.active,
    },
  });
}

export async function deleteStage(id: string) {
  const stage = await prisma.journeyStage.findUnique({ where: { id } });
  if (!stage) throw new NotFoundError("Stage not found");
  const inUse = await prisma.client.count({ where: { stage: stage.key, deletedAt: null } });
  if (inUse > 0) {
    throw new BusinessRuleError(
      `${inUse} client${inUse === 1 ? "" : "s"} still in this stage. Move them first or deactivate the stage.`,
    );
  }
  await prisma.journeyStep.deleteMany({ where: { stageId: id } });
  await prisma.journeyStage.delete({ where: { id } });
}

export async function reorderStages(order: string[]) {
  await prisma.$transaction(
    order.map((id, idx) =>
      prisma.journeyStage.update({ where: { id }, data: { order: idx + 1 } }),
    ),
  );
}

export async function createStep(input: CreateStepInput) {
  const stage = await prisma.journeyStage.findUnique({ where: { id: input.stageId } });
  if (!stage) throw new NotFoundError("Stage not found");
  const max = await prisma.journeyStep.aggregate({
    where: { stageId: input.stageId },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + 1;
  return prisma.journeyStep.create({
    data: {
      stageId: input.stageId,
      title: input.title,
      description: input.description ?? null,
      order,
    },
  });
}

export async function updateStep(input: UpdateStepInput) {
  const step = await prisma.journeyStep.findUnique({ where: { id: input.id } });
  if (!step) throw new NotFoundError("Step not found");
  return prisma.journeyStep.update({
    where: { id: input.id },
    data: {
      title: input.title,
      description: input.description ?? null,
      active: input.active ?? step.active,
    },
  });
}

export async function deleteStep(id: string) {
  const step = await prisma.journeyStep.findUnique({ where: { id } });
  if (!step) throw new NotFoundError("Step not found");
  await prisma.journeyStep.delete({ where: { id } });
}

export async function reorderSteps(stageId: string, order: string[]) {
  await prisma.$transaction(
    order.map((id, idx) =>
      prisma.journeyStep.update({
        where: { id },
        data: { order: idx + 1, stageId },
      }),
    ),
  );
}
