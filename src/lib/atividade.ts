import { atividadeRepo } from "../data/repos";
import { getIdentidade } from "./session";
import { newId } from "./id";
import type { Atividade } from "../types";

export function registarAtividade(acao: Atividade["acao"], modulo: string, itemLabel: string): void {
  const identidade = getIdentidade();
  if (!identidade.entidade) return;
  atividadeRepo.create({
    id: newId(),
    quando: new Date().toISOString(),
    nome: identidade.nome || "Sem nome",
    entidade: identidade.entidade,
    acao,
    modulo,
    itemLabel,
  });
}
