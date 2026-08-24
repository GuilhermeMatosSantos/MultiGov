import { useEffect, useState } from "react";
import { supabase, supabaseConfigurado } from "./supabase";

// Distingue uma conta real (email + palavra-passe) de uma sessão anónima
// do "modo de teste" — ambas ficam com o mesmo aspeto na barra de
// identidade (nome/entidade/nível autodeclarados), por isso é preciso
// perguntar à sessão da Supabase qual é qual.
export function useContaReal(): boolean {
  const [real, setReal] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    let cancelado = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelado) setReal(Boolean(data.user && !data.user.is_anonymous));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setReal(Boolean(session?.user && !session.user.is_anonymous));
    });

    return () => {
      cancelado = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return real;
}
