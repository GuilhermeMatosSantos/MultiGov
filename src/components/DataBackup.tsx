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
      "Importar este ficheiro substitui todos os dados guardados neste browser (não afeta outros dispositivos). Continuar?",
      "Importar e substituir"
    );
    if (!ok) return;

    const resultado = importarDados(texto);
    if (!resultado.sucesso) {
      toast(resultado.mensagem, "error");
      return;
    }
    toast("Dados importados. A recarregar...");
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="data-backup">
      <button
        className="data-backup-btn"
        onClick={descarregarExportacao}
        title="Descarregar todos os dados em JSON"
        aria-label="Exportar dados"
      >
        <span>⬇️</span>
        {!colapsada && <span>Exportar</span>}
      </button>
      <button
        className="data-backup-btn"
        onClick={handleImportClick}
        title="Substituir os dados a partir de um ficheiro exportado"
        aria-label="Importar dados"
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
