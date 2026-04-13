export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(opts: {
    message: string;
    status: number;
    code: string;
    expose?: boolean;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = this.constructor.name;
    this.status = opts.status;
    this.code = opts.code;
    this.expose = opts.expose ?? true;
    this.details = opts.details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super({ message, status: 401, code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super({ message, status: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super({ message, status: 404, code: "NOT_FOUND" });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ message, status: 422, code: "VALIDATION_ERROR", details });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super({ message, status: 409, code: "CONFLICT" });
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super({ message, status: 400, code: "BUSINESS_RULE" });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super({ message, status: 429, code: "RATE_LIMITED" });
  }
}
