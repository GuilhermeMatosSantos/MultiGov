import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { interlocutoresRepo } from "../data/repos";
import { newId } from "../lib/id";
import type { Interlocutor, Nivel } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { distinctOptions } from "../components/ModulePage";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { registarAtividade } from "../lib/atividade";
import { usePagination } from "../lib/usePagination";

const niveis: Nivel[] = [
  "Comissão Europeia",
  "Nacional",
  "Regional (CCDR)",
  "Intermunicipal (CIM/AM)",
  "Municipal",
  "Organismo Intermédio",
  "Autoridade de Gestão",
  "Programa Temático",
  "ADC",
];

function emptyForm(): Omit<Interlocutor, "id" | "historico"> {
  return {
    nome: "",
    cargo: "",
    entidade: "",
    nivel: "Municipal",
    areaResponsabilidade: "",
    email: "",
    telefone: "",
    atualizadoEm: new Date().toISOString().slice(0, 10),
    notas: "",
  };
}

function emptySubstituicao() {
  return {
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    desde: new Date().toISOString().slice(0, 10),
  };
}

export function Interlocutores() {
  const location = useLocation();
  const [items, setItems] = useState<Interlocutor[]>(() => interlocutoresRepo.list());
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [entidadeFiltro, setEntidadeFiltro] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interlocutor | null>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [historicoAberto, setHistoricoAberto] = useState<Interlocutor | null>(null);
  const [substituicaoAlvo, setSubstituicaoAlvo] = useState<Interlocutor | null>(null);
  const [substituicaoForm, setSubstituicaoForm] = useState(emptySubstituicao());

  function refresh() {
    setItems(interlocutoresRepo.list());
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      if (q && !`${i.nome} ${i.entidade} ${i.nivel} ${i.areaResponsabilidade}`.toLowerCase().includes(q)) {
        return false;
      }
      if (nivelFiltro && i.nivel !== nivelFiltro) return false;
      if (entidadeFiltro && i.entidade !== entidadeFiltro) return false;
      return true;
    });
  }, [items, search, nivelFiltro, entidadeFiltro]);

  const { page, setPage, totalPages, paginated } = usePagination(filtered, [search, nivelFiltro, entidadeFiltro]);

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm());
    setFormOpen(true);
  }

  function openEdit(item: Interlocutor) {
    setEditing(item);
    setFormData({ ...item });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      interlocutoresRepo.update(editing.id, formData);
      toast("Alterações guardadas.");
      registarAtividade("editar", "Interlocutores", formData.nome);
    } else {
      interlocutoresRepo.create({ id: newId(), ...formData, historico: [] });
      toast("Interlocutor criado.");
      registarAtividade("criar", "Interlocutores", formData.nome);
    }
    refresh();
    setFormOpen(false);
  }

  async function handleDelete(item: Interlocutor) {
    const ok = await confirmDialog(`Remover "${item.nome}" (${item.entidade})? Esta ação não pode ser desfeita.`, "Remover");
    if (!ok) return;
    interlocutoresRepo.remove(item.id);
    refresh();
    toast("Interlocutor removido.", "info");
    registarAtividade("remover", "Interlocutores", `${item.nome} (${item.entidade})`);
  }

  function openSubstituicao(item: Interlocutor) {
    setSubstituicaoAlvo(item);
    setSubstituicaoForm(emptySubstituicao());
  }

  function handleSubstituicao(e: React.FormEvent) {
    e.preventDefault();
    if (!substituicaoAlvo) return;
    const arquivado = {
      id: newId(),
      nome: substituicaoAlvo.nome,
      cargo: substituicaoAlvo.cargo,
      email: substituicaoAlvo.email,
      telefone: substituicaoAlvo.telefone,
      desde: substituicaoAlvo.atualizadoEm,
      ate: substituicaoForm.desde,
    };
    interlocutoresRepo.update(substituicaoAlvo.id, {
      nome: substituicaoForm.nome,
      cargo: substituicaoForm.cargo,
      email: substituicaoForm.email,
      telefone: substituicaoForm.telefone,
      atualizadoEm: substituicaoForm.desde,
      historico: [...(substituicaoAlvo.historico ?? []), arquivado],
    });
    refresh();
    setSubstituicaoAlvo(null);
    toast(`Titular substituído — ${arquivado.nome} passou para o histórico.`);
    registarAtividade("editar", "Interlocutores", `Substituição em ${substituicaoAlvo.entidade}: ${substituicaoForm.nome}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Diretório vivo de interlocutores</h1>
          <p className="page-description">
            Quem é quem por nível e domínio — interlocutor atual, área de responsabilidade e contacto. Ao
            substituir um titular, o anterior fica guardado no histórico em vez de se perder.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Novo registo
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        filters={[
          { label: "Nível", value: nivelFiltro, onChange: setNivelFiltro, options: niveis.map((n) => ({ value: n, label: n })) },
          { label: "Entidade", value: entidadeFiltro, onChange: setEntidadeFiltro, options: distinctOptions(items, "entidade") },
        ]}
      />

      {filtered.length === 0 ? (
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
                <th>Nome</th>
                <th>Cargo</th>
                <th>Entidade</th>
                <th>Nível</th>
                <th>Contacto</th>
                <th>Titular desde</th>
                <th className="actions-col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((i) => (
                <tr key={i.id}>
                  <td>{i.nome}</td>
                  <td>{i.cargo}</td>
                  <td>{i.entidade}</td>
                  <td>{i.nivel}</td>
                  <td>
                    {i.email} · {i.telefone}
                  </td>
                  <td>{i.atualizadoEm}</td>
                  <td className="actions-col">
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setHistoricoAberto(i)}
                      title="Histórico"
                      aria-label={`Histórico de ${i.nome}`}
                    >
                      🕘{(i.historico?.length ?? 0) > 0 ? ` ${i.historico.length}` : ""}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => openSubstituicao(i)}
                      title="Substituir titular"
                      aria-label={`Substituir titular de ${i.nome}`}
                    >
                      🔄
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(i)} title="Editar" aria-label={`Editar ${i.nome}`}>
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-danger btn-icon"
                      onClick={() => handleDelete(i)}
                      title="Remover"
                      aria-label={`Remover ${i.nome}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {formOpen && (
        <Modal title={editing ? "Editar registo" : "Novo registo"} onClose={() => setFormOpen(false)}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label>
                Nome<span className="required">*</span>
              </label>
              <input
                required
                value={formData.nome}
                onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>
                Cargo<span className="required">*</span>
              </label>
              <input
                required
                value={formData.cargo}
                onChange={(e) => setFormData((p) => ({ ...p, cargo: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>
                Entidade<span className="required">*</span>
              </label>
              <input
                required
                value={formData.entidade}
                onChange={(e) => setFormData((p) => ({ ...p, entidade: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Nível</label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData((p) => ({ ...p, nivel: e.target.value as Nivel }))}
              >
                {niveis.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field form-field-full">
              <label>Área de responsabilidade</label>
              <input
                value={formData.areaResponsabilidade}
                onChange={(e) => setFormData((p) => ({ ...p, areaResponsabilidade: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input
                value={formData.telefone}
                onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Titular desde</label>
              <input
                type="date"
                value={formData.atualizadoEm}
                onChange={(e) => setFormData((p) => ({ ...p, atualizadoEm: e.target.value }))}
              />
            </div>
            <div className="form-field form-field-full">
              <label>Notas</label>
              <textarea
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData((p) => ({ ...p, notas: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {historicoAberto && (
        <Modal title={`Histórico — ${historicoAberto.entidade}`} onClose={() => setHistoricoAberto(null)}>
          <p className="page-description">
            Titular atual: <strong>{historicoAberto.nome}</strong> ({historicoAberto.cargo}), desde{" "}
            {historicoAberto.atualizadoEm}.
          </p>
          {(historicoAberto.historico?.length ?? 0) === 0 ? (
            <p className="page-description">Sem titulares anteriores registados.</p>
          ) : (
            <div className="forum-messages">
              {[...historicoAberto.historico]
                .sort((a, b) => b.ate.localeCompare(a.ate))
                .map((h) => (
                  <div key={h.id} className="forum-message">
                    <div className="forum-message-header">
                      <strong>{h.nome}</strong>
                      <span className="feed-item-meta">
                        {h.desde} → {h.ate}
                      </span>
                    </div>
                    <p>
                      {h.cargo} · {h.email} · {h.telefone}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}

      {substituicaoAlvo && (
        <Modal
          title={`Substituir titular — ${substituicaoAlvo.entidade}`}
          onClose={() => setSubstituicaoAlvo(null)}
        >
          <p className="page-description">
            O titular atual ({substituicaoAlvo.nome}) passa para o histórico com a data de fim indicada
            abaixo.
          </p>
          <form className="form" onSubmit={handleSubstituicao}>
            <div className="form-field">
              <label>
                Novo nome<span className="required">*</span>
              </label>
              <input
                required
                value={substituicaoForm.nome}
                onChange={(e) => setSubstituicaoForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Cargo</label>
              <input
                value={substituicaoForm.cargo}
                onChange={(e) => setSubstituicaoForm((p) => ({ ...p, cargo: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                value={substituicaoForm.email}
                onChange={(e) => setSubstituicaoForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input
                value={substituicaoForm.telefone}
                onChange={(e) => setSubstituicaoForm((p) => ({ ...p, telefone: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Titular desde</label>
              <input
                type="date"
                value={substituicaoForm.desde}
                onChange={(e) => setSubstituicaoForm((p) => ({ ...p, desde: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSubstituicaoAlvo(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar substituição
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
