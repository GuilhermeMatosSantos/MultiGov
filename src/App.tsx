import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastHost } from "./lib/toast";
import { ConfirmDialogHost } from "./lib/confirm";
import { SessionGate } from "./components/SessionGate";
import { PasswordRecovery } from "./components/PasswordRecovery";
import { Dashboard } from "./pages/Dashboard";
import { Processos } from "./pages/Processos";
import { Interlocutores } from "./pages/Interlocutores";
import { Notificacoes } from "./pages/Notificacoes";
import { Noticias } from "./pages/Noticias";
import { BaseConhecimento } from "./pages/BaseConhecimento";
import { CoordenacaoAvisos } from "./pages/CoordenacaoAvisos";
import { CanalHorizontal } from "./pages/CanalHorizontal";
import { RegistoInformal } from "./pages/RegistoInformal";
import { MonitorizacaoTerritorial } from "./pages/MonitorizacaoTerritorial";
import { MemoriaProjetos } from "./pages/MemoriaProjetos";
import { Transparencia } from "./pages/Transparencia";
import { Atividade } from "./pages/Atividade";

export function App() {
  return (
    <HashRouter>
      <ToastHost />
      <ConfirmDialogHost />
      <PasswordRecovery>
        <SessionGate>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="processos" element={<Processos />} />
              <Route path="interlocutores" element={<Interlocutores />} />
              <Route path="notificacoes" element={<Notificacoes />} />
              <Route path="noticias" element={<Noticias />} />
              <Route path="base-conhecimento" element={<BaseConhecimento />} />
              <Route path="coordenacao-avisos" element={<CoordenacaoAvisos />} />
              <Route path="canal-horizontal" element={<CanalHorizontal />} />
              <Route path="registo-informal" element={<RegistoInformal />} />
              <Route path="monitorizacao-territorial" element={<MonitorizacaoTerritorial />} />
              <Route path="memoria-projetos" element={<MemoriaProjetos />} />
              <Route path="transparencia" element={<Transparencia />} />
              <Route path="atividade" element={<Atividade />} />
            </Route>
          </Routes>
        </SessionGate>
      </PasswordRecovery>
    </HashRouter>
  );
}
