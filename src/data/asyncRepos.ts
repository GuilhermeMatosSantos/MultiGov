import { createSupabaseRepository } from "../lib/supabaseRepository";
import type {
  Notificacao,
  Decisao,
  IndicadorTerritorial,
  FAQEntry,
  Projeto,
  RegistoInformal,
  Processo,
  Noticia,
} from "../types";

// Instâncias partilhadas dos repositórios já ligados à Supabase real —
// um só sítio, para que todos os ficheiros que leem o mesmo tipo de dado
// (páginas, painel geral, pesquisa global) vejam sempre a mesma coisa.
export const notificacoesRepoAsync = createSupabaseRepository<Notificacao>("notificacoes", ["prazo"]);
export const decisoesRepoAsync = createSupabaseRepository<Decisao>("decisoes");
export const indicadoresRepoAsync = createSupabaseRepository<IndicadorTerritorial>("indicadores_territoriais");
export const faqRepoAsync = createSupabaseRepository<FAQEntry>("faq", ["atualizadoEm"]);
export const projetosRepoAsync = createSupabaseRepository<Projeto>("projetos");
export const registoInformalRepoAsync = createSupabaseRepository<RegistoInformal>("registo_informal", [
  "prazoRegularizacao",
  "estado",
]);
export const processosRepoAsync = createSupabaseRepository<Processo>("processos", ["dataAbertura"]);
export const noticiasRepoAsync = createSupabaseRepository<Noticia>("noticias", [
  "dataPublicacao",
  "dataEntradaVigor",
]);
