---
name: fix-errors
source: microsoft/vscode .github/skills/fix-errors
description: Guidelines for fixing unhandled errors. Use when investigating errors with stack traces. Covers tracing data flow through call stacks, identifying producers of invalid data vs consumers that crash, enriching error messages, and avoiding anti-patterns like silently swallowing errors.
---

## Regla única más importante

**NO arregles en el crash site.** El error aparece en una línea del stack trace pero el fix casi nunca va ahí. Agregar un `typeof` guard, un try/catch o un valor fallback solo enmascara el problema — el dato inválido sigue fluyendo.

## Workflow de diagnóstico

### 1. Lee el stack trace de abajo hacia arriba
Cada frame te dice:
- Qué dato se pasa y qué se espera
- De dónde vino ese dato (IPC, API, storage, input de usuario)
- Si el dato pudo corromperse en ese punto

Busca el **productor del dato inválido**, no el consumidor que crashea.

### 2. Productor no identificable en el stack
Cuando el stack solo muestra el lado receptor (ej: handler IPC), el lado que envía está en otro proceso.

- **Enriquece el mensaje de error** con contexto diagnóstico: tipo del dato inválido, valor truncado, operación que lo recibió
- **NO tragues el error silenciosamente** — deja que siga lanzando para que sea visible
- Agrega el enriquecimiento en la función de validación de bajo nivel para capturarlo siempre

```typescript
// ✅ Enriquecer — no silenciar
throw new Error(`[Channel] URI inválida en '${context}': type=${typeof data}, value=${String(data).substring(0, 100)}`);
```

### 3. Productor identificable
Fixea directo en el productor:
- Valida/sanitiza antes de enviar por IPC / guardar / pasar a APIs
- Asegúrate que serialization/deserialization preserve tipos (URI objects → UriComponents, no strings)

## Antes de proponer cualquier fix

Siempre **lee el código que construye el error**. Busca el class name o substring único del mensaje. El código de construcción revela:
- Qué condiciones lo disparan
- Qué clasificaciones o categorías tiene el error
- Qué significan sus parámetros
- Si es accionable o un warning de threshold

## Aplicado a LuxCode AI CI

Cuando un workflow falla:

| Error observado | Productor real | Fix correcto |
|---|---|---|
| `TS6059 rootDir` | `tsconfig.json` sin `include` explícito | Agregar `"include": ["src/**/*.ts"]` |
| `unknown option --allow-missing-publisher` | Flag inexistente en `@vscode/vsce v2.x` | Eliminar el flag |
| `lock file not found` en setup-node | `package-lock.json` vacío con `cache: npm` | Quitar `cache: npm` hasta tener lock real |
| `npm install -g vsce` falla | Permisos globales en ubuntu-latest | Usar `npx @vscode/vsce` |
| `Cannot find module 'vscode'` en vitest | Import real de vscode en entorno Node | Alias `vscode → src/__mocks__/vscode.ts` |

## Guidelines

- Preferir enriquecer mensajes de error sobre agregar try/catch guards
- Truncar valores controlados por usuario en mensajes de error (privacidad + límite de tamaño)
- No cambiar comportamiento de funciones utilitarias compartidas — fijar en el call site o productor
- Correr tests relevantes después de cada cambio
- Verificar compilación antes de declarar el trabajo completo
