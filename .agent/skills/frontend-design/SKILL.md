---
name: frontend-design
version: 1.0.0
description: "Diseño de UI/UX para proyectos generados por LuxCode AI. Aplica cuando el usuario pide mejorar UI, diseñar componentes, revisar accesibilidad, tipografía, color, layout o sistemas de diseño."
source: "built-in (jwynia/agent-skills no contiene este skill — construido desde cero)"
triggers:
  - /frontend-design
  - /ui-review
  - review UI
  - improve design
  - mejorar diseño
  - revisar UI
  - accesibilidad
  - color palette
  - tipografía
  - layout
author: luisitoys12
license: MIT
---

# 🎨 Frontend Design Skill — LuxCode AI

## Principios fundamentales

> **Claridad > Decoración. Consistencia > Creatividad puntual. Accesibilidad = requerimiento, no extra.**

---

## Sistema de diseño base (para proyectos generados)

### Tokens CSS obligatorios

```css
:root {
  /* Color */
  --color-primary:     #7c3aed;   /* Violeta LuxCode */
  --color-primary-hover: #6d28d9;
  --color-accent:      #3b82f6;   /* Azul */
  --color-success:     #059669;
  --color-warning:     #d97706;
  --color-danger:      #dc2626;
  --color-surface:     #0f0f0f;
  --color-surface-2:   #1a1a1a;
  --color-border:      #ffffff12;
  --color-text:        #f1f5f9;
  --color-text-muted:  rgba(241,245,249,.5);

  /* Tipografía */
  --font-sans:  'Inter', system-ui, sans-serif;
  --font-mono:  'Fira Code', 'JetBrains Mono', monospace;
  --text-xs:    0.75rem;   /* 12px */
  --text-sm:    0.875rem;  /* 14px */
  --text-base:  1rem;      /* 16px */
  --text-lg:    1.125rem;
  --text-xl:    1.25rem;
  --text-2xl:   1.5rem;
  --text-3xl:   1.875rem;

  /* Espaciado (escala 4px) */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;
  --space-4: 16px; --space-6: 24px;  --space-8: 32px;
  --space-12: 48px; --space-16: 64px;

  /* Radios */
  --radius-sm: 4px;  --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm:  0 1px 3px rgba(0,0,0,.4);
  --shadow-md:  0 4px 16px rgba(0,0,0,.5);
  --shadow-glow: 0 0 20px rgba(124,58,237,.3);

  /* Transiciones */
  --transition-fast:   100ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   400ms ease;
}
```

---

## Reglas de Tipografía

| Regla | Descripción |
|---|---|
| **TY-01** | Máximo 2 familias tipográficas: una sans-serif (UI) y una monospace (código) |
| **TY-02** | Escala de tamaños basada en los tokens, nunca valores arbitrarios |
| **TY-03** | `line-height: 1.5` mínimo para cuerpo de texto; `1.2` para headings |
| **TY-04** | Contraste de texto: mínimo 4.5:1 (WCAG AA) para texto normal, 3:1 para grande |
| **TY-05** | No usar `font-weight < 400` para texto pequeño (< 14px) |

---

## Reglas de Color

| Regla | Descripción |
|---|---|
| **CO-01** | Usar tokens `--color-*`, nunca valores hex directos en componentes |
| **CO-02** | Estados interactivos: hover +10% luminosidad, active -10%, disabled opacity 0.45 |
| **CO-03** | No transmitir información solo por color (añadir icono o texto) |
| **CO-04** | Fondo de página más oscuro que superficie de cards |
| **CO-05** | Gradientes: máximo 2 colores, misma familia de tono |

---

## Reglas de Layout

| Regla | Descripción |
|---|---|
| **LA-01** | Sistema de grid: 12 columnas desktop, 4 columnas mobile |
| **LA-02** | Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` |
| **LA-03** | Espaciado interno de componentes: múltiplos de 4px |
| **LA-04** | Max-width de contenido principal: `1280px` centrado |
| **LA-05** | Mobile-first: empezar con layout de columna única, expandir con media queries |
| **LA-06** | Nunca usar `px` fijos para anchuras en layout (usar `%`, `fr`, `clamp()`) |

---

## Reglas de Componentes

| Regla | Descripción |
|---|---|
| **CM-01** | Botón primario: fondo `--color-primary`, hover `brightness(1.15)` |
| **CM-02** | Botón deshabilitado: `opacity: 0.45`, `cursor: not-allowed`, `pointer-events: none` |
| **CM-03** | Inputs: borde 1px `--color-border`, focus `outline: 2px solid --color-primary` |
| **CM-04** | Cards: fondo `--color-surface-2`, borde `--color-border`, radio `--radius-lg` |
| **CM-05** | Badges/chips: padding `2px 8px`, radio `--radius-full`, `font-size: var(--text-xs)` |
| **CM-06** | Loading: skeleton shimmer con `@keyframes`, no solo spinner |
| **CM-07** | Tooltips: `z-index: 50`, `max-width: 200px`, flecha CSS |

---

## Accesibilidad (a11y)

| Regla | Descripción |
|---|---|
| **A11Y-01** | Todo elemento interactivo tiene `focus-visible` visible (no `outline: none` sin reemplazo) |
| **A11Y-02** | Imágenes decorativas: `alt=""`. Imágenes informativas: alt descriptivo |
| **A11Y-03** | Iconos sin texto: `aria-label` obligatorio |
| **A11Y-04** | Formularios: `<label>` vinculado a cada input con `for/id` |
| **A11Y-05** | `@media (prefers-reduced-motion: reduce)` en todas las animaciones |
| **A11Y-06** | Roles ARIA en regiones: `<main>`, `<nav>`, `<header>`, `<footer>` |
| **A11Y-07** | `aria-live="polite"` en mensajes dinámicos (errores, éxito, loading) |

---

## Animaciones

```css
/* ✅ Correcto: transform + opacity (GPU accelerated) */
.card { transition: transform var(--transition-base), opacity var(--transition-base); }
.card:hover { transform: translateY(-2px); }

/* ❌ Incorrecto: animar width/height/top/left (causa reflow) */
.card:hover { width: 105%; } /* NUNCA */

/* Siempre respetar prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Checklist de revisión

- [ ] Tokens CSS usados (no valores hardcoded)
- [ ] Contraste WCAG AA verificado
- [ ] Mobile-first responsive
- [ ] Focus visible en todos los interactivos
- [ ] aria-labels en iconos
- [ ] prefers-reduced-motion respetado
- [ ] Skeleton loader en estados de carga
- [ ] Estados hover/active/disabled en botones
- [ ] Animaciones solo con transform+opacity
