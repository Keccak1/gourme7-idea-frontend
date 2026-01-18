# Tool Display Components

Dokumentacja komponentow UI do wyswietlania tool calls agenta.

## Architektura

```
frontend/src/components/chat/tool-displays/
├── index.ts              # Eksporty publiczne
├── shared.tsx            # Wspoldzielone typy, komponenty i utilities
├── ToolCallDisplay.tsx   # Glowny router component
├── ReadToolDisplay.tsx   # Wyswietlacz operacji read
├── WriteToolDisplay.tsx  # Wyswietlacz operacji write (z risk indicator)
├── MemoryToolDisplay.tsx # Wyswietlacz operacji memory
├── ScheduleToolDisplay.tsx # Wyswietlacz operacji schedule
└── SkillToolDisplay.tsx  # Wyswietlacz ladowania skilli
```

## Typy narzedzi

System obsluguje 5 uniwersalnych narzedzi agenta:

| Tool | Opis | Ikona | Kolor |
|------|------|-------|-------|
| `read` | Pobieranie danych (morpho, wallet, coingecko) | BookOpen | Niebieski |
| `write` | Wykonywanie akcji (deposit, withdraw, swap) | Send | Pomaranczowy |
| `memory` | Operacje na pamieci agenta | Brain | Fioletowy |
| `schedule` | Harmonogramowanie zadan | Calendar | Zielony |
| `skill` | Ladowanie skilli (internal) | Sparkles | Zloty |

## Uzycie

### Podstawowe uzycie

```tsx
import { ToolCallDisplay } from '@/components/chat/tool-displays';

<ToolCallDisplay
  toolCallId="call-123"
  toolName="read"
  args={{ source: "morpho", query: "vaults" }}
  state="running"
/>
```

### Bezposrednie uzycie specjalizowanych komponentow

```tsx
import { ReadToolDisplay, WriteToolDisplay } from '@/components/chat/tool-displays';

// Read tool
<ReadToolDisplay
  toolCallId="call-123"
  toolName="read"
  args={{ source: "morpho", query: "vaults", params: { chain: "base" } }}
  state="completed"
  result={{ vaults: [...] }}
/>

// Write tool z risk indicator
<WriteToolDisplay
  toolCallId="call-456"
  toolName="write"
  args={{ target: "morpho", action: "deposit", params: { amount: "100" } }}
  state="running"
/>
```

## Komponenty

### ToolCallDisplay (Router)

Glowny komponent, ktory automatycznie kieruje do odpowiedniego wyswietlacza na podstawie:
1. Nazwy toola (`read`, `write`, `memory`, `schedule`, `skill`)
2. Struktury argumentow (type guards)

Jesli tool nie pasuje do zadnego wzorca, wyswietla generyczny widok.

### ReadToolDisplay

Wyswietla operacje odczytu danych.

**Props:**
```typescript
interface ReadToolArgs {
  source: string;      // Zrodlo danych (morpho, wallet, coingecko)
  query?: string;      // Zapytanie
  params?: Record<string, unknown>; // Dodatkowe parametry
}
```

**Wyswietla:**
- Ikona zrodla danych
- Nazwa zrodla
- Query (jesli podane)
- Parametry (rozwijane)

### WriteToolDisplay

Wyswietla operacje zapisu z wskaznikiem ryzyka.

**Props:**
```typescript
interface WriteToolArgs {
  target: string;      // Cel operacji (morpho, uniswap)
  action: string;      // Akcja (deposit, withdraw, swap)
  params?: Record<string, unknown>;
}
```

**Wyswietla:**
- Badge ryzyka (High Risk / Safe)
- Target i action
- Ostrzezenie dla operacji wysokiego ryzyka

**Operacje wysokiego ryzyka:**
- `transfer`
- `swap`
- `withdraw`
- `approve`
- `revoke`
- `execute`
- `send`

### MemoryToolDisplay

Wyswietla operacje na pamieci agenta.

**Props:**
```typescript
interface MemoryToolArgs {
  action: 'read' | 'write' | 'delete' | 'list';
  key?: string;        // Klucz pamieci
  content?: string;    // Zawartosc (dla write)
  prefix?: string;     // Prefix (dla list)
}
```

