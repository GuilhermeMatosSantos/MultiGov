import type { Nivel } from "../types";

// Modelo de permissões do protótipo — client-side, não é imposto por um
// servidor (tal como o resto da identidade autodeclarada), mas define e
// mostra as regras que farão sentido impor a sério quando existir
// autenticação real (Supabase Auth + RLS).
export type Camada = "coordenacao" | "territorio" | "supervisao";

const CAMADA_DO_NIVEL: Record<Nivel, Camada> = {
  "Comissão Europeia": "supervisao",
  "Nacional": "coordenacao",
  "Regional (CCDR)": "coordenacao",
  "Intermunicipal (CIM/AM)": "territorio",
  "Municipal": "territorio",
  "Organismo Intermédio": "coordenacao",
  "Autoridade de Gestão": "coordenacao",
  "Programa Temático": "coordenacao",
  "ADC": "coordenacao",
};

export function camadaDoNivel(nivel: Nivel): Camada {
  return CAMADA_DO_NIVEL[nivel] ?? "territorio";
}

export const NOME_CAMADA: Record<Camada, string> = {
  coordenacao: "Coordenação",
  territorio: "Território",
  supervisao: "Supervisão",
};

// Módulos (rota) onde cada camada pode criar/editar/remover registos.
// Fora desta lista, a camada tem acesso de leitura (pode ver, comentar e
// confirmar onde essas ações existirem à parte — ver Coordenação de
// Avisos e Canal Horizontal, que têm participação aberta mesmo sem
// permissão de escrita sobre o registo em si).
const MODULOS_ESCRITA: Record<Camada, string[]> = {
  coordenacao: [
    "processos",
    "interlocutores",
    "notificacoes",
    "noticias",
    "base-conhecimento",
    "coordenacao-avisos",
    "canal-horizontal",
    "registo-informal",
    "monitorizacao-territorial",
    "memoria-projetos",
    "transparencia",
    "atividade",
  ],
  territorio: ["processos", "registo-informal", "canal-horizontal"],
  supervisao: [],
};

export function podeEscrever(nivel: Nivel, moduloRota: string): boolean {
  return MODULOS_ESCRITA[camadaDoNivel(nivel)].includes(moduloRota);
}
