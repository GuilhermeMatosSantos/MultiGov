import { useEffect, useState } from "react";
import {
  ativarNotificacoesBrowser,
  desativarNotificacoesBrowser,
  notificacoesBrowserAtivas,
  notificacoesBrowserSuportadas,
} from "../lib/notificacoesBrowser";
import { toast } from "../lib/toast";

interface Props {
  colapsada: boolean;
}

export function NotificacoesBrowserToggle({ colapsada }: Props) {
  const [ativas, setAtivas] = useState(() => notificacoesBrowserAtivas());

  useEffect(() => {
    function onChange() {
      setAtivas(notificacoesBrowserAtivas());
    }
    window.addEventListener("multigov:notificacoesBrowser", onChange);
    return () => window.removeEventListener("multigov:notificacoesBrowser", onChange);
  }, []);

  if (!notificacoesBrowserSuportadas()) return null;

  async function alternar() {
    if (ativas) {
      desativarNotificacoesBrowser();
      setAtivas(false);
      toast("Notificações do browser desativadas.", "info");
      return;
    }
    const concedido = await ativarNotificacoesBrowser();
    setAtivas(concedido);
    if (concedido) {
      toast("Notificações do browser ativadas — só para o mais urgente, e só enquanto esta aba estiver aberta.");
    } else {
      toast("Permissão não concedida pelo browser.", "error");
    }
  }

  return (
    <button
      className="theme-toggle"
      onClick={alternar}
      aria-label={ativas ? "Desativar notificações do browser" : "Ativar notificações do browser"}
      title={
        ativas
          ? "Notificações do browser ativas"
          : "Ativar notificações do browser (só enquanto esta aba estiver aberta)"
      }
    >
      <span>{ativas ? "🔔" : "🔕"}</span>
      {!colapsada && <span>{ativas ? "Notificações ativas" : "Ativar notificações"}</span>}
    </button>
  );
}
