import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { IdentityBar } from "./IdentityBar";
import { CommandPalette } from "./CommandPalette";
import { DataBackup } from "./DataBackup";
import { FeedbackImpacto } from "./FeedbackImpacto";
import { NotificacoesBrowserToggle } from "./NotificacoesBrowserToggle";
import { LogoMark } from "./LogoMark";
import { useTema } from "../lib/theme";
import { verificarENotificar } from "../lib/notificacoesBrowser";
import { sincronizarPerfilSupabase } from "../lib/supabaseAuth";
import { getIdentidade } from "../lib/session";
import logoPat2030 from "../assets/pat2030-logo.svg";
import logoPortugal2030 from "../assets/portugal2030-logo.png";
import logoUe from "../assets/ue-cofinanciado-logo.png";

const navItems = [
  { to: "/", label: "Painel geral", icon: "🏠", end: true },
  { to: "/atividade", label: "Atividade", icon: "🕒" },
  { to: "/processos", label: "Processos", icon: "📁" },
  { to: "/interlocutores", label: "Interlocutores", icon: "🧭" },
  { to: "/notificacoes", label: "Notificações", icon: "🔔" },
  { to: "/noticias", label: "Notícias & Regulamentação", icon: "📰" },
  { to: "/base-conhecimento", label: "Base de Conhecimento", icon: "📚" },
  { to: "/coordenacao-avisos", label: "Coordenação de Avisos", icon: "🗓️" },
  { to: "/canal-horizontal", label: "Canal Horizontal", icon: "💬" },
  { to: "/registo-informal", label: "Registo do Informal", icon: "📝" },
  { to: "/monitorizacao-territorial", label: "Monitorização Territorial", icon: "📊" },
  { to: "/memoria-projetos", label: "Memória de Projetos", icon: "🗂️" },
  { to: "/transparencia", label: "Transparência", icon: "🔎" },
];

const SIDEBAR_KEY = "multigov.sidebarColapsada";

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tema, alternarTema] = useTema();
  const [colapsada, setColapsada] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const item = navItems.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));
    document.title = item ? `${item.label} · MULTI.GOV` : "MULTI.GOV · Comunicação Multinível";
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    verificarENotificar();
    const intervalo = setInterval(verificarENotificar, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    void sincronizarPerfilSupabase(getIdentidade());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function alternarSidebar() {
    setColapsada((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <span className="brand-mark">
          <LogoMark />
        </span>
        <span className="mobile-topbar-title">MULTI.GOV</span>
      </div>

      {/* Irmã direta de .mobile-topbar/.sidebar (não aninhada), para que o seu
          z-index seja comparado diretamente com o da gaveta/fundo — dentro de
          .mobile-topbar ficaria preso ao contexto de empilhamento desse pai. */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setMobileNavOpen((prev) => !prev)}
        aria-label={mobileNavOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        aria-expanded={mobileNavOpen}
      >
        {mobileNavOpen ? "✕" : "☰"}
      </button>

      {mobileNavOpen && <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <aside className={`sidebar ${colapsada ? "sidebar-collapsed" : ""} ${mobileNavOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <LogoMark />
          </span>
          <div className="brand-text">
            <div className="brand-title">MULTI.GOV</div>
            <div className="brand-subtitle">Comunicação multinível</div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={alternarSidebar}
            aria-label={colapsada ? "Expandir barra lateral" : "Colapsar barra lateral"}
            title={colapsada ? "Expandir" : "Colapsar"}
          >
            {colapsada ? "»" : "«"}
          </button>
        </div>
        <button
          className="palette-trigger"
          onClick={() => setPaletteOpen(true)}
          aria-label="Pesquisar em toda a aplicação"
          title="Pesquisar tudo (Ctrl K)"
        >
          <span>🔍 {!colapsada && "Pesquisar tudo"}</span>
          {!colapsada && <span className="palette-trigger-kbd">Ctrl K</span>}
        </button>
        <nav className="nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              title={colapsada ? item.label : undefined}
              aria-label={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!colapsada && item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="theme-toggle"
          onClick={alternarTema}
          aria-label={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          title={tema === "dark" ? "Tema claro" : "Tema escuro"}
        >
          <span>{tema === "dark" ? "☀️" : "🌙"}</span>
          {!colapsada && <span>{tema === "dark" ? "Tema claro" : "Tema escuro"}</span>}
        </button>
        <NotificacoesBrowserToggle colapsada={colapsada} />
        <FeedbackImpacto colapsada={colapsada} />
        <DataBackup colapsada={colapsada} />
        {!colapsada && <div className="sidebar-footer">Protótipo local · dados guardados no browser</div>}
      </aside>
      <main className="content" role="main">
        <IdentityBar />
        <Outlet />
        <footer className="funding-footer">
          <img src={logoPat2030} alt="Programa de Assistência Técnica 2030" />
          <img src={logoPortugal2030} alt="Portugal 2030" />
          <img src={logoUe} alt="Cofinanciado pela União Europeia" />
        </footer>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
