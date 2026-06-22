---
status: resolved
trigger: "texto estrapolando o label no SpeechBubble do jardim"
created: 2026-06-22T00:00:00Z
updated: 2026-06-22T00:00:00Z
---

## Current Focus

hypothesis: whiteSpace nowrap em speech-bubble.tsx ignorava maxWidth
next_action: done
reasoning_checkpoint: ""

## Evidence

- timestamp: 2026-06-22
  observation: "speech-bubble.tsx linha 26 tinha `whiteSpace: 'nowrap'` + `maxWidth: 240` — nowrap faz o texto ignorar maxWidth e extrapolava o container"

## Eliminated

## Resolution

root_cause: "`whiteSpace: 'nowrap'` em SpeechBubble impedia quebra de linha, ignorando `maxWidth: 240`"
fix: "Removido `whiteSpace: 'nowrap'` de speech-bubble.tsx. Texto agora quebra dentro do container."
verification: "Texto longo fica contido em 240px com quebra de linha natural"
files_changed:
  - src/components/garden/speech-bubble.tsx
  - src/components/garden/garden-view.tsx (checkbox visual adicionado)
