---
name: fix-ci-failures
source: microsoft/vscode .github/skills/fix-ci-failures
description: Investigar y arreglar CI failures. Cubre encontrar el PR, identificar checks fallidos, descargar logs, extraer la causa, e iterar en el fix.
---

## Workflow de CI failures

### Paso 1: Identificar el error exacto

Siempre busca `##[error]` en el log — es la anotación exacta de GitHub Actions donde falló el step:

```bash
grep -n '##\[error\]' ci-job-log.txt
```

### Paso 2: Clasificar el tipo de fallo

| Tipo | Indicadores | Acción |
|---|---|---|
| **Build/Compile** | `error TS`, `exit code 2` | Fix en tsconfig o fuente |
| **Test** | `AssertionError`, `FAIL`, `exit code 1` | Fix en tests o implementación |
| **Package** | `unknown option`, `error:` en vsce | Fix en comando de packaging |
| **Infra** | `ETIMEDOUT`, `ECONNRESET`, `npm ERR! network` | Re-run, no tocar código |
| **Permisos** | `npm install -g` falla, `EACCES` | Usar `npx` en lugar de global install |

### Paso 3: Reglas de oro para workflows de VS Code extensions

```yaml
# ✅ CORRECTO — patrones validados
- run: npm install              # NO npm ci si lock está vacío
- run: npx tsc -p ./            # NO npm install -g typescript
- run: npx @vscode/vsce package --no-dependencies  # NO --allow-missing-publisher
- uses: actions/setup-node@v4
  with:
    node-version: '20'          # SIN cache: npm si lock está vacío

# ❌ INCORRECTO — causa fallos comunes
- run: npm install -g typescript @vscode/vsce  # EACCES en ubuntu-latest
- run: vsce package             # vsce global no existe como comando
- run: npx @vscode/vsce package --allow-missing-publisher  # flag inexistente
- cache: 'npm'                  # falla si package-lock.json no tiene árbol completo
```

### Paso 4: Iterar

1. Fix el archivo correcto (productor, no consumidor)
2. Push el commit
3. Volver a ejecutar el workflow
4. Si el mismo error persiste → el runner usó un commit anterior (espera el checkout del nuevo commit)
5. Si aparece un error nuevo → es progreso, diagnosticar con el mismo proceso

### Paso 5: Verificar que el fix no rompió nada más

```bash
# Flags válidos de @vscode/vsce package
npx @vscode/vsce package --help
# Opciones comunes: --no-dependencies, --out <file>, --pre-release
# NO existen: --allow-missing-publisher, --skip-license

# tsconfig.json anti-TS6059
# Siempre incluir "include": ["src/**/*.ts"] cuando rootDir sea src/
```

## Infraestructura vs. Código

Antes de tocar código, verifica si el fallo es de infraestructura:
- **Re-run primero** si ves: `ETIMEDOUT`, `502`, `No space left on device`, `runner shutdown`
- **No re-run** si ves: `error TS`, `exit code 2`, `unknown option`, `AssertionError` — esos son bugs reales
