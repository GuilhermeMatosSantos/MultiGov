import { useEffect, useState } from "react";
import { faqRepo, avisosRepo, processosRepo, indicadoresRepo, projetosRepo, noticiasRepo } from "../data/repos";

export interface Interesses {
  temas: string[];
  programas: string[];
  territorios: string[];
}

const KEY = "multigov.interesses";
const DEFAULT_INTERESSES: Interesses = { temas: [], programas: [], territorios: [] };

export function getInteresses(): Interesses {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_INTERESSES;
  try {
    return { ...DEFAULT_INTERESSES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_INTERESSES;
  }
}

export function setInteresses(interesses: Interesses): void {
  localStorage.setItem(KEY, JSON.stringify(interesses));
  window.dispatchEvent(new CustomEvent("multigov:interesses", { detail: interesses }));
}

export function useInteresses(): [Interesses, (interesses: Interesses) => void] {
  const [interesses, setLocal] = useState<Interesses>(() => getInteresses());

  useEffect(() => {
    function onChange(e: Event) {
      setLocal((e as CustomEvent<Interesses>).detail);
    }
    window.addEventListener("multigov:interesses", onChange);
    return () => window.removeEventListener("multigov:interesses", onChange);
  }, []);

  function update(next: Interesses) {
    setInteresses(next);
    setLocal(next);
  }

  return [interesses, update];
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function distinctStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt"));
}

export function temasDisponiveis(): string[] {
  return distinctStrings([
    ...faqRepo.list().map((f) => f.categoria),
    ...noticiasRepo.list().flatMap((n) => n.temas),
  ]);
}

export function programasDisponiveis(): string[] {
  return distinctStrings([
    ...avisosRepo.list().map((a) => a.programa),
    ...processosRepo.list().map((p) => p.programa),
    ...noticiasRepo.list().flatMap((n) => n.programas),
  ]);
}

export function territoriosDisponiveis(): string[] {
  return distinctStrings([
    ...indicadoresRepo.list().map((i) => i.territorio),
    ...projetosRepo.list().map((p) => p.territorio),
    ...noticiasRepo.list().flatMap((n) => n.territorios),
  ]);
}

export function algumCorresponde(valor: string, selecionados: string[]): boolean {
  if (selecionados.length === 0 || !valor) return false;
  const v = valor.toLowerCase();
  return selecionados.some((s) => v.includes(s.toLowerCase()));
}

export function algumCorrespondeLista(valores: string[], selecionados: string[]): boolean {
  return valores.some((v) => algumCorresponde(v, selecionados));
}

export function noticiaRelevante(noticia: { temas: string[]; programas: string[]; territorios: string[] }, interesses: Interesses): boolean {
  return (
    algumCorrespondeLista(noticia.temas, interesses.temas) ||
    algumCorrespondeLista(noticia.programas, interesses.programas) ||
    algumCorrespondeLista(noticia.territorios, interesses.territorios)
  );
}

export function avisoRelevante(aviso: { programa: string; entidadesEnvolvidas: string }, interesses: Interesses): boolean {
  return (
    algumCorresponde(aviso.programa, interesses.programas) ||
    algumCorrespondeLista(splitList(aviso.entidadesEnvolvidas), interesses.territorios)
  );
}

export function notificacaoRelevantePorInteresse(notificacao: { entidadeOrigem: string }, interesses: Interesses): boolean {
  return algumCorresponde(notificacao.entidadeOrigem, interesses.programas);
}

export function faqRelevante(faq: { categoria: string; programaRelacionado: string }, interesses: Interesses): boolean {
  return (
    algumCorresponde(faq.categoria, interesses.temas) ||
    algumCorresponde(faq.programaRelacionado, interesses.programas)
  );
}

export function projetoRelevante(projeto: { territorio: string; programa: string }, interesses: Interesses): boolean {
  return (
    algumCorresponde(projeto.territorio, interesses.territorios) ||
    algumCorresponde(projeto.programa, interesses.programas)
  );
}

export function totalInteresses(interesses: Interesses): number {
  return interesses.temas.length + interesses.programas.length + interesses.territorios.length;
}
