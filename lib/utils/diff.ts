type Dict = Record<string, unknown>;

export function diffObjects<T extends Dict>(
  before: T | null | undefined,
  after: T | null | undefined,
): { before: Partial<T>; after: Partial<T> } | null {
  if (!before && !after) return null;
  const b = before ?? ({} as T);
  const a = after ?? ({} as T);
  const keys = new Set<string>([...Object.keys(b), ...Object.keys(a)]);
  const outBefore: Dict = {};
  const outAfter: Dict = {};
  let changed = false;
  for (const key of keys) {
    const lhs = b[key];
    const rhs = a[key];
    if (!shallowEqual(lhs, rhs)) {
      outBefore[key] = lhs;
      outAfter[key] = rhs;
      changed = true;
    }
  }
  if (!changed) return null;
  return { before: outBefore as Partial<T>, after: outAfter as Partial<T> };
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a && b && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}
