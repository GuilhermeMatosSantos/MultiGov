import { useState } from "react";
import { atividadeRepo } from "../data/repos";
import { FilterBar } from "../components/FilterBar";
import { EmptyState } from "../components/EmptyState";
import { distinctOptions } from "../components/ModulePage";
import { confirmDialog } from "../lib/confirm";
import { toast } from "../lib/toast";

const acaoLabel: Record<string, { texto: string; icon: string }> = {
  criar: { texto: "criou", icon: "🟢" },
  editar: { texto: "editou", icon: "🟡" },
  remover: { texto: "removeu", icon: "🔴" },
};

export function Atividade() {
  const [itens, setItens] = useState(() => atividadeRepo.list());
  const [search, setSearch] = useState("");
  const [entidadeFiltro, setEntidadeFiltro] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");

  function refresh() {
    setItens(atividadeRepo.list());
  }

  const filtered = itens
    .filter((a) => {
      if (
        search &&
        !`${a.nome} ${a.entidade} ${a.modulo} ${a.itemLabel}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (entidadeFiltro && a.entidade !== entidadeFiltro) return false;
      if (acaoFiltro && a.acao !== acaoFiltro) return false;
      if (moduloFiltro && a.modulo !== moduloFiltro) return false;
      return true;
    })
    .sort((a, b) => b.quando.localeCompare(a.quando));

  async function limparHistorico() {
    const ok = await confirmDialog(
      "Limpar todo o registo de atividade? Esta ação não pode ser desfeita.",
      "Limpar"
    );
    if (!ok) return;
    atividadeRepo.reset();
    refresh();
    toast("Registo de atividade limpo.", "info");
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Atividade</h1>
          <p className="page-description">
            Quem fez o quê, e quando — criado, editado ou removido em qualquer módulo, atribuído à identidade
            com que cada pessoa estava a navegar. Não é um registo à prova de adulteração (qualquer pessoa
            pode mudar de identidade a qualquer momento), mas dá visibilidade sobre a interação.
          </p>
        </div>
        {itens.length > 0 && (
          <button className="btn btn-ghost btn-danger" onClick={limparHistorico}>
            Limpar histórico
          </button>
        )}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        filters={[
          { label: "Entidade", value: entidadeFiltro, onChange: setEntidadeFiltro, options: distinctOptions(itens, "entidade") },
          {
            label: "Ação",
            value: acaoFiltro,
            onChange: setAcaoFiltro,
            options: [
              { value: "criar", label: "Criou" },
              { value: "editar", label: "Editou" },
              { value: "remover", label: "Removeu" },
            ],
          },
          { label: "Módulo", value: moduloFiltro, onChange: setModuloFiltro, options: distinctOptions(itens, "modulo") },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          message={
            itens.length === 0
              ? "Ainda sem atividade registada — aparece aqui assim que criares, editares ou removeres algo."
              : "Nada corresponde à pesquisa ou aos filtros aplicados."
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Quem</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>Registo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.quando).toLocaleString("pt-PT")}</td>
                  <td>
                    {a.nome} <span className="feed-item-meta">· {a.entidade}</span>
                  </td>
                  <td>
                    {acaoLabel[a.acao]?.icon} {acaoLabel[a.acao]?.texto ?? a.acao}
                  </td>
                  <td>{a.modulo}</td>
                  <td>{a.itemLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
