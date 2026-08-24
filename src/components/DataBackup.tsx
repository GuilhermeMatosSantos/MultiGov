import { useRef } from "react";
import { descarregarExportacao, importarDados } from "../lib/backup";
import { toast } from "../lib/toast";
import { confirmDialog } from "../lib/confirm";

interface Props {
  colapsada: boolean;
}

export function DataBackup({ colapsada }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleImportClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const texto = await file.text();
    const ok = await confirmDialog(
      "Importar este ficheiro substitui as tuas preferências guardadas neste browser (tema, perfis guardados, favoritos). Não afeta os dados partilhados (processos, avisos, notificações, etc.) nem outros dispositivos. Continuar?",
      "Importar e substituir"
    );
    if (!ok) return;

    const resultado = importarDados(texto);
    if (!resultado.sucesso) {
      toast(resultado.mensagem, "error");
      return;
    }
    toast("Preferências importadas. A recarregar...");
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="data-backup">
      <button
        className="data-backup-btn"
        onClick={descarregarExportacao}
        title="Descarregar as tuas preferências deste browser em JSON (tema, perfis guardados, favoritos). Não inclui os dados partilhados, esses estão na base de dados."
        aria-label="Exportar preferências locais"
      >
        <span>⬇️</span>
        {!colapsada && <span>Preferências</span>}
      </button>
      <button
        className="data-backup-btn"
        onClick={handleImportClick}
        title="Substituir as tuas preferências deste browser a partir de um ficheiro exportado"
        aria-label="Importar preferências locais"
      >
        <span>⬆️</span>
        {!colapsada && <span>Importar</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
