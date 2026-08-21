import { useEffect, useState } from "react";

export interface Favorito {
  key: string;
  label: string;
  modulo: string;
  to: string;
}

const KEY = "multigov.favoritos";

function readAll(): Favorito[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(favoritos: Favorito[]): void {
  localStorage.setItem(KEY, JSON.stringify(favoritos));
  window.dispatchEvent(new CustomEvent("multigov:favoritos", { detail: favoritos }));
}

export function toggleFavorito(favorito: Favorito): void {
  const atuais = readAll();
  const existe = atuais.some((f) => f.key === favorito.key);
  writeAll(existe ? atuais.filter((f) => f.key !== favorito.key) : [favorito, ...atuais]);
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>(() => readAll());

  useEffect(() => {
    function onChange(e: Event) {
      setFavoritos((e as CustomEvent<Favorito[]>).detail);
    }
    window.addEventListener("multigov:favoritos", onChange);
    return () => window.removeEventListener("multigov:favoritos", onChange);
  }, []);

  return {
    favoritos,
    isFavorito: (key: string) => favoritos.some((f) => f.key === key),
    toggle: toggleFavorito,
  };
}
