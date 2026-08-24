import { useEffect, useState } from "react";
import type { Identidade, PerfilIdentidade } from "../types";
import { newId } from "./id";
import { sincronizarPerfilSupabase } from "./supabaseAuth";

const KEY = "multigov.identidade";
const PERFIS_KEY = "multigov.perfis";

const DEFAULT_IDENTIDADE: Identidade = {
  nome: "",
  entidade: "",
  nivel: "Municipal",
};

const SEED_PERFIS: PerfilIdentidade[] = [
  { id: newId(), nome: "Técnico(a) Norte 2030", entidade: "Norte 2030", nivel: "Autoridade de Gestão" },
  { id: newId(), nome: "Coordenador(a) CIM Cávado", entidade: "CIM do Cávado", nivel: "Intermunicipal (CIM/AM)" },
  { id: newId(), nome: "Responsável Pessoas 2030", entidade: "Pessoas 2030", nivel: "Programa Temático" },
];

export function getIdentidade(): Identidade {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_IDENTIDADE;
  try {
    return { ...DEFAULT_IDENTIDADE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_IDENTIDADE;
  }
}

export function setIdentidade(identidade: Identidade): void {
  localStorage.setItem(KEY, JSON.stringify(identidade));
  window.dispatchEvent(new CustomEvent("multigov:identidade", { detail: identidade }));
  void sincronizarPerfilSupabase(identidade);
}

export function useIdentidade(): [Identidade, (identidade: Identidade) => void] {
  const [identidade, setLocal] = useState<Identidade>(() => getIdentidade());

  useEffect(() => {
    function onChange(e: Event) {
      setLocal((e as CustomEvent<Identidade>).detail);
    }
    window.addEventListener("multigov:identidade", onChange);
    return () => window.removeEventListener("multigov:identidade", onChange);
  }, []);

  function update(next: Identidade) {
    setIdentidade(next);
    setLocal(next);
  }

  return [identidade, update];
}

export function getPerfis(): PerfilIdentidade[] {
  const raw = localStorage.getItem(PERFIS_KEY);
  if (raw === null) {
    localStorage.setItem(PERFIS_KEY, JSON.stringify(SEED_PERFIS));
    return SEED_PERFIS;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePerfis(perfis: PerfilIdentidade[]): void {
  localStorage.setItem(PERFIS_KEY, JSON.stringify(perfis));
  window.dispatchEvent(new CustomEvent("multigov:perfis", { detail: perfis }));
}

export function salvarPerfil(identidade: Identidade): PerfilIdentidade {
  const perfil: PerfilIdentidade = { ...identidade, id: newId() };
  writePerfis([...getPerfis(), perfil]);
  return perfil;
}

export function removerPerfil(id: string): void {
  writePerfis(getPerfis().filter((p) => p.id !== id));
}

export function usePerfis(): PerfilIdentidade[] {
  const [perfis, setLocal] = useState<PerfilIdentidade[]>(() => getPerfis());

  useEffect(() => {
    function onChange(e: Event) {
      setLocal((e as CustomEvent<PerfilIdentidade[]>).detail);
    }
    window.addEventListener("multigov:perfis", onChange);
    return () => window.removeEventListener("multigov:perfis", onChange);
  }, []);

  return perfis;
}
