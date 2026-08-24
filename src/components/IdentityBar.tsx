import { useState } from "react";
import { useIdentidade, usePerfis, salvarPerfil, removerPerfil } from "../lib/session";
import { sairConta } from "../lib/auth";
import type { Nivel } from "../types";
import { Modal } from "./Modal";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";
import { InterestsPanel } from "./InterestsPanel";
import { camadaDoNivel, NOME_CAMADA } from "../lib/permissoes";

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

export function IdentityBar() {
  const [identidade, setIdentidade] = useIdentidade();
  const perfis = usePerfis();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(identidade);

  function openModal() {
    setForm(identidade);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIdentidade(form);
    setOpen(false);
  }

  function trocarPara(perfilId: string) {
    const perfil = perfis.find((p) => p.id === perfilId);
    if (!perfil) return;
    setIdentidade({ nome: perfil.nome, entidade: perfil.entidade, nivel: perfil.nivel });
    toast(`A navegar como ${perfil.entidade}.`);
  }

  function handleSalvarPerfil() {
    if (!form.entidade.trim()) {
      toast("Define a entidade antes de guardar o perfil.", "error");
      return;
    }
    salvarPerfil(form);
    toast("Perfil guardado — disponível na barra para trocar rapidamente.");
  }

  async function handleRemoverPerfil(id: string, entidade: string) {
    const ok = await confirmDialog(`Remover o perfil guardado "${entidade}"?`, "Remover");
    if (!ok) return;
    removerPerfil(id);
    toast("Perfil removido.", "info");
  }

  async function handleSair() {
    const ok = await confirmDialog("Terminar sessão?", "Sair");
    if (!ok) return;
    await sairConta();
  }

  const definida = Boolean(identidade.entidade);
  const perfilAtivoId = perfis.find(
    (p) => p.entidade === identidade.entidade && p.nivel === identidade.nivel && p.nome === identidade.nome
  )?.id;

  return (
    <div className="identity-bar">
      <div className="identity-bar-main">
        <span className="identity-bar-label">
          {definida ? (
            <>
              A navegar como <strong>{identidade.nome || "utilizador(a)"}</strong> · {identidade.entidade} ·{" "}
              {identidade.nivel}
              <span
                className="badge badge-info"
                style={{ marginLeft: 8 }}
                title="Camada de permissões — define o que podes criar/editar (protótipo, não é imposto por um servidor)"
              >
                {NOME_CAMADA[camadaDoNivel(identidade.nivel)]}
              </span>
            </>
          ) : (
            <>Ainda não definiste a tua entidade — as notificações relevantes não são destacadas.</>
          )}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <InterestsPanel />
          <button className="btn btn-ghost" onClick={openModal}>
            {definida ? "Alterar" : "Definir identidade"}
          </button>
          {definida && (
            <button className="btn btn-ghost" onClick={handleSair}>
              Sair
            </button>
          )}
        </div>
      </div>

      {perfis.length > 0 && (
        <div className="identity-chips">
          {perfis.map((p) => (
            <button
              key={p.id}
              className={`identity-chip ${perfilAtivoId === p.id ? "identity-chip-active" : ""}`}
              onClick={() => trocarPara(p.id)}
              title={`Trocar para ${p.entidade}`}
            >
              {p.entidade}
            </button>
          ))}
        </div>
      )}

      {open && (
        <Modal title="A minha identidade" onClose={() => setOpen(false)}>
          <p className="page-description">
            Usada para destacar notificações relevantes e pré-preencher a tua entidade em registos novos —
            simula os diferentes pontos de vista de quem usa a aplicação, sem exigir login. Guarda perfis para
            trocar entre entidades com um clique.
          </p>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Nome</label>
              <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Entidade</label>
              <input
                value={form.entidade}
                onChange={(e) => setForm((p) => ({ ...p, entidade: e.target.value }))}
                placeholder="ex.: CIM do Cávado"
              />
            </div>
            <div className="form-field form-field-full">
              <label>Nível</label>
              <select value={form.nivel} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value as Nivel }))}>
                {niveis.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={handleSalvarPerfil}>
                Guardar como perfil
              </button>
              <button type="submit" className="btn btn-primary">
                Aplicar
              </button>
            </div>
          </form>

          {perfis.length > 0 && (
            <div className="processo-timeline">
              <h3>Perfis guardados</h3>
              <ul className="confirmacao-list">
                {perfis.map((p) => (
                  <li key={p.id} className="confirmacao-item">
                    <span>
                      {p.entidade} <span className="feed-item-meta">· {p.nivel}</span>
                    </span>
                    <button className="btn btn-ghost btn-danger" onClick={() => handleRemoverPerfil(p.id, p.entidade)}>
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
