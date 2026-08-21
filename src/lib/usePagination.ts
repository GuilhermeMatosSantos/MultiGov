import { useEffect, useState } from "react";

export function usePagination<T>(items: T[], resetDeps: unknown[], pageSize = 15) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginaAtual = Math.min(page, totalPages);
  const paginated = items.slice((paginaAtual - 1) * pageSize, paginaAtual * pageSize);

  return { page: paginaAtual, setPage, totalPages, paginated };
}
