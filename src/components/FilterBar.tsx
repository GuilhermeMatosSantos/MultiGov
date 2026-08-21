export interface FilterBarFilter {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterBarFilter[];
  resultCount: number;
  resultLabel?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  filters = [],
  resultCount,
  resultLabel = "registo(s)",
}: FilterBarProps) {
  const hasActive = Boolean(search) || filters.some((f) => f.value);

  function clearAll() {
    onSearchChange("");
    filters.forEach((f) => f.onChange(""));
  }

  return (
    <div className="toolbar">
      <input
        className="search-input"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {filters.filter((f) => f.options.length > 1).map((f) => (
        <select key={f.label} className="filter-select" value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          <option value="">{f.label}: todos</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button className="btn btn-ghost" onClick={clearAll}>
          Limpar filtros
        </button>
      )}
      <span className="count-badge">
        {resultCount} {resultLabel}
      </span>
    </div>
  );
}
