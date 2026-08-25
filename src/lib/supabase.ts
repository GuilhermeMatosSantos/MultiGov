import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "Supabase não está configurado: falta VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example para .env.local e preenche com os valores do teu projeto."
  );
}

// createClient() valida o URL de forma síncrona e rebenta com uma exceção
// se receber "" — o que travaria a aplicação inteira ao carregar este
// módulo. Usa-se um URL placeholder válido quando não configurado, para
// que a app arranque sempre e caia para o comportamento local (as
// chamadas que dependem da Supabase já falham de forma controlada).
// flowType "pkce": os links de recuperação de password levam o código na
// query string (?code=...) em vez de no fragmento (#access_token=...) —
// importante porque a app usa HashRouter, que trataria um fragmento desses
// como se fosse uma rota e perdia o token antes da Supabase o processar.
// detectSessionInUrl: false porque a troca automática acontece assim que
// este módulo carrega, antes de qualquer componente React poder subscrever
// eventos — o PasswordRecovery.tsx faz a troca manualmente, já a tempo de
// reagir ao resultado.
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-key", {
  auth: { flowType: "pkce", detectSessionInUrl: false },
});
export const supabaseConfigurado = Boolean(url && anonKey);
