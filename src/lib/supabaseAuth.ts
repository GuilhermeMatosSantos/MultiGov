import { supabase, supabaseConfigurado } from "./supabase";
import type { Identidade } from "../types";

// As políticas de RLS na base de dados exigem um pedido autenticado
// (auth.role() = 'authenticated'); o MULTI.GOV não pede login/password —
// mantém-se a seleção de identidade já existente — por isso usa-se sessão
// anónima do Supabase só para obter um auth.uid() real, e sincroniza-se
// nivel/entidade/nome dessa sessão para a tabela perfis, que é onde as
// políticas de escrita (minha_camada()) vão ler a camada de permissão.
let sessaoPromise: Promise<void> | null = null;

async function garantirSessao(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export function garantirSessaoSupabase(): Promise<void> {
  if (!supabaseConfigurado) return Promise.resolve();
  if (!sessaoPromise) {
    sessaoPromise = garantirSessao().catch((err) => {
      sessaoPromise = null;
      throw err;
    });
  }
  return sessaoPromise;
}

export async function sincronizarPerfilSupabase(identidade: Identidade): Promise<void> {
  if (!supabaseConfigurado) return;
  try {
    await garantirSessaoSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    await supabase
      .from("perfis")
      .update({ nome: identidade.nome, entidade: identidade.entidade, nivel: identidade.nivel })
      .eq("id", uid);
  } catch (err) {
    console.warn("Não foi possível sincronizar o perfil com o Supabase.", err);
  }
}
