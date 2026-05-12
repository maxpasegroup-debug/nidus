export function paginationParams(input: { page?: unknown; pageSize?: unknown }, defaults = { page: 1, pageSize: 25, maxPageSize: 100 }) {
  const page = Math.max(1, Number(input.page) || defaults.page);
  const pageSize = Math.min(defaults.maxPageSize, Math.max(1, Number(input.pageSize) || defaults.pageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}
