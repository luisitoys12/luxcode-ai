# Agent Skills — LuxCode AI

Esta carpeta contiene los **agent skills** instalados en el proyecto,
siguiendo el estándar de [vercel-labs/skills](https://github.com/vercel-labs/skills).

## Skills instalados

| Skill | Trigger | Descripción |
|---|---|---|
| `web-interface-guidelines` | `/web-interface-guidelines` | Audita UI contra las Vercel Web Interface Guidelines |
| `security-best-practices` | `/security-best-practices` | Audita seguridad: API keys, CSP, XSS, fetch, filesystem, CI/CD |

## Cómo usar un skill

En cualquier agente compatible (Copilot, Claude Code, Cursor, Cline, Kilo.ai):

```bash
# Auditar UI
/web-interface-guidelines src/panels/LuxCodePanel.ts

# Auditar seguridad
/security-best-practices src/services/AIService.ts

# Correr auditoría automática desde terminal
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
