import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { AsyncRepository } from "../lib/asyncRepository";
import { newId } from "../lib/id";
import { Modal } from "./Modal";
import { EmptyState } from "./EmptyState";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { TagInput } from "./TagInput";
import { registarAtividade } from "../lib/atividade";
import { useFavoritos } from "../lib/favoritos";
import { useIdentidade } from "../lib/session";
import { podeEscrever } from "../lib/permissoes";
import { ModuleHelp, type AjudaModulo } from "./ModuleHelp";

export type FieldType = "text" | "textarea" | "date" | "select" | "checkbox" | "tags";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig<T> {
  key: keyof T;
  label: string;
  type: FieldType;
  options?: (string | SelectOption)[];
  required?: boolean;
  fullWidth?: boolean;
  /** Princípio "once-only": ao escolher este valor, devolve outros campos a
   * preencher automaticamente a partir daí (ex.: entidade/programa de um
   * processo já registado), para não pedir a mesma informação outra vez. */
  onValueChange?: (value: string) => Record<string, unknown> | void;
}

function toSelectOption(opt: string | SelectOption): SelectOption {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export interface FilterConfig<T> {
  key: keyof T;
  label: string;
  options: (string | SelectOption)[];
}

export function distinctOptions<T>(items: T[], key: keyof T): SelectOption[] {
  const values = Array.from(new Set(items.map((item) => String(item[key] ?? "")).filter(Boolean)));
  values.sort((a, b) => a.localeCompare(b, "pt"));
  return values.map((v) => ({ value: v, label: v }));
}

interface ModulePageProps<T extends { id: string }> {
  title: string;
  description: string;
  repo: AsyncRepository<T>;
  columns: ColumnConfig<T>[];
  fields: FieldConfig<T>[];
  searchKeys: (keyof T)[];
  filters?: FilterConfig<T>[];
  defaultSortKey?: keyof T;
  defaultSortDirection?: "asc" | "desc";
  emptyItem: () => Omit<T, "id">;
  itemLabel: (item: T) => string;
  extraActions?: (item: T, refresh: () => Promise<void>) => React.ReactNode;
  bulkActions?: (selecionados: T[], refresh: () => Promise<void>, clearSelection: () => void) => React.ReactNode;
  renderAbove?: (filtered: T[]) => React.ReactNode;
  ajuda?: AjudaModulo;
}

export function ModulePage<T extends { id: string }>({
  title,
  description,
  repo,
  columns,
  fields,
  searchKeys,
  filters,
  defaultSortKey,
  defaultSortDirection = "desc",
  emptyItem,
  itemLabel,
  extraActions,
  bulkActions,
  renderAbove,
  ajuda,
}: ModulePageProps<T>) {
  const location = useLocation();
  const [identidade] = useIdentidade();
  const moduloRota = location.pathname.replace(/^\//, "").split("/")[0] || "painel";
  const podeEditar = podeEscrever(identidade.nivel, moduloRota);
  const { isFavorito, toggle: toggleFavorito } = useFavoritos();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<T | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (q && !searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(q))) {
        return false;
      }
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        return String(item[key as keyof T] ?? "") === value;
      });
    });
    if (defaultSortKey) {
      result.sort((a, b) => {
        const av = String(a[defaultSortKey] ?? "");
        const bv = String(b[defaultSortKey] ?? "");
        return defaultSortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [items, search, searchKeys, filterValues, defaultSortKey, defaultSortDirection]);

  const hasActiveFilters = Boolean(search) || Object.values(filterValues).some(Boolean);

  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, filterValues]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginaAtual = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE),
    [filtered, paginaAtual]
  );

  function clearFilters() {
    setSearch("");
    setFilterValues({});
  }

  async function refresh() {
    const lista = await repo.list();
    setItems(lista);
  }

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    repo
      .list()
      .then((lista) => {
        if (!cancelado) setItems(lista);
      })
      .catch((err) => {
        console.error(err);
        toast("Erro ao carregar registos.", "error");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);

  function openCreate() {
    setEditing(null);
    setFormData({ ...emptyItem() });
    setFormOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    setFormData({ ...item });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await repo.update(editing.id, formData as Partial<T>);
        toast("Alterações guardadas.");
        registarAtividade("editar", title, itemLabel(editing));
      } else {
        const id = newId();
        const criado = { id, ...formData } as T;
        await repo.create(criado);
        toast("Novo registo criado.");
        registarAtividade("criar", title, itemLabel(criado));
      }
      await refresh();
      closeForm();
    } catch (err) {
      console.error(err);
      toast("Erro ao guardar. Tenta novamente.", "error");
    }
  }

  async function handleDelete(item: T) {
    const ok = await confirmDialog(`Remover "${itemLabel(item)}"? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    try {
      await repo.remove(item.id);
      await refresh();
      toast("Registo removido.", "info");
      registarAtividade("remover", title, itemLabel(item));
    } catch (err) {
      console.error(err);
      toast("Erro ao remover. Tenta novamente.", "error");
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const todosVisiveisSelecionados = paginated.length > 0 && paginated.every((item) => selected.has(item.id));

  function toggleSelecionarTodosVisiveis() {
    setSelected((prev) => {
      if (todosVisiveisSelecionados) {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id));
        return next;
      }
      const next = new Set(prev);
      paginated.forEach((item) => next.add(item.id));
      return next;
    });
  }

  const selecionados = items.filter((item) => selected.has(item.id));

  async function handleBulkDelete() {
    const ok = await confirmDialog(
      `Remover ${selecionados.length} registo(s) selecionado(s)? Esta ação não pode ser desfeita.`,
      "Remover"
    );
    if (!ok) return;
    try {
      await Promise.all(selecionados.map((item) => repo.remove(item.id)));
      clearSelection();
      await refresh();
      toast(`${selecionados.length} registo(s) removido(s).`, "info");
      registarAtividade("remover", title, `${selecionados.length} registo(s) em lote`);
    } catch (err) {
      console.error(err);
      toast("Erro ao remover registos. Tenta novamente.", "error");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {title}
            {ajuda && <ModuleHelp titulo={title} {...ajuda} />}
          </h1>
          <p className="page-description">{description}</p>
        </div>
        {podeEditar ? (
          <button className="btn btn-primary" onClick={openCreate}>
            + Novo registo
          </button>
        ) : (
          <span className="badge badge-neutral" title="O teu perfil tem acesso de leitura a este módulo">
            🔒 Acesso de leitura
          </span>
        )}
      </div>

      {renderAbove?.(filtered)}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filters?.filter((filter) => filter.options.length > 1).map((filter) => (
          <select
            key={String(filter.key)}
            className="filter-select"
            value={filterValues[filter.key as string] ?? ""}
            onChange={(e) =>
              setFilterValues((prev) => ({ ...prev, [filter.key as string]: e.target.value }))
            }
          >
            <option value="">{filter.label}: todos</option>
            {filter.options.map(toSelectOption).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {hasActiveFilters && (
          <button className="btn btn-ghost" onClick={clearFilters}>
            ✕ Limpar filtros
          </button>
        )}
        <span className="count-badge">{filtered.length} registo(s)</span>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selected.size} selecionado(s)</span>
          {bulkActions?.(selecionados, refresh, clearSelection)}
          {podeEditar && (
            <button className="btn btn-ghost btn-danger" onClick={handleBulkDelete}>
              🗑️ Remover selecionados
            </button>
          )}
          <button className="btn btn-ghost" onClick={clearSelection}>
            ✕ Limpar seleção
          </button>
        </div>
      )}

      {loading ? (
        <EmptyState message="A carregar registos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            items.length === 0
              ? "Sem registos. Cria o primeiro."
              : "Nenhum registo corresponde à pesquisa ou aos filtros aplicados."
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="select-col">
                  <input
                    type="checkbox"
                    checked={todosVisiveisSelecionados}
                    onChange={toggleSelecionarTodosVisiveis}
                    aria-label="Selecionar todos os registos visíveis"
                  />
                </th>
                {columns.map((col) => (
                  <th key={String(col.key)}>{col.label}</th>
                ))}
                <th className="actions-col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item.id} className={selected.has(item.id) ? "row-selected" : ""}>
                  <td className="select-col">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Selecionar ${itemLabel(item)}`}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="actions-col">
                    <button
                      className={`btn btn-ghost btn-icon ${isFavorito(`${location.pathname}:${item.id}`) ? "btn-favorito-ativo" : ""}`}
                      onClick={() =>
                        toggleFavorito({
                          key: `${location.pathname}:${item.id}`,
                          label: itemLabel(item),
                          modulo: title,
                          to: location.pathname,
                        })
                      }
                      title={isFavorito(`${location.pathname}:${item.id}`) ? "Deixar de seguir" : "Seguir"}
                      aria-label={`${isFavorito(`${location.pathname}:${item.id}`) ? "Deixar de seguir" : "Seguir"} ${itemLabel(item)}`}
                    >
                      {isFavorito(`${location.pathname}:${item.id}`) ? "★" : "☆"}
                    </button>
                    {extraActions?.(item, refresh)}
                    {podeEditar && (
                      <>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)} title="Editar" aria-label={`Editar ${itemLabel(item)}`}>
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-danger btn-icon"
                          onClick={() => handleDelete(item)}
                          title="Remover"
                          aria-label={`Remover ${itemLabel(item)}`}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {paginaAtual} de {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={paginaAtual === totalPages}
          >
            Seguinte →
          </button>
        </div>
      )}

      {formOpen && (
        <Modal title={editing ? "Editar registo" : "Novo registo"} onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            {fields.map((field) =>
              field.type === "checkbox" ? (
                <div
                  key={String(field.key)}
                  className={`form-field form-field-checkbox ${field.fullWidth ? "form-field-full" : ""}`}
                >
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={Boolean(formData[field.key as string])}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key as string]: e.target.checked }))
                      }
                    />
                    {field.label}
                  </label>
                </div>
              ) : (
                <div
                  key={String(field.key)}
                  className={`form-field ${field.fullWidth ? "form-field-full" : ""}`}
                >
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {field.type === "textarea" && (
                    <textarea
                      required={field.required}
                      value={String(formData[field.key as string] ?? "")}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key as string]: e.target.value }))
                      }
                      rows={3}
                    />
                  )}
                  {field.type === "select" && (
                    <select
                      required={field.required}
                      value={String(formData[field.key as string] ?? "")}
                      onChange={(e) => {
                        const value = e.target.value;
                        const extra = field.onValueChange?.(value) ?? {};
                        setFormData((prev) => ({ ...prev, [field.key as string]: value, ...extra }));
                      }}
                    >
                      <option value="">Selecionar...</option>
                      {field.options?.map(toSelectOption).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === "tags" && (
                    <TagInput
                      value={(formData[field.key as string] as string[] | undefined) ?? []}
                      onChange={(next) =>
                        setFormData((prev) => ({ ...prev, [field.key as string]: next }))
                      }
                      suggestions={field.options?.map(toSelectOption).map((o) => o.value) ?? []}
                    />
                  )}
                  {(field.type === "text" || field.type === "date") && (
                    <input
                      type={field.type}
                      required={field.required}
                      value={String(formData[field.key as string] ?? "")}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key as string]: e.target.value }))
                      }
                    />
                  )}
                </div>
              )
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={closeForm}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
