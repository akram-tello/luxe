import { z } from "zod";

export const cuid = z.string().min(1).max(64);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(200).optional(),
  sort: z.string().trim().max(64).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

export function toPagination(input: PaginationQuery) {
  const page = input.page;
  const take = input.pageSize;
  const skip = (page - 1) * take;
  return { page, pageSize: take, take, skip };
}
