import { supabase } from "./supabase";
import { objetoParaCamelCase, objetoParaSnakeCase } from "./caseConvert";
import type { HistoricoTitular, Interlocutor } from "../types";

// O histórico de titulares vive numa tabela filha (interlocutor_historico)
// em vez de uma coluna JSON — por isso este módulo não usa
// createSupabaseRepository() genérico, faz a junção à mão.
export async function listarInterlocutores(): Promise<Interlocutor[]> {
  const [{ data: linhas, error: erroLinhas }, { data: historicoLinhas, error: erroHistorico }] = await Promise.all([
    supabase.from("interlocutores").select("*").order("criado_em", { ascending: false }),
    supabase.from("interlocutor_historico").select("*"),
  ]);
  if (erroLinhas) throw new Error(`Erro ao ler interlocutores: ${erroLinhas.message}`);
  if (erroHistorico) throw new Error(`Erro ao ler histórico de interlocutores: ${erroHistorico.message}`);

  const historicoPorInterlocutor = new Map<string, HistoricoTitular[]>();
  for (const linha of historicoLinhas ?? []) {
    const item = objetoParaCamelCase<HistoricoTitular & { interlocutorId: string }>(linha);
    const lista = historicoPorInterlocutor.get(item.interlocutorId) ?? [];
    lista.push(item);
    historicoPorInterlocutor.set(item.interlocutorId, lista);
  }

  return (linhas ?? []).map((linha) => {
    const item = objetoParaCamelCase<Omit<Interlocutor, "historico">>(linha);
    return { ...item, historico: historicoPorInterlocutor.get(item.id) ?? [] };
  });
}

export async function criarInterlocutor(item: Omit<Interlocutor, "id" | "historico">): Promise<Interlocutor> {
  const payload = objetoParaSnakeCase(item as Record<string, unknown>);
  const { data, error } = await supabase.from("interlocutores").insert(payload).select().single();
  if (error) throw new Error(`Erro ao criar interlocutor: ${error.message}`);
  return { ...objetoParaCamelCase<Omit<Interlocutor, "historico">>(data), historico: [] };
}

export async function atualizarInterlocutor(
  id: string,
  patch: Partial<Omit<Interlocutor, "id" | "historico">>
): Promise<void> {
  const payload = objetoParaSnakeCase(patch as Record<string, unknown>);
  const { error } = await supabase.from("interlocutores").update(payload).eq("id", id);
  if (error) throw new Error(`Erro ao atualizar interlocutor: ${error.message}`);
}

export async function removerInterlocutor(id: string): Promise<void> {
  const { error } = await supabase.from("interlocutores").delete().eq("id", id);
  if (error) throw new Error(`Erro ao remover interlocutor: ${error.message}`);
}

export async function arquivarHistoricoInterlocutor(
  interlocutorId: string,
  entrada: Omit<HistoricoTitular, "id">
): Promise<void> {
  const payload = objetoParaSnakeCase({ ...entrada, interlocutorId } as Record<string, unknown>);
  const { error } = await supabase.from("interlocutor_historico").insert(payload);
  if (error) throw new Error(`Erro ao arquivar histórico do interlocutor: ${error.message}`);
}
