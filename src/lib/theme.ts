import { useEffect, useState } from "react";

export type Tema = "light" | "dark";

const KEY = "multigov.tema";

function preferenciaDoSistema(): Tema {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTema(): Tema {
  const raw = localStorage.getItem(KEY);
  if (raw === "light" || raw === "dark") return raw;
  return preferenciaDoSistema();
}

export function setTema(tema: Tema): void {
  localStorage.setItem(KEY, tema);
  document.documentElement.setAttribute("data-theme", tema);
  window.dispatchEvent(new CustomEvent("multigov:tema", { detail: tema }));
}

export function aplicarTemaInicial(): void {
  document.documentElement.setAttribute("data-theme", getTema());
}

export function useTema(): [Tema, () => void] {
  const [tema, setLocal] = useState<Tema>(() => getTema());

  useEffect(() => {
    function onChange(e: Event) {
      setLocal((e as CustomEvent<Tema>).detail);
    }
    window.addEventListener("multigov:tema", onChange);
    return () => window.removeEventListener("multigov:tema", onChange);
  }, []);

  function alternar() {
    const proximo: Tema = tema === "dark" ? "light" : "dark";
    setTema(proximo);
    setLocal(proximo);
  }

  return [tema, alternar];
}
