import { useEffect, useState } from "react";
import {
  useInteresses,
  temasDisponiveis,
  programasDisponiveis,
  territoriosDisponiveis,
  totalInteresses,
  type Interesses,
} from "../lib/interesses";
import { Modal } from "./Modal";
import { toast } from "../lib/toast";

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="form-field form-field-full">
      <label>{label}</label>
      <div className="identity-chips" style={{ borderTop: "none", paddingTop: 4, marginTop: 0 }}>
        {options.length === 0 && <span className="feed-item-meta">Ainda sem valores disponíveis nos dados.</span>}
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`identity-chip ${selected.includes(opt) ? "identity-chip-active" : ""}`}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InterestsPanel() {
  const [interesses, setInteresses] = useInteresses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Interesses>(interesses);
  const [opcoes, setOpcoes] = useState<{ temas: string[]; programas: string[]; territorios: string[] }>({
    temas: [],
    programas: [],
    territorios: [],
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([temasDisponiveis(), programasDisponiveis(), territoriosDisponiveis()])
      .then(([temas, programas, territorios]) => setOpcoes({ temas, programas, territorios }))
      .catch(() => {});
  }, [open]);

  function openModal() {
    setForm(interesses);
    setOpen(true);
  }

  function toggle(categoria: keyof Interesses, valor: string) {
    setForm((prev) => ({
      ...prev,
      [categoria]: prev[categoria].includes(valor)
        ? prev[categoria].filter((v) => v !== valor)
        : [...prev[categoria], valor],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInteresses(form);
    setOpen(false);
    toast("Áreas de interesse atualizadas.");
  }

  const total = totalInteresses(interesses);

  return (
    <>
      <button className="btn btn-ghost interests-trigger" onClick={openModal}>
        🔔 As minhas áreas de interesse {total > 0 && <span className="count-pill">{total}</span>}
      </button>

      {open && (
        <Modal title="As minhas áreas de interesse" onClose={() => setOpen(false)}>
          <p className="page-description">
            Escolhe temas, programas e territórios que te interessam — passam a ficar destacados no Painel
            Geral (Notificações, Avisos e Notícias que lhes digam respeito), independentemente da tua entidade.
          </p>
          <form className="form" onSubmit={handleSubmit}>
            <ChipPicker
              label="Temas"
              options={opcoes.temas}
              selected={form.temas}
              onToggle={(v) => toggle("temas", v)}
            />
            <ChipPicker
              label="Programas"
              options={opcoes.programas}
              selected={form.programas}
              onToggle={(v) => toggle("programas", v)}
            />
            <ChipPicker
              label="Territórios"
              options={opcoes.territorios}
              selected={form.territorios}
              onToggle={(v) => toggle("territorios", v)}
            />
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