**Wyswietla:**
- Ikona odpowiednia dla akcji
- Klucz lub prefix
- Podglad zawartosci (dla write)

### ScheduleToolDisplay

Wyswietla operacje harmonogramowania.

**Props:**
```typescript
interface ScheduleToolArgs {
  action: 'create' | 'list' | 'delete' | 'pause' | 'resume';
  cron?: string;       // Wyrazenie cron
  prompt?: string;     // Prompt do wykonania
  maxRuns?: number;    // Max liczba wykonan
  id?: string;         // ID harmonogramu
}
```

**Wyswietla:**
- Badge akcji
- Wyrazenie cron z czytelnym opisem
- Prompt
- Max runs

**Parsowanie cron:**
- `* * * * *` -> "Every minute"
- `0 * * * *` -> "Every hour"
- `0 0 * * *` -> "Daily at midnight"
- itd.

### SkillToolDisplay

Wyswietla ladowanie skilla.

**Props:**
```typescript
interface SkillToolArgs {
  action: 'load';
  skillName: string;   // Nazwa skilla do zaladowania
}
```

**Wyswietla:**
- Animowana ikona ladowania
- Nazwa skilla (sformatowana)
- Wskaznik postepu

## Wspoldzielone komponenty (shared.tsx)

### ToolCard

Bazowy wrapper dla wszystkich wyswietlaczy.

```tsx
<ToolCard
  toolType="read"
  title="Reading: morpho"
  state="running"
  isError={false}
  result={result}
>
  {/* Custom content */}
</ToolCard>
```

### StateIndicator

Wskaznik stanu wykonania.

```tsx
<StateIndicator state="running" isError={false} />
```

Stany:
- `pending` - Pulsujace kolo
- `running` - Obracajacy sie spinner
- `completed` - Zielony checkmark
- `error` - Czerwony X

### InfoRow

Wiersz klucz-wartosc.

```tsx
<InfoRow label="Source" value="morpho" mono />
```

### ParamsDisplay

Rozwijana lista parametrow.

```tsx
<ParamsDisplay params={{ chain: "base", limit: 10 }} />
```

### ResultDisplay

Wyswietlacz wyniku z kolapsowaniem.

```tsx
<ResultDisplay result={data} isError={false} />
```

## Kolorystyka

Kazdy typ toola ma zdefiniowany schemat kolorow:

```typescript
const toolColors = {
  read: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
  },
  write: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500',
  },
  // ... itd.
};
```

## Integracja z assistant-ui

Komponenty sa zintegrowane z `@assistant-ui/react` przez `MessageBubble.tsx`:

```tsx
// MessageBubble.tsx
const ToolCallContent: FC<ToolCallContentProps> = ({ toolCallId, toolName, args, result, status }) => {
  // Mapowanie statusu assistant-ui na ToolCallDisplay state
  const getState = () => {
    switch (status.type) {
      case 'running': return 'running';
      case 'complete': return 'completed';
      case 'incomplete': return status.reason === 'error' ? 'error' : 'completed';
      case 'requires-action': return 'running';
      default: return 'running';
    }
  };

  return (
    <ToolCallDisplay
      toolCallId={toolCallId}
      toolName={toolName}
      args={args}
      state={getState()}
      result={result}
      isError={status.type === 'incomplete' && status.reason === 'error'}
    />
  );
};
```

## Rozszerzanie

### Dodawanie nowego typu toola

1. Dodaj typ do `ToolType` w `shared.tsx`
2. Dodaj ikone i kolory do `toolIcons` i `toolColors`
3. Stworz nowy komponent `NewToolDisplay.tsx`
4. Dodaj type guard w `ToolCallDisplay.tsx`
5. Dodaj case do switcha w routerze
6. Wyeksportuj z `index.ts`

### Customowe wyswietlanie parametrow

Rozszerz `ParamsDisplay` lub stworz dedykowany komponent dla specyficznych parametrow.

## Migracja ze starego ToolCallDisplay

Stary komponent `ToolCallDisplay.tsx` w katalogu `chat/` moze zostac usuniety. Nowa wersja jest w `chat/tool-displays/` i eksportowana przez `index.ts`.

Importy automatycznie dzialaja przez:
```tsx
import { ToolCallDisplay } from './tool-displays';
```
