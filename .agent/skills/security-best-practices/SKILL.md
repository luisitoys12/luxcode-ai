---
name: security-best-practices
version: 1.0.0
description: Audita el código de LuxCode AI contra las mejores prácticas de seguridad para extensiones VS Code, APIs de IA, manejo de API keys y WebViews. Úsalo cuando el usuario pida revisar seguridad, secrets, XSS, CSP o inputs.
triggers:
  - /security-best-practices
  - /security
  - review security
  - audit security
  - check for vulnerabilities
  - revisar seguridad
  - auditar seguridad
  - buscar vulnerabilidades
  - check API key handling
  - review CSP
author: luisitoys12
license: MIT
source: https://github.com/luisitoys12/luxcode-ai
---

# 🛡️ Security Best Practices — LuxCode AI Skill

## Contexto del proyecto

LuxCode AI maneja:
- **API Keys** de 6 proveedores (Gemini, OpenAI, Groq, OpenRouter, Ollama, LM Studio)
- **WebView** con scripts habilitados dentro de VS Code
- **fetch()** directo a APIs externas desde la extensión
- **Escritura de archivos** en el filesystem del usuario
- **GitHub Actions** con secrets sensibles

---

## Reglas de seguridad aplicadas en la auditoría

### 🔑 API Keys & Secrets

| Regla | Descripción |
|---|---|
| **SK-01** | Nunca loguear API keys con `console.log` o `vscode.window.showInformationMessage` |
| **SK-02** | Almacenar API keys en `vscode.workspace.getConfiguration()`, nunca en variables globales |
| **SK-03** | No incluir API keys en mensajes de error que el usuario vea |
| **SK-04** | En GitHub Actions: usar `${{ secrets.X }}` nunca strings hardcodeados |
| **SK-05** | El `package-lock.json` debe existir y estar commiteado |

### 🌐 WebView / CSP

| Regla | Descripción |
|---|---|
| **WV-01** | Toda WebView debe tener `Content-Security-Policy` en el `<meta>` del HTML |
| **WV-02** | No usar `innerHTML` con datos del usuario — riesgo de XSS |
| **WV-03** | Sanitizar cualquier string antes de insertarlo en el DOM |
| **WV-04** | No usar `eval()` ni `new Function()` en scripts de WebView |
| **WV-05** | Scripts externos: usar nonces generados por VS Code (`webview.cspSource`) |
| **WV-06** | No pasar datos sensibles (API keys) al WebView via `postMessage` |

### 🌍 Fetch / HTTP

| Regla | Descripción |
|---|---|
| **FE-01** | Siempre verificar `res.ok` antes de parsear la respuesta |
| **FE-02** | Nunca incluir la API key en la URL — siempre en headers `Authorization` |
| **FE-03** | Manejar errores de red con `try/catch` — no exponer stack traces al usuario |
| **FE-04** | Timeout en fetch para evitar cuelgues indefinidos |
| **FE-05** | No hacer fetch a URLs construidas con input del usuario sin validación |

### 📁 FileSystem

| Regla | Descripción |
|---|---|
| **FS-01** | Nunca escribir fuera del workspace del usuario sin confirmación |
| **FS-02** | Sanitizar nombres de archivo generados por IA antes de usarlos en rutas |
| **FS-03** | No usar `path.join` con strings de API sin escapar |
| **FS-04** | Evitar `..` en rutas generadas dinámicamente (path traversal) |

### 🔐 GitHub Actions

| Regla | Descripción |
|---|---|
| **GA-01** | Todos los secrets deben estar en `${{ secrets.X }}`, nunca en `env:` como strings |
| **GA-02** | Usar `permissions: contents: write` solo en los jobs que lo necesiten |
| **GA-03** | No imprimir secrets en `echo` o `run:` steps |
| **GA-04** | Usar versiones exactas de actions (`@v4`, no `@latest`) |
| **GA-05** | El token de GitHub no debe tener más permisos de los necesarios |

---

## Formato de reporte

```
archivo:línea — [CÓDIGO-REGLA] descripción del problema
  → Sugerencia de corrección
  → Severidad: CRÍTICA | ALTA | MEDIA | BAJA
```

## Ejemplo de uso

```
/security-best-practices src/services/AIService.ts
```

Resultado esperado:
```
AIService.ts:48 — [FE-01] fetch sin verificar res.ok antes de parsear
  → Agregar: if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message) }
  → Severidad: ALTA

AIService.ts:62 — [FE-04] fetch sin timeout — puede colgar indefinidamente
  → Usar AbortController con setTimeout de 30s
  → Severidad: MEDIA
```
