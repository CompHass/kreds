"use client";

// PTASK-06: AssigneeSelector — lista de crianças como botões toggle de multi-seleção.
// Selecionado: bg #EEF3EA, border #3E6B4F, checkmark verde.
// Avatar 32px com inicial sobre accentColor. aria-pressed por criança.

interface FamilyChild {
  id: string;
  displayName: string;
  accentColor: string;
  avatarPreset: string;
}

interface AssigneeSelectorProps {
  familyChildren: FamilyChild[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function AssigneeSelector({
  familyChildren,
  value,
  onChange,
}: AssigneeSelectorProps) {
  function toggleChild(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (familyChildren.length === 0) {
    return (
      <p
        style={{
          color: "var(--color-kreds-muted)",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        Nenhuma criança cadastrada nesta família.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {familyChildren.map((child) => {
        const isSelected = value.includes(child.id);

        return (
          <button
            key={child.id}
            aria-pressed={isSelected}
            onClick={() => toggleChild(child.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 12,
              border: `1.5px solid ${isSelected ? "#3E6B4F" : "#E2DECF"}`,
              background: isSelected ? "#EEF3EA" : "var(--color-kreds-card)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background .15s ease, border-color .15s ease",
            }}
          >
            {/* Avatar 32px com inicial */}
            <div
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: child.accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {child.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Nome da criança */}
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-kreds-text)",
              }}
            >
              {child.displayName}
            </span>

            {/* Checkmark verde quando selecionado */}
            {isSelected && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="8" cy="8" r="8" fill="#3E6B4F" />
                <path
                  d="M4.5 8L7 10.5L11.5 5.5"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
