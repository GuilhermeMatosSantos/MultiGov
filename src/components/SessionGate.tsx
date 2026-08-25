import { useEffect, useState, type ReactNode } from "react";
import { useIdentidade, usePerfis } from "../lib/session";
import { registarConta, entrarConta, pedirRecuperacaoPassword } from "../lib/auth";
import { garantirSessaoSupabase } from "../lib/supabaseAuth";
import { toast } from "../lib/toast";
import { LogoMark } from "./LogoMark";
import { ModuleHelp } from "./ModuleHelp";
import type { Nivel } from "../types";

const niveis: Nivel[] = [
  "Comissão Europeia",
  "Nacional",
  "Regional (CCDR)",
  "Intermunicipal (CIM/AM)",
  "Municipal",
  "Organismo Intermédio",
  "Autoridade de Gestão",
  "Programa Temático",
  "ADC",
];

interface SessionGateProps {
  children: ReactNode;
}

export function SessionGate({ children }: SessionGateProps) {
  const [identidade, setIdentidade] = useIdentidade();
  const perfis = usePerfis();
  const [modo, setModo] = useState<"entrar" | "registo" | "teste" | "recuperar">("entrar");
  const [carregando, setCarregando] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);
  const [form, setForm] = useState({ nome: identidade.nome, entidade: identidade.entidade, nivel: identidade.nivel });

  // Ao sair, volta sempre ao ecrã principal de login — sem isto, ficava
  // preso na última aba usada (ex.: "modo de teste"), o que dificultava
  // entrar com outro perfil logo a seguir a sair.
  useEffect(() => {
    if (!identidade.entidade || !identidade.nome) {
      setModo("entrar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identidade.entidade, identidade.nome]);

  if (identidade.entidade && identidade.nome) {
    return <>{children}</>;
  }

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await entrarConta(authForm.email, authForm.password);
    setCarregando(false);
    if (resultado.erro) {
      toast(
        resultado.erro === "Invalid login credentials" ? "Email ou palavra-passe incorretos." : resultado.erro,
        "error"
      );
    }
  }

  async function handleRegistar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.entidade.trim()) {
      toast("Preenche o nome e a entidade.", "error");
      return;
    }
    setCarregando(true);
    const resultado = await registarConta(authForm.email, authForm.password, form.nome, form.entidade, form.nivel);
    setCarregando(false);
    if (resultado.erro === "CONFIRMACAO_PENDENTE") {
      toast("Conta criada. Confirma o teu email antes de entrares.");
      setModo("entrar");
      return;
    }
    if (resultado.erro) {
      toast(resultado.erro, "error");
    }
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await pedirRecuperacaoPassword(emailRecuperacao);
    setCarregando(false);
    if (resultado.erro) {
      toast(resultado.erro, "error");
      return;
    }
    setRecuperacaoEnviada(true);
  }

  // Garante que a sessão anónima já existe antes de desbloquear a app —
  // caso contrário, os primeiros pedidos (ex.: painel geral) partiam sem
  // auth.uid() e a RLS devolvia listas vazias em vez dos dados reais.
  async function entrarComoTeste(identidadeTeste: typeof form) {
    setCarregando(true);
    await garantirSessaoSupabase().catch(() => {});
    setCarregando(false);
    setIdentidade(identidadeTeste);
  }

  function handleSubmitTeste(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.entidade.trim()) return;
    entrarComoTeste(form);
  }

  return (
    <div className="session-gate">
      <div className="session-gate-card">
        <div className="session-gate-brand">
          <span className="brand-mark">
            <LogoMark size={26} />
          </span>
          <div>
            <div className="brand-title-dark">
              MULTI.GOV
              <ModuleHelp
                titulo="MULTI.GOV"
                label="Saber mais"
                oQueE="Uma plataforma de coordenação entre os vários níveis envolvidos na gestão dos fundos europeus em Portugal: Comissão Europeia, autoridades nacionais, autoridades de gestão, CIM, municípios e organismos intermédios."
                paraQueServe="Para centralizar processos, notificações, avisos, decisões e boas práticas num só sítio, em vez de a coordenação depender de emails avulsos ou da memória de cada pessoa."
                comoUsar="Cria uma conta para participares a sério, ou explora em modo de teste para simulares diferentes perfis sem compromisso. Cada módulo tem o seu próprio ⓘ a explicar o que faz."
              />
            </div>
            <div className="session-gate-subtitle">Comunicação multinível</div>
          </div>
        </div>

        {modo === "entrar" || modo === "registo" ? (
          <>
            <h1>{modo === "entrar" ? "Entra na tua conta" : "Cria a tua conta"}</h1>
            <p className="session-gate-note">
              {modo === "entrar"
                ? "Usa o email e a palavra-passe da tua conta MULTI.GOV."
                : "A tua entidade e nível definem o que podes ver e editar na aplicação."}
            </p>

            {modo === "entrar" ? (
              <form className="form" onSubmit={handleEntrar}>
                <div className="form-field form-field-full">
                  <label>
                    Email<span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="ex.: ana.carranho@cim-cavado.pt"
                  />
                </div>
                <div className="form-field form-field-full">
                  <label>
                    Palavra-passe<span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="form-actions session-gate-actions">
                  <button type="submit" className="btn btn-primary" disabled={carregando}>
                    {carregando ? "A entrar..." : "Entrar"}
                  </button>
                </div>
                <div className="session-gate-divider">
                  <button
                    type="button"
                    className="session-gate-link"
                    onClick={() => {
                      setEmailRecuperacao(authForm.email);
                      setRecuperacaoEnviada(false);
                      setModo("recuperar");
                    }}
                  >
                    Esqueci-me da password
                  </button>
                </div>
              </form>
            ) : (
              <form className="form" onSubmit={handleRegistar}>
                <div className="form-field form-field-full">
                  <label>
                    Email<span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="form-field form-field-full">
                  <label>
                    Palavra-passe<span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authForm.password}
                    onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label>
                    O teu nome<span className="required">*</span>
                  </label>
                  <input
                    required
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="ex.: Ana Carranho"
                  />
                </div>
                <div className="form-field">
                  <label>
                    Entidade<span className="required">*</span>
                  </label>
                  <input
                    required
                    value={form.entidade}
                    onChange={(e) => setForm((p) => ({ ...p, entidade: e.target.value }))}
                    placeholder="ex.: CIM do Cávado"
                  />
                </div>
                <div className="form-field form-field-full">
                  <label>Nível</label>
                  <select value={form.nivel} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value as Nivel }))}>
                    {niveis.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions session-gate-actions">
                  <button type="submit" className="btn btn-primary" disabled={carregando}>
                    {carregando ? "A criar..." : "Criar conta"}
                  </button>
                </div>
              </form>
            )}

            <div className="session-gate-divider">
              {modo === "entrar" ? (
                <button type="button" className="session-gate-link" onClick={() => setModo("registo")}>
                  Ainda não tens conta? Cria uma
                </button>
              ) : (
                <button type="button" className="session-gate-link" onClick={() => setModo("entrar")}>
                  Já tens conta? Entra
                </button>
              )}
            </div>
            <div className="session-gate-divider">
              <button type="button" className="session-gate-link" onClick={() => setModo("teste")}>
                Ou explorar em modo de teste, sem conta
              </button>
            </div>
          </>
        ) : modo === "recuperar" ? (
          <>
            <h1>Repor password</h1>
            {recuperacaoEnviada ? (
              <>
                <p className="session-gate-note">
                  Se existir uma conta com esse email, enviámos um link para definires uma password nova. Verifica
                  a caixa de entrada (e o spam).
                </p>
                <div className="form-actions session-gate-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setModo("entrar")}>
                    Voltar ao login
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="session-gate-note">
                  Escreve o email da tua conta. Enviamos-te um link para definires uma password nova.
                </p>
                <form className="form" onSubmit={handleRecuperar}>
                  <div className="form-field form-field-full">
                    <label>
                      Email<span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailRecuperacao}
                      onChange={(e) => setEmailRecuperacao(e.target.value)}
                      placeholder="ex.: ana.carranho@cim-cavado.pt"
                    />
                  </div>
                  <div className="form-actions session-gate-actions">
                    <button type="submit" className="btn btn-primary" disabled={carregando}>
                      {carregando ? "A enviar..." : "Enviar link de recuperação"}
                    </button>
                  </div>
                </form>
                <div className="session-gate-divider">
                  <button type="button" className="session-gate-link" onClick={() => setModo("entrar")}>
                    ← Voltar ao login
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h1>Modo de teste</h1>
            <p className="session-gate-note">
              Isto não é uma conta com palavra-passe: é um protótipo local, cada computador guarda os seus
              próprios dados. Serve para atribuir autoria às tuas ações e simular os diferentes pontos de vista
              de quem usa a aplicação.
            </p>

            {perfis.length > 0 && (
              <div className="session-gate-profiles">
                <span className="rail-heading">Entrar como um perfil guardado</span>
                <div className="identity-chips" style={{ borderTop: "none", paddingTop: 0, marginTop: 6 }}>
                  {perfis.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="identity-chip"
                      disabled={carregando}
                      onClick={() => entrarComoTeste({ nome: p.nome, entidade: p.entidade, nivel: p.nivel })}
                    >
                      {p.nome} · {p.entidade}
                    </button>
                  ))}
                </div>
                <div className="session-gate-divider">ou identifica-te de novo</div>
              </div>
            )}

            <form className="form" onSubmit={handleSubmitTeste}>
              <div className="form-field">
                <label>
                  O teu nome<span className="required">*</span>
                </label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="ex.: Ana Carranho"
                />
              </div>
              <div className="form-field">
                <label>
                  Entidade<span className="required">*</span>
                </label>
                <input
                  required
                  value={form.entidade}
                  onChange={(e) => setForm((p) => ({ ...p, entidade: e.target.value }))}
                  placeholder="ex.: CIM do Cávado"
                />
              </div>
              <div className="form-field form-field-full">
                <label>Nível</label>
                <select value={form.nivel} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value as Nivel }))}>
                  {niveis.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions session-gate-actions">
                <button type="submit" className="btn btn-primary" disabled={carregando}>
                  {carregando ? "A entrar..." : "Entrar"}
                </button>
              </div>
            </form>

            <div className="session-gate-divider">
              <button type="button" className="session-gate-link" onClick={() => setModo("entrar")}>
                ← Voltar ao login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
