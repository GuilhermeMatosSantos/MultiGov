import { useState } from "react";
import { atividadeRepo, avaliacoesRepo } from "../data/repos";
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
  const avaliacoes = avaliacoesRepo.list();
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

  // Padrões de atividade por entidade (não por pessoa) podem funcionar
  // como indicador indireto de capacidade administrativa desigual entre
  // AG/OI — não é vigilância individual, é onde reforçar apoio.
  const HA_30_DIAS = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const contagemPorEntidade = new Map<string, number>();
  for (const a of itens) {
    if (new Date(a.quando).getTime() < HA_30_DIAS) continue;
    contagemPorEntidade.set(a.entidade, (contagemPorEntidade.get(a.entidade) ?? 0) + 1);
  }
  const entidadesOrdenadas = Array.from(contagemPorEntidade.entries()).sort((a, b) => b[1] - a[1]);
  const maxContagem = Math.max(...entidadesOrdenadas.map(([, n]) => n), 1);

  // Evidência de impacto, não só de uso: quantas pessoas dizem que isto
  // ajudou, por módulo — para a avaliação da ferramenta se apoiar em dados,
  // não só na intuição de quem a construiu.
  const respostasRelevantes = avaliacoes.filter((a) => a.ajudou !== "nao_relevante");
  const percentagemPositiva =
    respostasRelevantes.length === 0
      ? null
      : Math.round((respostasRelevantes.filter((a) => a.ajudou === "sim").length / respostasRelevantes.length) * 100);
  const porModulo = new Map<string, { sim: number; nao: number }>();
  for (const a of respostasRelevantes) {
    const atual = porModulo.get(a.modulo) ?? { sim: 0, nao: 0 };
    if (a.ajudou === "sim") atual.sim += 1;
    else atual.nao += 1;
    porModulo.set(a.modulo, atual);
  }

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

      {avaliacoes.length > 0 && (
        <section className="chart-section">
          <h2>
            Feedback de impacto
            {percentagemPositiva !== null && (
              <span className="feed-item-meta"> · {percentagemPositiva}% diz que ajudou ({respostasRelevantes.length} resposta(s))</span>
            )}
          </h2>
          {Array.from(porModulo.entries()).map(([modulo, { sim, nao }]) => {
            const total = sim + nao;
            return (
              <div key={modulo} className="chart-bar-row">
                <span className="chart-bar-label" title={modulo}>
                  {modulo}
                </span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${Math.max((sim / total) * 100, 3)}%` }} />
                </div>
                <span className="chart-bar-value">
                  {sim}/{total} sim
                </span>
              </div>
            );
          })}
        </section>
      )}

      {entidadesOrdenadas.length > 0 && (
        <section className="chart-section">
          <h2>Ações por entidade — últimos 30 dias</h2>
          {entidadesOrdenadas.map(([entidade, n]) => (
            <div key={entidade} className="chart-bar-row">
              <span className="chart-bar-label" title={entidade}>
                {entidade}
              </span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${Math.max((n / maxContagem) * 100, 3)}%` }} />
              </div>
              <span className="chart-bar-value">{n} ação(ões)</span>
            </div>
          ))}
        </section>
      )}

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
