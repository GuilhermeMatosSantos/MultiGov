import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "Supabase não está configurado — falta VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example para .env.local e preenche com os valores do teu projeto."
  );
}

// createClient() valida o URL de forma síncrona e rebenta com uma exceção
// se receber "" — o que travaria a aplicação inteira ao carregar este
// módulo. Usa-se um URL placeholder válido quando não configurado, para
// que a app arranque sempre e caia para o comportamento local (as
// chamadas que dependem da Supabase já falham de forma controlada).
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-key");
export const supabaseConfigurado = Boolean(url && anonKey);
