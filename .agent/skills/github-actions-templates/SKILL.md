---
name: github-actions-templates
description: Create production-ready GitHub Actions workflows for automated testing, building, and deploying applications. Use when setting up CI/CD with GitHub Actions, automating development workflows, or creating reusable workflow templates. Source: wshobson/agents cicd-automation plugin.
---

# GitHub Actions Templates

Production-ready GitHub Actions workflow patterns for testing, building, and deploying applications.
Adaptado para LuxCode AI — extensión VS Code con TypeScript, vitest, vsce y GitHub Pages.

## Reglas críticas para LuxCode AI [GA]

| ID | Regla | Obligatorio |
|----|-------|------------|
| GA-01 | `actions/checkout@v4` siempre — nunca @v3 o @latest | ✅ |
| GA-02 | `actions/setup-node@v4` con `cache: 'npm'` en TODOS los jobs | ✅ |
| GA-03 | `npm ci` nunca `npm install` en CI | ✅ |
| GA-04 | `npx @vscode/vsce` nunca `npm install -g vsce` | ✅ |
| GA-05 | Job `test-gate` con `needs:` antes de build/release/publish | ✅ |
| GA-06 | `permissions: contents: write` solo donde se crea release/tag | ✅ |
| GA-07 | Secrets verificados con `exit 1` antes de usarlos | ✅ |
| GA-08 | Versión semver validada con regex antes de `npm version` | ✅ |
| GA-09 | CHANGELOG dinámico con `awk` en releases | ✅ |
| GA-10 | `GITHUB_STEP_SUMMARY` en cada job crítico | ✅ |

## Pattern 1: Test Workflow (LuxCode AI)

```yaml
name: ⚙️ CI — Build, Test & Coverage
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm test                    # vitest run
      - run: npm run test:coverage       # vitest run --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/, retention-days: 7 }
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run compile
      - run: npx @vscode/vsce package --no-dependencies --allow-missing-publisher
      - uses: actions/upload-artifact@v4
        with: { name: vsix, path: '*.vsix', retention-days: 3 }
```

## Pattern 2: Auto-Tag desde package.json

```yaml
name: 🏷️ Auto-Tag & Release
on:
  push:
    branches: [main]
    paths: ['package.json', 'CHANGELOG.md']
permissions:
  contents: write
jobs:
  auto-tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0, token: '${{ secrets.GITHUB_TOKEN }}' }
      - id: pkg
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "VERSION=v${VERSION}" >> $GITHUB_OUTPUT
      - id: check
        run: |
          git ls-remote --tags origin | grep -q "${{ steps.pkg.outputs.VERSION }}$" \
            && echo "EXISTS=true" >> $GITHUB_OUTPUT \
            || echo "EXISTS=false" >> $GITHUB_OUTPUT
      - if: steps.check.outputs.EXISTS == 'false'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag -a ${{ steps.pkg.outputs.VERSION }} -m "Auto-tagged by CI"
          git push origin ${{ steps.pkg.outputs.VERSION }}
```

## Pattern 3: GitHub Release con CHANGELOG dinámico

```yaml
- name: Extract CHANGELOG
  id: changelog
  run: |
    VERSION_PLAIN="${VERSION#v}"
    NOTES=$(awk "/^## \\[${VERSION_PLAIN}\\]/{flag=1; next} /^## \\[/{flag=0} flag" CHANGELOG.md | head -40)
    echo "NOTES<<EOF" >> $GITHUB_OUTPUT
    echo "$NOTES" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- uses: softprops/action-gh-release@v2
  with:
    tag_name: ${{ steps.version.outputs.VERSION }}
    body: |
      ${{ steps.changelog.outputs.NOTES }}
    files: '*.vsix'
```

## Pattern 4: GitHub Pages con versión auto-inyectada

```yaml
name: 🌐 Deploy GitHub Pages
on:
  push:
    branches: [main]
    paths: ['docs/**']
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          VERSION=$(node -p "require('./package.json').version")
          sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v${VERSION}/g" docs/index.html
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: 'docs' }
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Pattern 5: Security Scanning

```yaml
- name: npm audit
  run: npm audit --audit-level=high
- name: Trivy scan
  uses: aquasecurity/trivy-action@master
  with: { scan-type: 'fs', format: 'sarif', output: 'trivy.sarif' }
- uses: github/codeql-action/upload-sarif@v2
  with: { sarif_file: 'trivy.sarif' }
```

## Pattern 6: Reusable test workflow

```yaml
# .github/workflows/reusable-test.yml
on:
  workflow_call:
    inputs:
      node-version: { required: true, type: string }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ inputs.node-version }}', cache: 'npm' }
      - run: npm ci && npm test
```

## Anti-patrones GitHub Actions (nunca hacer)

- ❌ `@latest` en acciones — siempre pinear versión mayor (`@v4`)
- ❌ `npm install` en CI — usar `npm ci`
- ❌ `npm install -g vsce` — usar `npx @vscode/vsce`
- ❌ `run: echo ${{ secrets.MY_SECRET }}` — expone secret en logs
- ❌ `continue-on-error: true` en test-gate — rompe la protección
- ❌ `permissions: write-all` — usar permisos mínimos por job
- ❌ `workflow_run` sin `if: github.event.workflow_run.conclusion == 'success'`
- ❌ Tags pusheados sin verificar si ya existen — duplica releases
- ❌ `git push --force` en workflows — corrompe historial
- ❌ Hardcodear versiones de Node — leer de `package.json` con `node -p`

## Related Skills

- `vscode-extension-builder` — reglas de CI específicas para extensiones VS Code
- `security-best-practices` — secrets y permisos
- Source: [wshobson/agents cicd-automation](https://github.com/wshobson/agents/tree/main/plugins/cicd-automation)
