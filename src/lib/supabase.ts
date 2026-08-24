import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "Supabase não está configurado — falta VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example para .env.local e preenche com os valores do teu projeto."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
export const supabaseConfigurado = Boolean(url && anonKey);
