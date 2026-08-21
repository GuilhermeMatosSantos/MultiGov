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
} from "../types";
import { newId } from "../lib/id";

// Dados de exemplo, inspirados nos temas e entidades referidos na síntese
// das entrevistas MULTI.GOV. Nomes de pessoas são fictícios/ilustrativos;
// apenas os nomes de entidades e programas refletem os reais.

const avisoRequalificacaoId = newId();
const avisoCapacitacaoId = newId();
const processoCandidaturaId = newId();

export const seedInterlocutores: Interlocutor[] = [
  {
    id: newId(),
    nome: "Coordenador(a) Técnico",
    cargo: "Ponto focal de candidaturas e pagamentos",
    entidade: "Norte 2030",
    nivel: "Autoridade de Gestão",
    areaResponsabilidade: "Avisos e candidaturas — eixo competitividade",
    email: "geral@norte2030.pt",
    telefone: "22 000 0000",
    atualizadoEm: "2026-06-01",
    notas: "Interlocutor principal para dúvidas sobre critérios de elegibilidade.",
    historico: [
      {
        id: newId(),
        nome: "Técnico(a) Anterior",
        cargo: "Ponto focal de candidaturas e pagamentos",
        email: "antigo.contacto@norte2030.pt",
        telefone: "22 000 1111",
        desde: "2024-01-10",
        ate: "2026-06-01",
      },
    ],
  },
  {
    id: newId(),
    nome: "Técnico(a) de Acompanhamento",
    cargo: "Gestor(a) de operação",
    entidade: "CIM do Cávado",
    nivel: "Intermunicipal (CIM/AM)",
    areaResponsabilidade: "Coordenação com municípios do Cávado",
    email: "geral@cimcavado.pt",
    telefone: "25 300 0000",
    atualizadoEm: "2026-05-20",
    notas: "Participa no grupo de coordenadores das CIM.",
    historico: [],
  },
  {
    id: newId(),
    nome: "Responsável de Rede Temática",
    cargo: "Coordenador(a) de rede funcional",
    entidade: "Pessoas 2030",
    nivel: "Programa Temático",
    areaResponsabilidade: "Rede da demografia, qualificações e inclusão",
    email: "geral@pessoas2030.pt",
    telefone: "21 000 0000",
    atualizadoEm: "2026-04-15",
    notas: "",
    historico: [],
  },
  {
    id: newId(),
    nome: "Interlocutor(a) Único(a) Municipal",
    cargo: "Técnico(a) de fundos",
    entidade: "Município (Centro 2030)",
    nivel: "Municipal",
    areaResponsabilidade: "Ponto único de contacto com o Centro 2030",
    email: "fundos@municipio.pt",
    telefone: "23 000 0000",
    atualizadoEm: "2026-03-10",
    notas: "Prática já em funcionamento: um interlocutor único por município.",
    historico: [],
  },
  {
    id: newId(),
    nome: "Chefe de Fila",
    cargo: "Secretariado Conjunto",
    entidade: "Interreg",
    nivel: "Comissão Europeia",
    areaResponsabilidade: "Coordenação transnacional de projetos",
    email: "secretariado@interreg.eu",
    telefone: "+34 900 000 000",
    atualizadoEm: "2026-02-01",
    notas: "",
    historico: [],
  },
  {
    id: newId(),
    nome: "Técnico(a) de Avaliação",
    cargo: "Responsável de monitorização",
    entidade: "ADC — Agência para o Desenvolvimento e Coesão",
    nivel: "ADC",
    areaResponsabilidade: "Academia dos Fundos e avaliação de impacto",
    email: "geral@adcoesao.pt",
    telefone: "21 350 0000",
    atualizadoEm: "2026-05-05",
    notas: "",
    historico: [],
  },
];

