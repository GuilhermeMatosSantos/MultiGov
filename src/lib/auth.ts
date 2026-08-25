import { supabase, supabaseConfigurado } from "./supabase";
import { setIdentidade } from "./session";
import type { Nivel } from "../types";

export interface ResultadoAuth {
  erro?: string;
}

export async function registarConta(
  email: string,
  password: string,
  nome: string,
  entidade: string,
  nivel: Nivel
): Promise<ResultadoAuth> {
  if (!supabaseConfigurado) {
    return { erro: "A Supabase não está configurada neste ambiente." };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { erro: error.message };

  const uid = data.user?.id;
  if (!uid) return { erro: "Conta criada, mas não foi possível continuar automaticamente." };

  if (!data.session) {
    // confirmação de email ativada no projeto — sem sessão ainda, não é
    // possível preencher o perfil agora (as políticas de RLS exigem
    // auth.uid()). A pessoa confirma o email e depois entra normalmente.
    return { erro: "CONFIRMACAO_PENDENTE" };
  }

  const { error: erroPerfil } = await supabase.from("perfis").update({ nome, entidade, nivel }).eq("id", uid);
  if (erroPerfil) return { erro: erroPerfil.message };

  setIdentidade({ nome, entidade, nivel });
  return {};
}

export async function entrarConta(email: string, password: string): Promise<ResultadoAuth> {
  if (!supabaseConfigurado) {
    return { erro: "A Supabase não está configurada neste ambiente." };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { erro: error.message };

  const uid = data.user?.id;
  if (!uid) return { erro: "Não foi possível iniciar sessão." };

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("nome, entidade, nivel")
    .eq("id", uid)
    .single();
  if (erroPerfil || !perfil) return { erro: "Não foi possível carregar o perfil desta conta." };

  setIdentidade({ nome: perfil.nome, entidade: perfil.entidade, nivel: perfil.nivel });
  return {};
}

export async function sairConta(): Promise<void> {
  if (supabaseConfigurado) {
    await supabase.auth.signOut();
  }
  setIdentidade({ nome: "", entidade: "", nivel: "Municipal" });
}

export async function pedirRecuperacaoPassword(email: string): Promise<ResultadoAuth> {
  if (!supabaseConfigurado) {
    return { erro: "A Supabase não está configurada neste ambiente." };
  }
  const destino = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: destino });
  if (error) return { erro: error.message };
  return {};
}

export async function definirNovaPassword(novaPassword: string): Promise<ResultadoAuth> {
  if (!supabaseConfigurado) {
    return { erro: "A Supabase não está configurada neste ambiente." };
  }
  const { error } = await supabase.auth.updateUser({ password: novaPassword });
  if (error) return { erro: error.message };
  return {};
}
