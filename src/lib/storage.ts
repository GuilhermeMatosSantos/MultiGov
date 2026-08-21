// Camada de acesso a dados. Hoje implementada sobre localStorage; no futuro
// pode ser substituída por uma implementação que fale com uma API real sem
// que nenhuma página precise de mudar — todas usam apenas esta interface.

export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  create(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): void;
  reset(): void;
}

function readAll<T>(storageKey: string, seed: T[]): T[] {
  const raw = localStorage.getItem(storageKey);
  if (raw === null) {
    localStorage.setItem(storageKey, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

function writeAll<T>(storageKey: string, items: T[]): void {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function createLocalStorageRepository<T extends { id: string }>(
  storageKey: string,
  seed: T[] = []
): Repository<T> {
  return {
    list() {
      return readAll(storageKey, seed);
    },
    get(id) {
      return readAll(storageKey, seed).find((item) => item.id === id);
    },
    create(item) {
      const all = readAll(storageKey, seed);
      const next = [...all, item];
      writeAll(storageKey, next);
      return item;
    },
    update(id, patch) {
      const all = readAll(storageKey, seed);
      const idx = all.findIndex((item) => item.id === id);
      if (idx === -1) return undefined;
      const updated = { ...all[idx], ...patch };
      const next = [...all];
      next[idx] = updated;
      writeAll(storageKey, next);
      return updated;
    },
    remove(id) {
      const all = readAll(storageKey, seed);
      writeAll(
        storageKey,
        all.filter((item) => item.id !== id)
      );
    },
    reset() {
      writeAll(storageKey, seed);
    },
  };
}
