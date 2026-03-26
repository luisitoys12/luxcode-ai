# Agent Skills — LuxCode AI

Esta carpeta contiene los **agent skills** instalados en el proyecto.

## Skills instalados

| # | Skill | Trigger | Fuente | Descripción |
|---|---|---|---|---|
| 1 | `web-interface-guidelines` | `/web-interface-guidelines` | Vercel Labs | Audita UI: aria, CSP, animaciones, focus, formularios |
| 2 | `security-best-practices` | `/security-best-practices` | luisitoys12 | Audita seguridad: API keys, XSS, fetch, filesystem, CI/CD |
| 3 | `react-nextjs` | `/react-nextjs` | maroffo/claude-forge | React 19 + Next.js 16: App Router, Server Components, forms, testing |

---

## Cómo usar un skill

En cualquier agente compatible (Copilot, Claude Code, Cursor, Cline, Kilo.ai):

```bash
# Auditar UI
/web-interface-guidelines src/panels/LuxCodePanel.ts

# Auditar seguridad
/security-best-practices src/services/AIService.ts

# Revisar/generar código React/Next.js
/react-nextjs src/components/MyComponent.tsx

# Correr auditoría de seguridad desde terminal
bash .agent/skills/security-best-practices/audit.sh
```

## Agregar un skill nuevo

```bash
npx skills add https://github.com/<owner>/<repo> --skill <nombre>
```

O manualmente:
1. Crear carpeta `.agent/skills/<nombre>/`
2. Agregar `SKILL.md` con el frontmatter estándar
3. Agregar el skill a este README
4. Referenciar en `AGENTS.md` → sección Skills instalados

---

## Fuentes

- [maroffo/claude-forge](https://github.com/maroffo/claude-forge) — react-nextjs, golang, python, rails, terraform y más
- [Vercel Web Interface Guidelines](https://vercel.com/design/interface-guidelines)
