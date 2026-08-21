// Tipos partilhados por todos os módulos da aplicação MULTI.GOV

export type Nivel =
  | "Comissão Europeia"
  | "Nacional"
  | "Regional (CCDR)"
  | "Intermunicipal (CIM/AM)"
  | "Municipal"
  | "Organismo Intermédio"
  | "Autoridade de Gestão"
  | "Programa Temático"
  | "ADC";

export interface HistoricoTitular {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  desde: string;
  ate: string;
  notasTransicao?: string;
}

export interface Interlocutor {
  id: string;
  nome: string;
  cargo: string;
  entidade: string;
  nivel: Nivel;
  areaResponsabilidade: string;
  email: string;
  telefone: string;
  atualizadoEm: string;
  notas: string;
  historico: HistoricoTitular[];
}

export interface Notificacao {
  id: string;
  titulo: string;
  tipo: "Regra" | "Orientação técnica" | "Aviso" | "Prazo" | "Alteração de plataforma";
  descricao: string;
  entidadeOrigem: string;
  entidadesAfetadas: string;
  dataPublicacao: string;
  prazo: string;
  lida: boolean;
  processoId: string;
  criadoEm: string;
  riscoDescompromisso?: boolean;
}

export interface FAQEntry {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  programaRelacionado: string;
  fonte: string;
  atualizadoEm: string;
  tags: string;
  vinculativa?: boolean;
}

export interface ConfirmacaoEntidade {
  entidade: string;
  confirmado: boolean;
}

export interface Aviso {
  id: string;
  titulo: string;
  programa: string;
  entidadeResponsavel: string;
  entidadesEnvolvidas: string;
  dataPrevistaAbertura: string;
  dataPrevistaFecho: string;
  estado: "Planeado" | "Em preparação" | "Aberto" | "Fechado";
  notasAlinhamento: string;
  comentarios: Mensagem[];
  confirmacoes: ConfirmacaoEntidade[];
}

export interface RegistoInformal {
  id: string;
  tipo: "Telefonema" | "Reunião informal" | "Decisão informal" | "Outro";
  processoAssociado: string;
  processoId: string;
  participantes: string;
  entidade: string;
  resumo: string;
  data: string;
  estado?: "A confirmar formalmente" | "Decisório";
  prazoRegularizacao?: string;
}

export interface IndicadorTerritorial {
  id: string;
  territorio: string;
  tipoTerritorio: "Município" | "CIM" | "Área Metropolitana" | "Região";
  dimensao: "Económica" | "Social" | "Ambiental" | "Cultural" | "Governação";
  indicador: string;
  valor: string;
  unidade: string;
  ano: string;
  fonte: string;
  intervencaoRelacionada?: string;
}

export interface Decisao {
  id: string;
  titulo: string;
  descricao: string;
  entidade: string;
  nivel: string;
  estado: "Decidida" | "Em execução" | "Concluída";
  data: string;
  resultados: string;
}

export interface Mensagem {
  id: string;
  autor: string;
  entidade: string;
  texto: string;
  data: string;
}

export interface Topico {
  id: string;
  titulo: string;
  categoria: "CIM–CIM" | "AG–AG" | "CCDR–CCDR" | "Boas práticas" | "Outro";
  autor: string;
  entidade: string;
  data: string;
  mensagens: Mensagem[];
  tipoPedido?: "Pergunta" | "Pedido de intercâmbio" | "Partilha de boas práticas";
  formatoIntercambio?: "Reunião" | "Visita" | "Workshop" | "Documento partilhado";
  objetivoIntercambio?: string;
  resultado?: string;
}

export interface Processo {
  id: string;
  titulo: string;
  avisoId: string;
  entidadeResponsavel: string;
  programa: string;
  estado: "Submetido" | "Em análise" | "Aprovado" | "Em execução" | "Concluído" | "Indeferido";
  dataAbertura: string;
  notas: string;
}

export interface Projeto {
  id: string;
  titulo: string;
  territorio: string;
  programa: string;
  periodo: string;
  oQueResultou: string;
  oQueNaoResultou: string;
  condicoesReplicabilidade: string;
  boaPratica: boolean;
  fonte: string;
}

export interface Noticia {
  id: string;
  titulo: string;
  fonte: "Comissão Europeia" | "Governo / Diário da República" | "Autoridade de Gestão" | "Outra";
  tipo: "Alteração regulamentar" | "Nova orientação" | "Notícia" | "Prazo relevante";
  resumo: string;
  temas: string[];
  programas: string[];
  territorios: string[];
  dataPublicacao: string;
  dataEntradaVigor: string;
  referencia: string;
  criadoEm: string;
  imagem: string;
  processosAfetados?: string;
}

export interface Identidade {
  nome: string;
  entidade: string;
  nivel: Nivel;
}

export interface PerfilIdentidade extends Identidade {
  id: string;
}

export interface Atividade {
  id: string;
  quando: string;
  nome: string;
  entidade: string;
  acao: "criar" | "editar" | "remover";
  modulo: string;
  itemLabel: string;
}
