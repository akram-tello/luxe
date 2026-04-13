import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

type JsonBody = Record<string, unknown> | unknown[] | null;

export function jsonOk<T extends JsonBody>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function jsonCreated<T extends JsonBody>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid input", err.flatten());
  }
  if (err instanceof AppError) {
    return jsonError(
      err.status,
      err.code,
      err.expose ? err.message : "Request failed",
      err.details,
    );
  }
  console.error("[route error]", err);
  return jsonError(500, "INTERNAL", "An unexpected error occurred");
}
