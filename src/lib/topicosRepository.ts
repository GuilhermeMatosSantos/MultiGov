import { supabase } from "./supabase";
import { objetoParaCamelCase, objetoParaSnakeCase } from "./caseConvert";
import type { Mensagem, Topico } from "../types";

// "mensagens" vive numa tabela filha (topico_mensagens) — junção feita à
// mão, como em avisosRepository.ts.
export async function listarTopicos(): Promise<Topico[]> {
  const [{ data: linhas, error: erroTopicos }, { data: mensagens, error: erroMensagens }] = await Promise.all([
    supabase.from("topicos").select("*").order("criado_em", { ascending: false }),
    supabase.from("topico_mensagens").select("*").order("data", { ascending: true }),
  ]);
  if (erroTopicos) throw new Error(`Erro ao ler tópicos: ${erroTopicos.message}`);
  if (erroMensagens) throw new Error(`Erro ao ler mensagens: ${erroMensagens.message}`);

  const mensagensPorTopico = new Map<string, Mensagem[]>();
  for (const linha of mensagens ?? []) {
    const item = objetoParaCamelCase<Mensagem & { topicoId: string }>(linha);
    const lista = mensagensPorTopico.get(item.topicoId) ?? [];
    lista.push(item);
    mensagensPorTopico.set(item.topicoId, lista);
  }

  return (linhas ?? []).map((linha) => {
    const item = objetoParaCamelCase<Omit<Topico, "mensagens">>(linha);
    return { ...item, mensagens: mensagensPorTopico.get(item.id) ?? [] };
  });
}

export async function criarTopico(item: Omit<Topico, "id" | "mensagens">): Promise<Topico> {
  const payload = objetoParaSnakeCase(item as Record<string, unknown>);
  const { data, error } = await supabase.from("topicos").insert(payload).select().single();
  if (error) throw new Error(`Erro ao criar tópico: ${error.message}`);
  return { ...objetoParaCamelCase<Omit<Topico, "mensagens">>(data), mensagens: [] };
}

export async function atualizarTopico(id: string, patch: Partial<Omit<Topico, "id" | "mensagens">>): Promise<void> {
  const payload = objetoParaSnakeCase(patch as Record<string, unknown>);
  const { error } = await supabase.from("topicos").update(payload).eq("id", id);
  if (error) throw new Error(`Erro ao atualizar tópico: ${error.message}`);
}

export async function removerTopico(id: string): Promise<void> {
  const { error } = await supabase.from("topicos").delete().eq("id", id);
  if (error) throw new Error(`Erro ao remover tópico: ${error.message}`);
}

export async function enviarMensagemTopico(topicoId: string, mensagem: Omit<Mensagem, "id">): Promise<void> {
  const payload = objetoParaSnakeCase({ ...mensagem, topicoId } as Record<string, unknown>);
  const { error } = await supabase.from("topico_mensagens").insert(payload);
  if (error) throw new Error(`Erro ao enviar mensagem: ${error.message}`);
}
