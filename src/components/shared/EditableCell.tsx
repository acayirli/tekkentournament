import { useState } from "react";

interface Props {
  value: number;
  onChange: (val: number) => void;
}

export function EditableCell({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <input
        className="editable-cell"
        type="number"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const num = parseInt(draft, 10);
          if (!isNaN(num) && num >= 0) onChange(num);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{ width: 60 }}
      />
    );
  }

  return (
    <span className="editable-cell" onClick={() => { setDraft(String(value)); setEditing(true); }}>
      {value}
    </span>
  );
}
