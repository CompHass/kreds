'use client'

// PTASK-08: RecurrencePills — 7 pills D/S/T/Q/Q/S/S + link "Todos os dias".
// Seleção por índice de dia (0-6) para evitar colisão entre labels repetidas.
// value e onChange operam com o array ALL_DAYS (subset ou completo).

import { WEEKDAY_LABELS, ALL_DAYS } from '@/lib/seed/parent-seed'

interface RecurrencePillsProps {
  value: string[]
  onChange: (days: string[]) => void
}

// Converte value (array de labels possivelmente duplicados) para índices selecionados.
// Estratégia: os 7 slots da semana são indexados 0–6.
// value pode ter duplicatas (ex: 'S' para Segunda, Sexta, Sábado).
// ALL_DAYS = WEEKDAY_LABELS na ordem exata — usamos comprimento do value para cada posição.
// Para seleção robusta: comparamos o value contra ALL_DAYS posição-a-posição.
export function valueToSelected(value: string[]): boolean[] {
  // O value é um subset ordenado de ALL_DAYS (mantendo a ordem da semana).
  // Para cada posição i, verificamos se ALL_DAYS[i] está presente na posição correspondente.
  // Como labels se repetem, a única forma segura é checar se o comprimento do value
  // alcança esta posição no ALL_DAYS. Mas isso não é suficiente para subsets parciais.
  //
  // Abordagem: usar um marcador de presença por índice.
  // O contrato é que value é um array de strings que mapeia para ALL_DAYS.
  // Subsets: ['D','S','T','Q','Q','S'] = dias 0..5; ALL_DAYS completo = todos 7 selecionados.
  //
  // A maneira mais robusta: mapear posição-a-posição.
  // Se value.length === ALL_DAYS.length E value[i] === ALL_DAYS[i] para todo i → tudo selecionado.
  // Para seleção parcial, o pai deve passar os dias nessa ordem exata.
  // Aqui tratamos: se value inclui ALL_DAYS inteiro → 7 selecionados.
  // Senão: count de ocorrências por label — mas isso ainda colide.
  //
  // Decisão final: usar array de índices binários.
  // Quando pai passa ALL_DAYS, todos 7 estão marcados.
  // Para toggle parcial, usamos um estado de bitmask implícito:
  //   a cada clique num índice i, adicionamos/removemos ALL_DAYS[i] nessa posição.
  // Isso requer que o pai preserve a ordem. O MOCK_PARENT_TASKS já o faz.
  //
  // Para verificar se índice i está "selecionado" no value:
  // contamos quantas vezes ALL_DAYS[i] aparece nos primeiros i+1 elementos de value
  // vs quantas vezes aparece nos primeiros i+1 de ALL_DAYS.
  const selected: boolean[] = new Array(7).fill(false)

  if (value.length === 0) return selected

  // Se value é exatamente ALL_DAYS (comprimento 7 e todos os elementos coincidem)
  if (
    value.length === ALL_DAYS.length &&
    value.every((v, i) => v === ALL_DAYS[i])
  ) {
    return new Array(7).fill(true)
  }

  // Para subsets: contar ocorrências de cada label no value
  // e comparar com a contagem acumulada no ALL_DAYS até aquele índice.
  const valueCount: Record<string, number> = {}
  for (const v of value) {
    valueCount[v] = (valueCount[v] ?? 0) + 1
  }

  const allDaysCount: Record<string, number> = {}
  for (let i = 0; i < ALL_DAYS.length; i++) {
    const label = ALL_DAYS[i]
    allDaysCount[label] = (allDaysCount[label] ?? 0) + 1
    const occurrence = allDaysCount[label]
    const inValue = (valueCount[label] ?? 0) >= occurrence
    selected[i] = inValue
  }

  return selected
}

// Converte array de booleans de seleção para array de strings no padrão ALL_DAYS.
export function selectedToValue(selected: boolean[]): string[] {
  return ALL_DAYS.filter((_, i) => selected[i])
}

// Converte índices de dia (0-6, formato ParentTask.days) para labels (formato TaskFormData.days).
export function dayIndicesToLabels(indices: number[]): string[] {
  const selected = new Array(7).fill(false)
  indices.forEach((i) => {
    selected[i] = true
  })
  return selectedToValue(selected)
}

// Converte labels (formato TaskFormData.days) para índices de dia (0-6, formato ParentTask.days).
export function labelsToDayIndices(labels: string[]): number[] {
  const selected = valueToSelected(labels)
  return selected.reduce<number[]>((acc, isSelected, i) => {
    if (isSelected) acc.push(i)
    return acc
  }, [])
}

export function RecurrencePills({ value, onChange }: RecurrencePillsProps) {
  const selected = valueToSelected(value)

  function toggleDay(index: number) {
    const newSelected = [...selected]
    newSelected[index] = !newSelected[index]
    onChange(selectedToValue(newSelected))
  }

  function selectAll() {
    onChange([...ALL_DAYS])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {WEEKDAY_LABELS.map((label, index) => {
          const isSelected = selected[index]
          return (
            <button
              key={index}
              aria-pressed={isSelected}
              onClick={() => toggleDay(index)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-pill)',
                border: `1.5px solid ${isSelected ? '#3E6B4F' : '#E2DECF'}`,
                background: isSelected ? '#3E6B4F' : 'var(--color-kreds-card)',
                color: isSelected ? '#ffffff' : 'var(--color-kreds-text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background .15s ease, border-color .15s ease, color .15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Link "Todos os dias" */}
      <button
        onClick={selectAll}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-kreds-primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          textDecoration: 'underline',
          width: 'fit-content',
        }}
      >
        Todos os dias
      </button>
    </div>
  )
}
