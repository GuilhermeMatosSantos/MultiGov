import { notificacoesRepo, avisosRepo } from "../data/repos";
import { getIdentidade } from "./session";

const ATIVAS_KEY = "multigov.notificacoesBrowserAtivas";
const ENVIADAS_KEY = "multigov.notificacoesBrowserJaEnviadas";

export function notificacoesBrowserSuportadas(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificacoesBrowserAtivas(): boolean {
  return (
    notificacoesBrowserSuportadas() &&
    localStorage.getItem(ATIVAS_KEY) === "1" &&
    Notification.permission === "granted"
  );
}

export async function ativarNotificacoesBrowser(): Promise<boolean> {
  if (!notificacoesBrowserSuportadas()) return false;
  const permissao = await Notification.requestPermission();
  const ativo = permissao === "granted";
  localStorage.setItem(ATIVAS_KEY, ativo ? "1" : "0");
  window.dispatchEvent(new CustomEvent("multigov:notificacoesBrowser"));
  return ativo;
}

export function desativarNotificacoesBrowser(): void {
  localStorage.setItem(ATIVAS_KEY, "0");
  window.dispatchEvent(new CustomEvent("multigov:notificacoesBrowser"));
}

function jaEnviados(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(ENVIADAS_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function marcarEnviado(id: string): void {
  const atuais = jaEnviados();
  atuais.add(id);
  localStorage.setItem(ENVIADAS_KEY, JSON.stringify([...atuais]));
}

/** Só os destaques mais urgentes (risco de perder fundos, confirmação
 * pendente da tua entidade) — um alerta do sistema operativo não é sítio
 * para o resto do "Resumo do dia", só para o que não pode esperar por
 * abrires a aba. Cada item só notifica uma vez (marcado por id). */
export function verificarENotificar(): void {
  if (!notificacoesBrowserAtivas()) return;
  const identidade = getIdentidade();
  const enviados = jaEnviados();

  for (const n of notificacoesRepo.list()) {
    if (!n.riscoDescompromisso || n.lida) continue;
    const id = `n3-${n.id}`;
    if (enviados.has(id)) continue;
    new Notification("MULTI.GOV · Risco de descompromisso de fundos", { body: n.titulo, tag: id });
    marcarEnviado(id);
  }

  if (identidade.entidade) {
    for (const a of avisosRepo.list()) {
      const pendente = (a.confirmacoes ?? []).find(
        (c) => c.entidade.toLowerCase().includes(identidade.entidade.toLowerCase()) && !c.confirmado
      );
      if (!pendente) continue;
      const id = `conf-${a.id}`;
      if (enviados.has(id)) continue;
      new Notification("MULTI.GOV · Confirmação pendente", { body: a.titulo, tag: id });
      marcarEnviado(id);
    }
  }
}
