import { useEffect, useState, type ReactNode } from "react";
import { supabase, supabaseConfigurado } from "../lib/supabase";
import { definirNovaPassword, sairConta } from "../lib/auth";
import { toast } from "../lib/toast";
import { LogoMark } from "./LogoMark";

interface Props {
  children: ReactNode;
}

// Intercepta a app inteira quando alguém chega através de um link de
// recuperação de password (evento PASSWORD_RECOVERY da Supabase) — tem de
// escolher uma password nova antes de continuar, independentemente de já
// ter uma identidade guardada neste browser.
export function PasswordRecovery({ children }: Props) {
  const [emRecuperacao, setEmRecuperacao] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;

    // detectSessionInUrl está desligado (ver supabase.ts) — a troca do
    // código PKCE é feita aqui, a tempo de reagir ao resultado. Esta app
    // não usa OAuth nem magic links, por isso qualquer "?code=" na URL só
    // pode vir de um link de recuperação de password.
    const codigo = new URLSearchParams(window.location.search).get("code");
    if (codigo) {
      supabase.auth.exchangeCodeForSession(codigo).then(({ error }) => {
        if (!error) {
          setEmRecuperacao(true);
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        }
      });
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setEmRecuperacao(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (!emRecuperacao) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast("A password tem de ter pelo menos 6 caracteres.", "error");
      return;
    }
    if (password !== confirmacao) {
      toast("As duas passwords não coincidem.", "error");
      return;
    }
    setCarregando(true);
    const resultado = await definirNovaPassword(password);
    setCarregando(false);
    if (resultado.erro) {
      toast(resultado.erro, "error");
      return;
    }
    toast("Password atualizada. Já podes continuar.");
    setEmRecuperacao(false);
  }

  async function handleCancelar() {
    setCarregando(true);
    await sairConta();
    setCarregando(false);
    setEmRecuperacao(false);
  }

  return (
    <div className="session-gate">
      <div className="session-gate-card">
        <div className="session-gate-brand">
          <span className="brand-mark">
            <LogoMark size={26} />
          </span>
          <div>
            <div className="brand-title-dark">MULTI.GOV</div>
            <div className="session-gate-subtitle">Comunicação multinível</div>
          </div>
        </div>

        <h1>Define uma nova password</h1>
        <p className="session-gate-note">
          Confirmámos o pedido de recuperação. Escolhe uma password nova para continuares.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field form-field-full">
            <label>
              Nova password<span className="required">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-field form-field-full">
            <label>
              Confirmar password<span className="required">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <div className="form-actions session-gate-actions">
            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? "A guardar..." : "Guardar nova password"}
            </button>
          </div>
        </form>

        <div className="session-gate-divider">
          <button type="button" className="session-gate-link" onClick={handleCancelar} disabled={carregando}>
            ← Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
