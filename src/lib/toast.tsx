import { useEffect, useState } from "react";
import { newId } from "./id";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let pushFn: ((message: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success"): void {
  pushFn?.(message, type);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushFn = (message, type) => {
      const id = newId();
      setItems((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => dismiss(t.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") dismiss(t.id);
          }}
          tabIndex={0}
          role="button"
          aria-label={`${t.message} (dispensar)`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
