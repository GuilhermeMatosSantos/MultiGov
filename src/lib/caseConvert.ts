// Conversão entre camelCase (TypeScript) e snake_case (Postgres) para que
// os repositórios do Supabase possam mapear objetos automaticamente, sem
// precisar de uma função de mapeamento escrita à mão por cada tabela.

export function toSnakeCase(campo: string): string {
  return campo.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
}

export function toCamelCase(campo: string): string {
  return campo.replace(/_([a-z0-9])/g, (_, letra) => letra.toUpperCase());
}

export function objetoParaSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(obj)) {
    resultado[toSnakeCase(chave)] = valor;
  }
  return resultado;
}

export function objetoParaCamelCase<T>(obj: Record<string, unknown>): T {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(obj)) {
    resultado[toCamelCase(chave)] = valor;
  }
  return resultado as T;
}