export const seedNotificacoes: Notificacao[] = [
  {
    id: newId(),
    titulo: "Alteração ao Balcão dos Fundos — novo campo obrigatório",
    tipo: "Alteração de plataforma",
    descricao:
      "O formulário de candidatura passa a exigir a indicação do território NUTS III de execução da operação.",
    entidadeOrigem: "Balcão dos Fundos",
    entidadesAfetadas: "Todas as Autoridades de Gestão, Organismos Intermédios, CIM/AM",
    dataPublicacao: "2026-08-05",
    prazo: "",
    lida: false,
    processoId: "",
    criadoEm: "2026-08-05T09:00:00.000Z",
  },
  {
    id: newId(),
    titulo: "Orientação técnica sobre custos simplificados",
    tipo: "Orientação técnica",
    descricao:
      "Clarificação dos critérios de aplicação de custos simplificados em operações de formação.",
    entidadeOrigem: "Pessoas 2030",
    entidadesAfetadas: "Organismos Intermédios da área da qualificação",
    dataPublicacao: "2026-07-22",
    prazo: "",
    lida: true,
    processoId: "",
    criadoEm: "2026-07-22T09:00:00.000Z",
  },
  {
    id: newId(),
    titulo: "Prazo de submissão do Aviso 12/2026",
    tipo: "Prazo",
    descricao: "Encerramento das candidaturas ao aviso de eficiência energética em edifícios públicos.",
    entidadeOrigem: "Norte 2030",
    entidadesAfetadas: "Municípios e CIM da região Norte",
    dataPublicacao: "2026-08-10",
    prazo: "2026-09-30",
    lida: false,
    processoId: "",
    criadoEm: "2026-08-10T09:00:00.000Z",
  },
  {
    id: newId(),
    titulo: "Documentos em falta na candidatura #2026-0451",
    tipo: "Regra",
    descricao: "Pedido de esclarecimento sobre documentos de suporte em falta na candidatura.",
    entidadeOrigem: "Norte 2030",
    entidadesAfetadas: "CIM do Cávado",
    dataPublicacao: "2026-08-11",
    prazo: "2026-08-20",
    lida: true,
    processoId: processoCandidaturaId,
    criadoEm: "2026-08-11T09:00:00.000Z",
  },
];

export const seedFAQ: FAQEntry[] = [
  {
    id: newId(),
    pergunta: "Como se define a data de início de elegibilidade de uma operação?",
    resposta:
      "A data de início de elegibilidade corresponde à data de submissão da candidatura, salvo disposição em contrário prevista no aviso de abertura. Entendimento uniformizado entre programas em 2026.",
    categoria: "Elegibilidade",
    programaRelacionado: "Todos os programas PT2030",
    fonte: "Entendimento comum AG–OI",
    atualizadoEm: "2026-06-10",
    tags: "elegibilidade, datas, candidatura",
  },
  {
    id: newId(),
    pergunta: "Os custos indiretos podem ser reportados por taxa fixa?",
    resposta:
      "Sim, é possível aplicar a taxa fixa de custos indiretos prevista no regulamento aplicável, sem necessidade de documentação de suporte adicional.",
    categoria: "Custos simplificados",
    programaRelacionado: "Pessoas 2030",
    fonte: "Orientação técnica ADC",
    atualizadoEm: "2026-05-02",
    tags: "custos simplificados, taxa fixa",
  },
  {
    id: newId(),
    pergunta: "Quem valida alterações ao cronograma físico e financeiro?",
    resposta:
      "As alterações não substanciais podem ser validadas diretamente pelo Organismo Intermédio; alterações substanciais requerem parecer prévio da Autoridade de Gestão.",
    categoria: "Gestão de operações",
    programaRelacionado: "Norte 2030 / Centro 2030",
    fonte: "Manual de procedimentos",
    atualizadoEm: "2026-04-18",
    tags: "cronograma, alterações, aprovação",
  },
];

