export type Urgencia = "vencido" | "urgente" | "proximo" | "ok";

export function diasAte(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - hoje) / 86400000);
}

export function urgenciaPrazo(iso: string): Urgencia | null {
  const dias = diasAte(iso);
  if (dias === null) return null;
  if (dias < 0) return "vencido";
  if (dias <= 3) return "urgente";
  if (dias <= 14) return "proximo";
  return "ok";
}

export function urgenciaVigor(iso: string): Urgencia | null {
  const dias = diasAte(iso);
  if (dias === null) return null;
  if (dias < 0) return "ok";
  if (dias <= 3) return "urgente";
  if (dias <= 14) return "proximo";
  return "ok";
}

export function textoUrgencia(iso: string): string {
  const dias = diasAte(iso);
  if (dias === null) return "";
  if (dias === 0) return "vence hoje";
  if (dias < 0) return `venceu há ${Math.abs(dias)} dia(s)`;
  return `vence em ${dias} dia(s)`;
}

export function textoVigor(iso: string): string {
  const dias = diasAte(iso);
  if (dias === null) return "";
  if (dias === 0) return "entra em vigor hoje";
  if (dias < 0) return `em vigor há ${Math.abs(dias)} dia(s)`;
  return `entra em vigor em ${dias} dia(s)`;
}

// Agrupa datas passadas em blocos relativos, para um fluxo cronológico
// (a lista de origem tem de estar ordenada por data decrescente).
export function rotuloRelativo(iso: string): string {
  const dias = diasAte(iso);
  if (dias === null) return "Sem data";
  if (dias > 0) return "Brevemente";
  if (dias === 0) return "Hoje";
  if (dias === -1) return "Ontem";
  if (dias >= -7) return "Esta semana";
  if (dias >= -31) return "Este mês";
  return "Mais antigo";
}
