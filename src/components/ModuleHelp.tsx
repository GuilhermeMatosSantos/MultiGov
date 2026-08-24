import { useState } from "react";
import { Modal } from "./Modal";

export interface AjudaModulo {
  oQueE: string;
  paraQueServe: string;
  comoUsar: string;
}

interface ModuleHelpProps extends AjudaModulo {
  titulo: string;
}

export function ModuleHelp({ titulo, oQueE, paraQueServe, comoUsar }: ModuleHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="module-help-trigger"
        onClick={() => setOpen(true)}
        aria-label={`O que é "${titulo}"?`}
        title="O que é isto?"
      >
        ⓘ
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