export const seedAvisos: Aviso[] = [
  {
    id: avisoRequalificacaoId,
    titulo: "Aviso conjunto — Requalificação de espaços públicos",
    programa: "Norte 2030 + Centro 2030",
    entidadeResponsavel: "Autoridades de Gestão Norte e Centro",
    entidadesEnvolvidas: "CIM do Cávado, CIM do Ave, Municípios aderentes",
    dataPrevistaAbertura: "2026-09-01",
    dataPrevistaFecho: "2026-11-30",
    estado: "Em preparação",
    notasAlinhamento:
      "Reunião de alinhamento de calendário realizada em 2026-07-15; falta validar critérios comuns de seleção.",
    comentarios: [
      {
        id: newId(),
        autor: "Técnico(a) Norte 2030",
        entidade: "Norte 2030",
        texto: "Proposta de calendário partilhada. Aguardamos confirmação do Centro 2030 e das CIM envolvidas.",
        data: "2026-07-15",
      },
      {
        id: newId(),
        autor: "Técnico(a) CIM Cávado",
        entidade: "CIM do Cávado",
        texto: "Datas parecem-nos bem, mas pedimos que o critério de seleção seja igual em ambos os programas.",
        data: "2026-07-18",
      },
    ],
    confirmacoes: [
      { entidade: "Norte 2030", confirmado: true },
      { entidade: "Centro 2030", confirmado: false },
      { entidade: "CIM do Cávado", confirmado: true },
      { entidade: "CIM do Ave", confirmado: false },
    ],
  },
  {
    id: avisoCapacitacaoId,
    titulo: "Aviso — Capacitação de recursos humanos da administração local",
    programa: "Pessoas 2030",
    entidadeResponsavel: "Pessoas 2030",
    entidadesEnvolvidas: "CIM e Áreas Metropolitanas de todo o país",
    dataPrevistaAbertura: "2026-10-15",
    dataPrevistaFecho: "2027-01-15",
    estado: "Planeado",
    notasAlinhamento: "Aguarda calendarização conjunta com a Academia dos Fundos (ADC).",
    comentarios: [],
    confirmacoes: [
      { entidade: "Pessoas 2030", confirmado: true },
      { entidade: "ADC", confirmado: false },
    ],
  },
];

export const seedRegistoInformal: RegistoInformal[] = [
  {
    id: newId(),
    tipo: "Telefonema",
    processoAssociado: "Candidatura #2026-0451",
    processoId: processoCandidaturaId,
    participantes: "Técnico OI + Técnico AG",
    entidade: "CIM do Cávado / Norte 2030",
    resumo:
      "Esclarecida por telefone uma dúvida sobre documentos de suporte em falta; candidatura desbloqueada sem necessidade de novo ofício.",
    data: "2026-08-12",
  },
  {
    id: newId(),
    tipo: "Reunião informal",
    processoAssociado: "Preparação do Aviso 12/2026",
    processoId: "",
    participantes: "Representantes de 3 municípios + AG",
    entidade: "Norte 2030",
    resumo:
      "Pré-consulta informal sobre critérios do aviso antes da publicação formal, à semelhança da prática já usada na Madeira.",
    data: "2026-07-28",
  },
];

export const seedIndicadores: IndicadorTerritorial[] = [
  {
    id: newId(),
    territorio: "CIM do Cávado",
    tipoTerritorio: "CIM",
    dimensao: "Económica",
    indicador: "Taxa de execução financeira PT2030",
    valor: "62",
    unidade: "%",
    ano: "2026",
    fonte: "Balcão dos Fundos",
  },
  {
    id: newId(),
    territorio: "CIM do Cávado",
    tipoTerritorio: "CIM",
    dimensao: "Social",
    indicador: "Nº de operações de qualificação apoiadas",
    valor: "14",
    unidade: "operações",
    ano: "2026",
    fonte: "Pessoas 2030",
  },
  {
    id: newId(),
    territorio: "Região Centro",
    tipoTerritorio: "Região",
    dimensao: "Ambiental",
    indicador: "Área requalificada com fundos PT2030",
    valor: "8.4",
    unidade: "ha",
    ano: "2026",
    fonte: "Centro 2030",
  },
];

