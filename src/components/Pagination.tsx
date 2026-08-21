interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        ← Anterior
      </button>
      <span className="pagination-info">
        Página {page} de {totalPages}
      </span>
      <button
        className="btn btn-ghost"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Seguinte →
      </button>
    </div>
  );
}
