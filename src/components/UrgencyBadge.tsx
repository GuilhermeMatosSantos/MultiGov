import { urgenciaPrazo, urgenciaVigor, textoUrgencia, textoVigor } from "../lib/dates";

interface UrgencyBadgeProps {
  prazo: string;
  kind?: "prazo" | "vigor";
}

export function UrgencyBadge({ prazo, kind = "prazo" }: UrgencyBadgeProps) {
  const nivel = kind === "vigor" ? urgenciaVigor(prazo) : urgenciaPrazo(prazo);
  if (!nivel) return null;
  const texto = kind === "vigor" ? textoVigor(prazo) : textoUrgencia(prazo);
  return (
    <span className={`urgencia urgencia-${nivel}`} title={prazo}>
      {texto}
    </span>
  );
}