export const seedDecisoes: Decisao[] = [
  {
    id: newId(),
    titulo: "Aprovação do calendário conjunto de avisos 2026-2027",
    descricao:
      "Definido calendário conjunto entre Norte 2030 e Centro 2030 para avisos com objeto equivalente, evitando sobreposição de prazos.",
    entidade: "Norte 2030 / Centro 2030",
    nivel: "Regional",
    estado: "Em execução",
    data: "2026-07-20",
    resultados: "Redução esperada de dúvidas repetidas entre programas.",
  },
  {
    id: newId(),
    titulo: "Criação da rede dedicada AG–Organismos Intermédios",
    descricao:
      "Retomada a lógica de 'vasos comunicantes' entre Autoridade de Gestão e Organismos Intermédios, com avaliações conjuntas periódicas.",
    entidade: "Pessoas 2030",
    nivel: "Nacional",
    estado: "Decidida",
    data: "2026-06-01",
    resultados: "",
  },
];

export const seedTopicos: Topico[] = [
  {
    id: newId(),
    titulo: "Partilha de boas práticas — interlocutor único por município",
    categoria: "CIM–CIM",
    autor: "Coordenador(a) CIM Cávado",
    entidade: "CIM do Cávado",
    data: "2026-06-05",
    mensagens: [
      {
        id: newId(),
        autor: "Coordenador(a) CIM Cávado",
        entidade: "CIM do Cávado",
        texto:
          "Temos vindo a designar um interlocutor único por município para os fundos, tem reduzido muito a duplicação de contactos. Alguém mais está a fazer isto?",
        data: "2026-06-05",
      },
      {
        id: newId(),
        autor: "Coordenador(a) CIM Ave",
        entidade: "CIM do Ave",
        texto: "Também adotámos essa prática este ano, tem funcionado bem em conjunto com reuniões mensais.",
        data: "2026-06-07",
      },
    ],
  },
  {
    id: newId(),
    titulo: "Alinhamento de avisos entre programas — próximos passos",
    categoria: "AG–AG",
    autor: "Técnico(a) Norte 2030",
    entidade: "Norte 2030",
    data: "2026-07-16",
    mensagens: [
      {
        id: newId(),
        autor: "Técnico(a) Norte 2030",
        entidade: "Norte 2030",
        texto: "Propomos alinhar o calendário do aviso de requalificação de espaços públicos com o Centro 2030.",
        data: "2026-07-16",
      },
    ],
  },
];

export const seedProcessos: Processo[] = [
  {
    id: processoCandidaturaId,
    titulo: "Candidatura #2026-0451 — Requalificação de espaço público municipal",
    avisoId: avisoRequalificacaoId,
    entidadeResponsavel: "CIM do Cávado",
    programa: "Norte 2030",
    estado: "Em análise",
    dataAbertura: "2026-08-01",
    notas: "Beneficiário: Município aderente à CIM do Cávado. Aguarda análise final após esclarecimento de documentos.",
  },
  {
    id: newId(),
    titulo: "Candidatura #2026-0398 — Capacitação técnica municipal",
    avisoId: avisoCapacitacaoId,
    entidadeResponsavel: "Área Metropolitana",
    programa: "Pessoas 2030",
    estado: "Submetido",
    dataAbertura: "2026-08-05",
    notas: "",
  },
];

export const seedProjetos: Projeto[] = [
  {
    id: newId(),
    titulo: "Requalificação da Praça Central (2022–2024)",
    territorio: "CIM do Cávado",
    programa: "Norte 2020",
    periodo: "2022–2024",
    efeitos:
      "Aumento da utilização do espaço público, redução de temperatura de superfície em cerca de 2°C no verão, novo ponto de encontro comunitário.",
    licoes:
      "O envolvimento dos comerciantes locais desde a fase de projeto reduziu reclamações durante a obra.",
    boaPratica: true,
    fonte: "Memória de projeto — CIM do Cávado",
  },
  {
    id: newId(),
    titulo: "Programa de capacitação digital para técnicos municipais",
    territorio: "Região Centro",
    programa: "Pessoas 2020",
    periodo: "2023",
    efeitos: "120 técnicos formados; redução observada no tempo médio de resposta a candidaturas.",
    licoes: "Formações demasiado genéricas tiveram menor adesão do que módulos práticos por tipo de fundo.",
    boaPratica: true,
    fonte: "Avaliação ADC",
  },
];

