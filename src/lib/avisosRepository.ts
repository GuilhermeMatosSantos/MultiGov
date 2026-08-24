import { supabase } from "./supabase";
import { objetoParaCamelCase, objetoParaSnakeCase } from "./caseConvert";
import type { Aviso, ConfirmacaoEntidade, Mensagem } from "../types";

// "comentarios" e "confirmacoes" vivem em tabelas filhas
// (aviso_comentarios, aviso_confirmacoes) — junção feita à mão, como em
// interlocutoresRepository.ts.
function normalizarOpcionais(obj: Record<string, unknown>): Record<string, unknown> {
  const resultado = { ...obj };
  for (const campo of ["dataPrevistaAbertura", "dataPrevistaFecho"]) {
    if (resultado[campo] === "") resultado[campo] = null;
  }
  return resultado;
}

export async function listarAvisos(): Promise<Aviso[]> {
  const [{ data: linhas, error: erroAvisos }, { data: comentarios, error: erroComentarios }, { data: confirmacoes, error: erroConfirmacoes }] =
    await Promise.all([
      supabase.from("avisos").select("*").order("criado_em", { ascending: false }),
      supabase.from("aviso_comentarios").select("*").order("data", { ascending: true }),
      supabase.from("aviso_confirmacoes").select("*"),
    ]);
  if (erroAvisos) throw new Error(`Erro ao ler avisos: ${erroAvisos.message}`);
  if (erroComentarios) throw new Error(`Erro ao ler comentários: ${erroComentarios.message}`);
  if (erroConfirmacoes) throw new Error(`Erro ao ler confirmações: ${erroConfirmacoes.message}`);

  const comentariosPorAviso = new Map<string, Mensagem[]>();
  for (const linha of comentarios ?? []) {
    const item = objetoParaCamelCase<Mensagem & { avisoId: string }>(linha);
    const lista = comentariosPorAviso.get(item.avisoId) ?? [];
    lista.push(item);
    comentariosPorAviso.set(item.avisoId, lista);
  }
  const confirmacoesPorAviso = new Map<string, ConfirmacaoEntidade[]>();
  for (const linha of confirmacoes ?? []) {
    const item = objetoParaCamelCase<ConfirmacaoEntidade & { avisoId: string }>(linha);
    const lista = confirmacoesPorAviso.get(item.avisoId) ?? [];
    lista.push(item);
    confirmacoesPorAviso.set(item.avisoId, lista);
  }

  return (linhas ?? []).map((linha) => {
    const item = objetoParaCamelCase<Omit<Aviso, "comentarios" | "confirmacoes">>(linha);
    return {
      ...item,
      comentarios: comentariosPorAviso.get(item.id) ?? [],
      confirmacoes: confirmacoesPorAviso.get(item.id) ?? [],
    };
  });
}

export async function criarAviso(
  item: Omit<Aviso, "id" | "comentarios" | "confirmacoes">
): Promise<Aviso> {
  const payload = objetoParaSnakeCase(normalizarOpcionais(item as Record<string, unknown>));
  const { data, error } = await supabase.from("avisos").insert(payload).select().single();
  if (error) throw new Error(`Erro ao criar aviso: ${error.message}`);
  return { ...objetoParaCamelCase<Omit<Aviso, "comentarios" | "confirmacoes">>(data), comentarios: [], confirmacoes: [] };
}

export async function atualizarAviso(
  id: string,
  patch: Partial<Omit<Aviso, "id" | "comentarios" | "confirmacoes">>
): Promise<void> {
  const payload = objetoParaSnakeCase(normalizarOpcionais(patch as Record<string, unknown>));
  const { error } = await supabase.from("avisos").update(payload).eq("id", id);
  if (error) throw new Error(`Erro ao atualizar aviso: ${error.message}`);
}

export async function removerAviso(id: string): Promise<void> {
  const { error } = await supabase.from("avisos").delete().eq("id", id);
  if (error) throw new Error(`Erro ao remover aviso: ${error.message}`);
}

export async function adicionarComentarioAviso(
  avisoId: string,
  comentario: Omit<Mensagem, "id">
): Promise<void> {
  const payload = objetoParaSnakeCase({ ...comentario, avisoId } as Record<string, unknown>);
  const { error } = await supabase.from("aviso_comentarios").insert(payload);
  if (error) throw new Error(`Erro ao comentar aviso: ${error.message}`);
}

export async function definirConfirmacaoAviso(avisoId: string, entidade: string, confirmado: boolean): Promise<void> {
  const { error } = await supabase
    .from("aviso_confirmacoes")
    .upsert({ aviso_id: avisoId, entidade, confirmado }, { onConflict: "aviso_id,entidade" });
  if (error) throw new Error(`Erro ao atualizar confirmação: ${error.message}`);
}

export async function removerConfirmacaoAviso(avisoId: string, entidade: string): Promise<void> {
  const { error } = await supabase.from("aviso_confirmacoes").delete().eq("aviso_id", avisoId).eq("entidade", entidade);
  if (error) throw new Error(`Erro ao remover entidade: ${error.message}`);
}
