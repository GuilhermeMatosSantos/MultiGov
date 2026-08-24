import { supabase } from "./supabase";
import { objetoParaCamelCase, objetoParaSnakeCase } from "./caseConvert";
import type { AsyncRepository } from "./asyncRepository";

// Repositório genérico sobre uma tabela do Supabase — mapeia
// automaticamente entre camelCase (TypeScript) e snake_case (Postgres).
// Serve para tabelas "planas" (sem tabelas-filho aninhadas); módulos com
// dados aninhados (histórico, comentários...) precisam de tratamento à
// parte, feito quando chegar a vez de os migrar.

// Campos de referência (ex.: processoId) e outros campos opcionais
// tipados (datas, enums com CHECK) usam "" no formulário para representar
// "vazio", mas as colunas são nullable de tipos que não aceitam "" como
// literal (uuid, date, texto com CHECK) — por isso convertem-se para null
// antes de enviar. "Id" é detetado automaticamente pela convenção do
// projeto; os restantes têm de ser indicados explicitamente por módulo.
function normalizarOpcionais(obj: Record<string, unknown>, camposAdicionais: string[]): Record<string, unknown> {
  const resultado = { ...obj };
  for (const chave of Object.keys(resultado)) {
    if (resultado[chave] === "" && (chave.endsWith("Id") || camposAdicionais.includes(chave))) {
      resultado[chave] = null;
    }
  }
  return resultado;
}

export function createSupabaseRepository<T extends { id: string }>(
  tabela: string,
  camposAnulaveis: string[] = [],
  colunaOrdenacao = "criado_em"
): AsyncRepository<T> {
  return {
    async list() {
      const { data, error } = await supabase.from(tabela).select("*").order(colunaOrdenacao, { ascending: false });
      if (error) throw new Error(`Erro ao ler "${tabela}": ${error.message}`);
      return (data ?? []).map((linha) => objetoParaCamelCase<T>(linha));
    },
    async create(item) {
      const { id: _ignorado, ...resto } = item as T & { id?: string };
      const payload = objetoParaSnakeCase(normalizarOpcionais(resto as Record<string, unknown>, camposAnulaveis));
      const { data, error } = await supabase.from(tabela).insert(payload).select().single();
      if (error) throw new Error(`Erro ao criar em "${tabela}": ${error.message}`);
      return objetoParaCamelCase<T>(data);
    },
    async update(id, patch) {
      const payload = objetoParaSnakeCase(normalizarOpcionais(patch as Record<string, unknown>, camposAnulaveis));
      const { data, error } = await supabase.from(tabela).update(payload).eq("id", id).select().single();
      if (error) throw new Error(`Erro ao atualizar em "${tabela}": ${error.message}`);
      return objetoParaCamelCase<T>(data);
    },
    async remove(id) {
      const { error } = await supabase.from(tabela).delete().eq("id", id);
      if (error) throw new Error(`Erro ao remover em "${tabela}": ${error.message}`);
    },
  };
}
