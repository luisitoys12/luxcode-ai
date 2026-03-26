# 🎨 NextjsDemo — Componente de referencia LuxCode AI

Este directorio es el **template base** que LuxCode AI usa cuando genera proyectos Next.js.
Demuestra todos los patrones del skill `react-nextjs` de [maroffo/claude-forge](https://github.com/maroffo/claude-forge/tree/main/skills/react-nextjs).

## Archivos

| Archivo | Tipo | Patrón demostrado |
|---|---|---|
| `ProvidersPage.tsx` | **Server Component** | `'use cache'`, `next/image priority`, `dynamic()`, `Suspense` |
| `ProviderForm.tsx` | **Client Component** | `useActionState`, `useFormStatus`, `useOptimistic`, `aria-live` |

## Patrones del skill `/react-nextjs` demostrados

- ✅ Server Component por default (`ProvidersPage.tsx`)
- ✅ Client Component solo donde hay interactividad (`'use client'` en `ProviderForm.tsx`)
- ✅ Server Action con `useActionState` + `useFormStatus` (botón pending)
- ✅ `useOptimistic` — UI actualiza antes de que el server responda
- ✅ `'use cache'` + `cacheLife` de Next.js 16
- ✅ `next/image` con `priority` en imagen above-the-fold
- ✅ `dynamic()` con skeleton de carga
- ✅ `Suspense` con fallback
- ✅ `aria-live` en mensajes de feedback
- ✅ Sin `any`, sin `'use client'` innecesario

## Uso

```bash
# En un proyecto Next.js generado por LuxCode:
cp -r src/components/NextjsDemo/ mi-proyecto/src/components/
```
