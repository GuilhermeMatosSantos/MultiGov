import { createLocalStorageRepository } from "../lib/storage";
import type {
  Interlocutor,
  Notificacao,
  FAQEntry,
  Aviso,
  RegistoInformal,
  IndicadorTerritorial,
  Decisao,
  Topico,
  Processo,
  Projeto,
  Noticia,
  Atividade,
} from "../types";
import {
  seedInterlocutores,
  seedNotificacoes,
  seedFAQ,
  seedAvisos,
  seedRegistoInformal,
  seedIndicadores,
  seedDecisoes,
  seedTopicos,
  seedProcessos,
  seedProjetos,
  seedNoticias,
} from "./seed";

// Sufixo ".v2": o esquema de dados mudou (novos campos em Interlocutor,
// Notificacao, Aviso, Noticia) depois de já haver dados guardados no browser
// em alguns testes. Mudar a chave força um novo arranque limpo em vez de
// tentar ler registos antigos com campos em falta, que rebentavam a app.
export const interlocutoresRepo = createLocalStorageRepository<Interlocutor>(
  "multigov.interlocutores.v2",
  seedInterlocutores
);

export const notificacoesRepo = createLocalStorageRepository<Notificacao>(
  "multigov.notificacoes.v2",
  seedNotificacoes
);

export const faqRepo = createLocalStorageRepository<FAQEntry>("multigov.faq.v2", seedFAQ);

export const avisosRepo = createLocalStorageRepository<Aviso>("multigov.avisos.v2", seedAvisos);

export const registoInformalRepo = createLocalStorageRepository<RegistoInformal>(
  "multigov.registoInformal.v2",
  seedRegistoInformal
);

export const indicadoresRepo = createLocalStorageRepository<IndicadorTerritorial>(
  "multigov.indicadores.v2",
  seedIndicadores
);

export const decisoesRepo = createLocalStorageRepository<Decisao>("multigov.decisoes.v2", seedDecisoes);

export const topicosRepo = createLocalStorageRepository<Topico>("multigov.topicos.v2", seedTopicos);

export const processosRepo = createLocalStorageRepository<Processo>("multigov.processos.v2", seedProcessos);

// v3: "efeitos"/"licoes" (texto livre) substituídos por taxonomia estruturada
// de lições (o que resultou / o que não resultou / condições de replicabilidade).
export const projetosRepo = createLocalStorageRepository<Projeto>("multigov.projetos.v3", seedProjetos);

// v3: acrescentado o campo "imagem" às notícias.
export const noticiasRepo = createLocalStorageRepository<Noticia>("multigov.noticias.v3", seedNoticias);

// Registo de atividade — entidade nova, sem dados de exemplo (começa vazia).
export const atividadeRepo = createLocalStorageRepository<Atividade>("multigov.atividade", []);