export const seedNoticias: Noticia[] = [
  {
    id: newId(),
    titulo: "Simplificação das regras de elegibilidade de custos indiretos",
    fonte: "Comissão Europeia",
    tipo: "Alteração regulamentar",
    resumo:
      "Alteração ao Regulamento (UE) 2021/1060 (disposições comuns) que alarga a possibilidade de aplicar taxas fixas de custos indiretos sem documentação de suporte adicional, alinhando o quadro 2021-2027 com a prática já testada no ciclo anterior.",
    temas: ["Custos simplificados", "Elegibilidade"],
    programas: ["Norte 2030", "Centro 2030", "Pessoas 2030"],
    territorios: [],
    dataPublicacao: "2026-07-10",
    dataEntradaVigor: "2026-09-01",
    referencia: "Jornal Oficial da União Europeia",
    criadoEm: "2026-07-10T09:00:00.000Z",
    imagem: "",
  },
  {
    id: newId(),
    titulo: "Orientação técnica nacional sobre prazos de encerramento de operações",
    fonte: "Governo / Diário da República",
    tipo: "Nova orientação",
    resumo:
      "Clarificação dos prazos-limite para encerramento físico e financeiro de operações no âmbito do PT2030, incluindo o procedimento simplificado para operações de baixo valor.",
    temas: ["Encerramento", "Prazos"],
    programas: ["Todos os programas PT2030"],
    territorios: [],
    dataPublicacao: "2026-06-01",
    dataEntradaVigor: "2026-06-15",
    referencia: "Diário da República, 1.ª série",
    criadoEm: "2026-06-01T09:00:00.000Z",
    imagem: "",
  },
  {
    id: newId(),
    titulo: "Novo limiar de minimis para apoios a empresas",
    fonte: "Comissão Europeia",
    tipo: "Alteração regulamentar",
    resumo:
      "Revisão do regulamento de minimis aplicável a apoios estatais a empresas, com atualização do limiar acumulado por empresa e por período de três exercícios fiscais.",
    temas: ["Auxílios de estado", "Apoio a empresas"],
    programas: ["Norte 2030", "Centro 2030"],
    territorios: [],
    dataPublicacao: "2026-08-01",
    dataEntradaVigor: "2026-08-25",
    referencia: "Jornal Oficial da União Europeia",
    criadoEm: "2026-08-01T09:00:00.000Z",
    imagem: "",
  },
  {
    id: newId(),
    titulo: "Reforço da capacitação digital das administrações locais",
    fonte: "Autoridade de Gestão",
    tipo: "Notícia",
    resumo:
      "Pessoas 2030 anuncia reforço orçamental para a rede de capacitação digital dirigida a técnicos de municípios e CIM, com destaque para a região Norte e Centro.",
    temas: ["Capacitação", "Digitalização"],
    programas: ["Pessoas 2030"],
    territorios: ["Região Norte", "Região Centro"],
    dataPublicacao: "2026-08-12",
    dataEntradaVigor: "",
    referencia: "Comunicado Pessoas 2030",
    criadoEm: "2026-08-12T09:00:00.000Z",
    imagem: "",
  },
  {
    id: newId(),
    titulo: "Prazo para adesão ao regime simplificado de custos com pessoal",
    fonte: "Autoridade de Gestão",
    tipo: "Prazo relevante",
    resumo:
      "As entidades beneficiárias que ainda não aderiram ao regime simplificado de custos com pessoal têm até à data indicada para o fazer nas candidaturas em curso.",
    temas: ["Custos simplificados", "Recursos humanos"],
    programas: ["Norte 2030"],
    territorios: ["CIM do Cávado", "CIM do Ave"],
    dataPublicacao: "2026-08-05",
    dataEntradaVigor: "2026-08-31",
    referencia: "Norte 2030",
    criadoEm: "2026-08-05T09:00:00.000Z",
    imagem: "",
  },
];
