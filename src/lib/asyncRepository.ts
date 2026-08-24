import type { Repository } from "./storage";

// Interface assíncrona — o que os componentes que já não podem ser
// síncronos (porque falam com uma API real) precisam de implementar.
// Os repositórios de localStorage continuam 100% síncronos e inalterados;
// isto é só a "forma" que o ModulePage passou a exigir.
export interface AsyncRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<void>;
}

// Adapta um repositório de localStorage (síncrono) para a interface
// assíncrona, sem mudar nada na sua implementação — permite que o
// ModulePage seja sempre assíncrono sem obrigar todos os módulos a
// migrarem para o Supabase ao mesmo tempo.
export function wrapSync<T extends { id: string }>(repo: Repository<T>): AsyncRepository<T> {
  return {
    async list() {
      return repo.list();
    },
    async create(item) {
      return repo.create(item);
    },
    async update(id, patch) {
      return repo.update(id, patch);
    },
    async remove(id) {
      repo.remove(id);
    },
  };
}
