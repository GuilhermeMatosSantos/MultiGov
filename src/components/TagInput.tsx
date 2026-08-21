import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export function TagInput({ value, onChange, suggestions, placeholder = "Escrever e Enter..." }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  const remaining = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="tag-input">
      <div className="tag-input-selected">
        {value.map((v) => (
          <span key={v} className="tag-chip">
            {v}
            <button type="button" onClick={() => removeTag(v)} aria-label={`Remover ${v}`}>
              ✕
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          placeholder={placeholder}
        />
      </div>
      {remaining.length > 0 && (
        <div className="tag-input-suggestions">
          {remaining.map((s) => (
            <button key={s} type="button" className="identity-chip" onClick={() => addTag(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
