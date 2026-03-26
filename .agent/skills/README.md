# Agent Skills — LuxCode AI

Esta carpeta contiene los **agent skills** instalados en el proyecto.

## Skills instalados

| # | Skill | Trigger | Fuente | Aplica a |
|---|---|---|---|---|
| 1 | `web-interface-guidelines` | `/web-interface-guidelines` | Vercel Labs | Paneles WebView de VS Code |
| 2 | `security-best-practices` | `/security-best-practices` | luisitoys12 | Todos los archivos del proyecto |
| 3 | `react-nextjs` | `/react-nextjs` | [maroffo/claude-forge](https://github.com/maroffo/claude-forge) | Proyectos Next.js generados |
| 4 | `frontend-design` | `/frontend-design` | luisitoys12 | UI/UX de proyectos generados |
| 5 | `backend-testing` | `/backend-testing` | luisitoys12 | APIs y servicios generados |

---

## Cómo usar los skills

```bash
# Auditar WebView UI
/web-interface-guidelines src/panels/LuxCodePanel.ts

# Auditar seguridad
/security-best-practices src/services/AIService.ts

# Revisar/generar código React Next.js
/react-nextjs src/components/NextjsDemo/ProviderForm.tsx

# Auditar diseño UI
/frontend-design src/components/NextjsDemo/ProvidersPage.tsx

# Auditar tests de backend
/backend-testing src/services/AIService.ts

# Auditoría de seguridad automática
bash .agent/skills/security-best-practices/audit.sh
```

---

## Qué hacen los skills en `buildPrompt()` (Opción C)

Cuando LuxCode genera un proyecto, inyecta automáticamente las reglas del skill correspondiente:

| Tipo de proyecto | Skills inyectados al prompt |
|---|---|
| Web + Next/React | `react-nextjs` + `frontend-design` |
| Web genérico | `frontend-design` |
| API / Backend | `backend-testing` |

---

## Agregar un skill nuevo

```bash
npx skills add https://github.com/<owner>/<repo> --skill <nombre>
```

O manualmente:
1. Crear carpeta `.agent/skills/<nombre>/`
2. Agregar `SKILL.md` con el frontmatter estándar
3. Agregar el skill a este README
4. Referenciar en `AGENTS.md` → sección Skills

---

## Fuentes

- [maroffo/claude-forge](https://github.com/maroffo/claude-forge) — react-nextjs, golang, python, rails, terraform y más
- [Vercel Web Interface Guidelines](https://vercel.com/design/interface-guidelines)
- [jwynia/agent-skills](https://github.com/jwynia/agent-skills) — architecture, workflow, creative, education
