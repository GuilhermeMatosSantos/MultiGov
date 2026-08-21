const PREFIXO = "multigov.";

export function exportarDados(): string {
  const dados: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (!chave || !chave.startsWith(PREFIXO)) continue;
    const valor = localStorage.getItem(chave);
    if (valor === null) continue;
    try {
      dados[chave] = JSON.parse(valor);
    } catch {
      dados[chave] = valor;
    }
  }
  return JSON.stringify({ exportadoEm: new Date().toISOString(), dados }, null, 2);
}

export function descarregarExportacao(): void {
  const conteudo = exportarDados();
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `multigov-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ResultadoImportacao {
  sucesso: boolean;
  mensagem: string;
}

export function importarDados(conteudoJson: string): ResultadoImportacao {
  let parsed: unknown;
  try {
    parsed = JSON.parse(conteudoJson);
  } catch {
    return { sucesso: false, mensagem: "O ficheiro não é um JSON válido." };
  }
  if (typeof parsed !== "object" || parsed === null || !("dados" in parsed)) {
    return { sucesso: false, mensagem: "O ficheiro não tem o formato de uma exportação do MULTI.GOV." };
  }
  const dados = (parsed as { dados: unknown }).dados;
  if (typeof dados !== "object" || dados === null) {
    return { sucesso: false, mensagem: "O ficheiro não tem o formato de uma exportação do MULTI.GOV." };
  }
  for (const [chave, valor] of Object.entries(dados as Record<string, unknown>)) {
    if (!chave.startsWith(PREFIXO)) continue;
    localStorage.setItem(chave, JSON.stringify(valor));
  }
  return { sucesso: true, mensagem: "Dados importados com sucesso." };
}
