import { useState } from "react";
import { useLocation } from "react-router-dom";
import { avaliacoesRepoAsync } from "../data/asyncRepos";
import { getIdentidade } from "../lib/session";
import { newId } from "../lib/id";
import { Modal } from "./Modal";
import { toast } from "../lib/toast";
import type { AvaliacaoImpacto } from "../types";

const NOME_MODULO: Record<string, string> = {
  "/": "Painel geral",
  "/atividade": "Atividade",
  "/processos": "Processos",
  "/interlocutores": "Interlocutores",
  "/notificacoes": "Notificações",
  "/noticias": "Notícias & Regulamentação",
  "/base-conhecimento": "Base de Conhecimento",
  "/coordenacao-avisos": "Coordenação de Avisos",
  "/canal-horizontal": "Canal Horizontal",
  "/registo-informal": "Registo do Informal",
  "/monitorizacao-territorial": "Monitorização Territorial",
  "/memoria-projetos": "Memória de Projetos",
  "/transparencia": "Transparência",
};

function moduloAtual(pathname: string): string {
  if (NOME_MODULO[pathname]) return NOME_MODULO[pathname];
  const raiz = "/" + pathname.split("/")[1];
  return NOME_MODULO[raiz] ?? pathname;
}

interface Props {
  colapsada: boolean;
}

export function FeedbackImpacto({ colapsada }: Props) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [comentario, setComentario] = useState("");

  async function responder(ajudou: AvaliacaoImpacto["ajudou"]) {
    const identidade = getIdentidade();
    try {
      await avaliacoesRepoAsync.create({
        id: newId(),
        quando: new Date().toISOString(),
        nome: identidade.nome || "Anónimo",
        entidade: identidade.entidade || "—",
        modulo: moduloAtual(location.pathname),
        ajudou,
        comentario,
      });
      setOpen(false);
      setComentario("");
      toast("Obrigado. O teu feedback ajuda a perceber se isto está mesmo a resolver o problema.");
    } catch (err) {
      console.error(err);
      toast("Erro ao enviar feedback. Tenta novamente.", "error");
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost feedback-trigger"
        onClick={() => setOpen(true)}
        aria-label="Dar feedback sobre esta página"
        title="Dar feedback"
      >
        <span>💬</span>
        {!colapsada && <span>Dar feedback</span>}
      </button>

      {open && (
        <Modal title="Isto ajudou-te?" onClose={() => setOpen(false)}>
          <p className="page-description">
            Em <strong>{moduloAtual(location.pathname)}</strong>, isto ajudou-te a resolver ou acompanhar
            algo mais depressa do que antes?
          </p>
          <div className="form-field form-field-full">
            <label>Comentário (opcional)</label>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que funcionou, ou o que faltou..."
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => responder("nao_relevante")}>
              Não é relevante para mim
            </button>
            <button className="btn btn-ghost btn-danger" onClick={() => responder("nao")}>
              Não ajudou
            </button>
            <button className="btn btn-primary" onClick={() => responder("sim")}>
              Sim, ajudou
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
