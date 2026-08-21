import { useEffect, useState } from "react";

const PREFIX = "multigov.lastSeen.";

export function getLastSeen(modulo: string): string {
  return localStorage.getItem(PREFIX + modulo) ?? "";
}

export function markSeen(modulo: string): void {
  localStorage.setItem(PREFIX + modulo, new Date().toISOString());
}

export function isNovo(criadoEm: string, lastSeen: string): boolean {
  if (!criadoEm || !lastSeen) return false;
  const criado = new Date(criadoEm).getTime();
  const visto = new Date(lastSeen).getTime();
  if (Number.isNaN(criado) || Number.isNaN(visto)) return false;
  return criado > visto;
}

// Devolve o "último visto" tal como estava À ENTRADA desta visita (antes de o
// marcar como visto agora), para que os itens novos continuem visíveis como
// "Novo" durante esta própria visita — só desaparecem na visita seguinte.
export function useMarkSeenOnMount(modulo: string): string {
  const [lastSeenAtEntry] = useState(() => getLastSeen(modulo));

  useEffect(() => {
    markSeen(modulo);
  }, [modulo]);

  return lastSeenAtEntry;
}
