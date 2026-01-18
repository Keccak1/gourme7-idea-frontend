# Plan Upiększenia UI Chatu - Gourmet7

## Podsumowanie Analizy

### Obecny Stan
- **Komponenty:** MessageBubble (User/Assistant), ChatComposer, 5 tool displays (Read, Write, Memory, Schedule, Skill)
- **Animacje:** Podstawowe Tailwind (spin, pulse, bounce, ping)
- **Style:** shadcn/ui design system, dark mode support
- **Streaming:** SSE z 8 typami eventów (text_delta, tool_call, tool_result, etc.)

### Biblioteki
- `@assistant-ui/react` v0.11.53 - primitives do wiadomości
- `@assistant-ui/react-ui` v0.2.1 - gotowe komponenty
- `lucide-react` - ikony
- `tailwindcss` v4.1 - style

---

## Plan Upiększenia

### 1. Animacje Wiadomości (Priorytet: WYSOKI)

#### 1.1 Fade-in/Slide-in dla nowych wiadomości
**Opis:** Nowe wiadomości pojawiają się z płynną animacją zamiast natychmiastowo.

```css
@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.message-enter {
  animation: message-appear 0.3s ease-out;
}
```

**Pliki do zmiany:** `MessageBubble.tsx`, `index.css`

#### 1.2 Lepszy Typing Indicator
**Opis:** Zamiast "Thinking..." + spinner, animowane kropki lub "wave" effect.

**Opcje:**
- A) Trzy animowane kropki (ChatGPT style)
- B) Pulsujący gradient (bardziej nowoczesne)
- C) Skeleton loader (placeholder text)

**Decyzja wymagana:** Która opcja?

#### 1.3 Streaming Text Animation
**Opis:** Każdy nowy token pojawia się z subtle fade-in zamiast instant appear.

---

### 2. Redesign Avatarów (Priorytet: ŚREDNI)

#### 2.1 User Avatar
**Obecny:** Niebieskie kółko z ikoną User
**Propozycje:**
- Gradient background (np. blue→purple)
- Inicjały użytkownika zamiast ikony
- Ring/glow effect

#### 2.2 Assistant Avatar
**Obecny:** Szare kółko z ikoną Bot
**Propozycje:**
- Animated gradient podczas streamingu
- Logo Gourmet7 zamiast generycznej ikony Bot
- Pulsujący efekt podczas "thinking"

---

### 3. Tool Call Cards - Visual Upgrade (Priorytet: WYSOKI)

#### 3.1 State Transitions
**Obecne:** Instant switch między stanami
**Propozycja:** Smooth transitions z CSS animations

```css
.tool-card {
  transition: all 0.3s ease;
}
.tool-card-pending { opacity: 0.7; }
.tool-card-running {
  box-shadow: 0 0 0 2px var(--tool-color);
  animation: tool-glow 1.5s infinite;
}
.tool-card-completed {
  opacity: 1;
  border-left: 3px solid var(--success-color);
}
```

#### 3.2 Progress Indicators
**Dla stanów running:**
- Animated progress bar na górze karty
- Lub pulsujący border

#### 3.3 Collapsible Animations
**Obecne:** Instant show/hide
**Propozycja:** Smooth height animation (Radix Collapsible wspiera to)

#### 3.4 Rich Result Displays
**Pomysł:** Integracja `@assistant-ui/tool-ui` komponentów:
- `DataTable` dla wyników z danymi strukturalnymi (np. portfolio)
- `MediaCard` dla wyników z obrazkami/linkami
- `Chart` dla danych liczbowych

**Decyzja wymagana:** Czy dodać tool-ui jako dependency?

---

### 4. Composer Upgrade (Priorytet: ŚREDNI)

#### 4.1 Focus Animation
**Obecne:** Ring na focus
**Propozycja:** Subtle glow + border color transition

#### 4.2 Send Button Animation
**Pomysły:**
- Ripple effect na klik
- Icon morphing (Send → Check → Send)
- Bounce po wysłaniu

#### 4.3 Character Counter (opcjonalne)
**Opis:** Pokazuje liczbę znaków, fade-in gdy > 100

---

### 5. Micro-interactions (Priorytet: NISKI)

#### 5.1 Copy Button Feedback
**Obecne:** Ikona zmienia się na Check
**Propozycja:** + Toast notification "Copied!" lub subtle scale animation

#### 5.2 Hover Effects
- Message hover: subtle background change
- Tool card hover: slight elevation (shadow)
- Links: underline animation

#### 5.3 Button Press Effects
- Scale down on press (0.95)
- Color shift

---

### 6. Kolorystyka i Theming (Priorytet: ŚREDNI)

#### 6.1 Gradient Backgrounds
**Propozycja dla wiadomości asystenta:**
```css
.assistant-message {
  background: linear-gradient(135deg, var(--secondary) 0%, transparent 100%);
}
```

#### 6.2 Tool Colors Refinement
**Obecne kolory są OK, ale można dodać:**
- Subtle gradient zamiast flat color
- Glow effect dla running state

#### 6.3 Dark Mode Polish
- Sprawdzić kontrast
- Dodać subtle glow effects które wyglądają dobrze na ciemnym tle

---

### 7. Welcome Screen (Priorytet: NISKI)

#### 7.1 Animated Logo/Icon
**Obecne:** Statyczna ikona MessageSquare
**Propozycja:** Animated icon lub logo z subtle animation

#### 7.2 Suggestion Chips Animation
**Propozycja:** Staggered fade-in (każdy chip pojawia się z opóźnieniem)

---

### 8. Connection Indicator (Priorytet: NISKI)

#### 8.1 Smoother Transitions
**Między stanami:** connected → connecting → disconnected

#### 8.2 Position Options
**Obecne:** Pod headerem
**Alternatywa:** Floating badge lub toast-style

---

## Decyzje (PODJĘTE)

1. **Typing Indicator Style:**
   - [x] A) Trzy animowane kropki (ChatGPT style)

2. **Tool-UI Integration:**
   - [x] Tak - dodać `@assistant-ui/tool-ui` dla rich displays

3. **Animation Intensity:**
   - [x] B) Umiarkowane - większość interakcji, profesjonalny look

---

## Proponowana Kolejność Implementacji

### Faza 1 - Quick Wins (1-2h)
1. Message appear animation (fade-in/slide)
2. Better typing indicator
3. Tool card state transitions

### Faza 2 - Visual Polish (2-3h)
4. Avatar redesign
5. Composer focus/send animations
6. Collapsible smooth animations

### Faza 3 - Rich Features (3-4h)
7. Tool-UI integration (jeśli zdecydowane)
8. Progress indicators
9. Micro-interactions

### Faza 4 - Final Touches (1-2h)
10. Dark mode polish
11. Welcome screen animations
12. Connection indicator refinement

---

## Pliki Do Zmiany

| Plik | Zmiany |
|------|--------|
| `index.css` | Custom keyframes, animacje |
| `MessageBubble.tsx` | Avatary, message animations |
| `ChatComposer.tsx` | Focus/send animations |
| `tool-displays/shared.tsx` | ToolCard animations, state transitions |
| `tool-displays/*.tsx` | Specific tool improvements |
| `ChatThread.tsx` | Message list animations |

---

## Przykładowe Animacje CSS

```css
/* Message appear */
@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Typing dots */
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

/* Tool card glow */
@keyframes tool-glow {
  0%, 100% { box-shadow: 0 0 5px var(--tool-color); }
  50% { box-shadow: 0 0 15px var(--tool-color); }
}

/* Pulse ring */
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}
```

---

**Utworzono:** 2026-01-16
**Status:** Oczekuje na decyzje
