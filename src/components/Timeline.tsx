import type { Aviso } from "../types";
import { EmptyState } from "./EmptyState";

interface TimelineProps {
  avisos: Aviso[];
  onSelect: (id: string) => void;
}

function toDays(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t / 86400000;
}

export function Timeline({ avisos, onSelect }: TimelineProps) {
  const comDatas = avisos.filter((a) => a.dataPrevistaAbertura && a.dataPrevistaFecho);

  if (comDatas.length === 0) {
    return <EmptyState message="Nenhum aviso tem datas previstas definidas para mostrar no calendário." />;
  }

  const starts = comDatas.map((a) => toDays(a.dataPrevistaAbertura)!);
  const ends = comDatas.map((a) => toDays(a.dataPrevistaFecho)!);
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = Math.max(max - min, 1);

  const months: { label: string; pos: number }[] = [];
  const cursor = new Date(min * 86400000);
  cursor.setDate(1);
  while (cursor.getTime() / 86400000 < max) {
    const pos = ((cursor.getTime() / 86400000 - min) / span) * 100;
    months.push({
      label: cursor.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }),
      pos,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="timeline">
      <div className="timeline-axis">
        {months.map((m) => (
          <span key={m.label} className="timeline-month" style={{ left: `${m.pos}%` }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="timeline-rows">
        {comDatas.map((a) => {
          const s = toDays(a.dataPrevistaAbertura)!;
          const e = toDays(a.dataPrevistaFecho)!;
          const left = ((s - min) / span) * 100;
          const width = Math.max(((e - s) / span) * 100, 1.5);
          return (
            <div key={a.id} className="timeline-row">
              <div className="timeline-row-label">{a.titulo}</div>
              <div className="timeline-row-track">
                <button
                  className={`timeline-bar timeline-bar-${a.estado.replace(/\s/g, "-").toLowerCase()}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onClick={() => onSelect(a.id)}
                  title={`${a.titulo} · ${a.dataPrevistaAbertura} a ${a.dataPrevistaFecho}`}
                >
                  {a.estado}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
