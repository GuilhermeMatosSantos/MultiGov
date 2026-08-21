import { useEffect, useId, useRef, useState } from "react";

interface ConfirmRequest {
  message: string;
  confirmLabel: string;
  resolve: (value: boolean) => void;
}

let showFn: ((message: string, confirmLabel?: string) => Promise<boolean>) | null = null;

export function confirmDialog(message: string, confirmLabel = "Confirmar"): Promise<boolean> {
  if (!showFn) return Promise.resolve(window.confirm(message));
  return showFn(message, confirmLabel);
}

export function ConfirmDialogHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    showFn = (message, confirmLabel = "Confirmar") =>
      new Promise<boolean>((resolve) => {
        setRequest({ message, confirmLabel, resolve });
      });
    return () => {
      showFn = null;
    };
  }, []);

  function respond(value: boolean) {
    request?.resolve(value);
    setRequest(null);
  }

  useEffect(() => {
    if (!request) return;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") respond(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request) return null;

  return (
    <div className="modal-overlay" onClick={() => respond(false)}>
      <div
        className="modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <p id={titleId}>{request.message}</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => respond(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger-solid" onClick={() => respond(true)}>
              {request.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
