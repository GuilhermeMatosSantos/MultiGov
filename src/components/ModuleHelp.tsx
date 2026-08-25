import { useState } from "react";
import { Modal } from "./Modal";

export interface AjudaModulo {
  oQueE: string;
  paraQueServe: string;
  comoUsar: string;
}

interface ModuleHelpProps extends AjudaModulo {
  titulo: string;
  /** Quando definido, mostra um rótulo de texto ao lado do ícone, em vez
   * de só o círculo — usado onde o ícone sozinho não é óbvio que serve
   * para abrir informação (ex.: o ecrã de login). */
  label?: string;
}

export function ModuleHelp({ titulo, oQueE, paraQueServe, comoUsar, label }: ModuleHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={label ? "module-help-trigger-labeled" : "module-help-trigger"}
        onClick={() => setOpen(true)}
        aria-label={label ? `${label}: o que é "${titulo}"?` : `O que é "${titulo}"?`}
        title="O que é isto?"
      >
        {label ? (
          <>
            <span className="module-help-icon">ⓘ</span>
            <span>{label}</span>
          </>
        ) : (
          "ⓘ"
        )}
      </button>
      {open && (
        <Modal title={titulo} onClose={() => setOpen(false)} className="module-help-modal">
          <div className="module-help-content">
            <h3>O que é</h3>
            <p>{oQueE}</p>
            <h3>Para que serve</h3>
            <p>{paraQueServe}</p>
            <h3>Como usar</h3>
            <p>{comoUsar}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
