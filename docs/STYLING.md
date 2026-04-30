# STYLING.md — Dashboard

## Approach
All styling uses **CSS Modules**. Every component has a co-located `.module.css` file with the same name. No inline styles. No global class names inside components (except for the global reset and design tokens).

---

## File Locations
- `src/styles/global.css` — CSS reset, base HTML element styles, font imports
- `src/styles/tokens.css` — Design tokens as CSS custom properties (imported once in `main.jsx`)
- Each component: `ComponentName.module.css` co-located with `ComponentName.jsx`

---

## Design Tokens

### Colors
```css
:root {
  /* Backgrounds */
  --color-bg:        #0d0f12;
  --color-bg-2:      #13161b;
  --color-bg-3:      #1a1e25;
  --color-bg-4:      #21262f;

  /* Borders */
  --color-border:    rgba(255, 255, 255, 0.07);
  --color-border-2:  rgba(255, 255, 255, 0.12);

  /* Text */
  --color-text:      #e8eaf0;
  --color-text-2:    #8b909e;
  --color-text-3:    #555b6a;

  /* Accents */
  --color-accent:    #4f8ef7;
  --color-accent-2:  #7c5ce8;

  /* Semantic */
  --color-green:     #3dd68c;
  --color-red:       #f05a5a;
  --color-amber:     #f5a623;
  --color-teal:      #2dd4bf;
}
```

### Typography
```css
:root {
  --font-sans: 'Syne', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
```

### Spacing
Use consistent spacing values. Prefer `rem` for layout spacing, `px` for component-internal gaps.
```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
}
```

### Border Radius
```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
}
```

---

## Typography Rules
- **Display / headings**: `font-family: var(--font-sans)` — Syne
- **Body text**: `font-family: var(--font-sans)` — Syne
- **Monospace / data / numbers / timestamps**: `font-family: var(--font-mono)` — DM Mono
- Use DM Mono for: prices, tickers, scores, times, dates, tags, stat values
- Use Syne for: headings, labels, body copy, buttons, nav

### Type Scale
```css
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;
```

---

## Component Conventions

### Cards
```css
.card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  transition: border-color 0.15s;
}

.card:hover {
  border-color: var(--color-border-2);
}
```

### Buttons
```css
.btnPrimary {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-accent);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity 0.15s;
}

.btnGhost {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  background: transparent;
  color: var(--color-text-3);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.15s;
}
```

### Form Inputs
```css
.input {
  background: var(--color-bg-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text);
  outline: none;
  width: 100%;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--color-accent);
}
```

### Section Labels
Small all-caps monospace labels used above sections:
```css
.sectionLabel {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## Privacy Mode (Stocks Tab)
When privacy mode is active, sensitive values are replaced with `••••` in the JSX — not hidden with CSS. This ensures screen readers and inspectors don't expose the values either.

```jsx
<span>{privacyMode ? '••••' : `$${value.toFixed(2)}`}</span>
```

---

## General Rules
- Dark mode only — no light mode toggle
- No inline styles — ever
- No global class names inside component files
- All colors must use CSS custom properties — no hardcoded hex values inside component CSS Modules
- Transitions on interactive elements: `0.15s ease` for color/border, `0.12s ease` for background
