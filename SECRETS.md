# 🔐 Secrets requeridos — LuxCode AI

Configura estos secrets en GitHub: **Settings → Secrets and variables → Actions → New repository secret**

## 🏪 VS Code Marketplace

| Secret | Descripci\u00f3n | C\u00f3mo obtenerlo |
|---|---|---|
| `VSCE_PAT` | Personal Access Token de Azure DevOps | [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) → Ver abajo |

### Obtener VSCE_PAT paso a paso:
1. Ve a [dev.azure.com](https://dev.azure.com)
2. Inicia sesi\u00f3n con la misma cuenta de tu publisher (`luisitoys12`)
3. Settings → Personal Access Tokens → **New Token**
4. Nombre: `LuxCode AI Publish`
5. Organization: **All accessible organizations**
6. Scopes: **Marketplace → Manage** (marca el checkbox)
7. Copia el token y p\u00e9galo en GitHub Secrets como `VSCE_PAT`

> \u26a0\ufe0f El publisher `luisitoys12` debe estar creado en [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)

## \u2601\ufe0f AWS (opcional)

| Secret | Descripci\u00f3n |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access Key de IAM user |
| `AWS_SECRET_ACCESS_KEY` | Secret Key de IAM user |
| `AWS_S3_BUCKET` | Nombre del bucket S3 (ej: `luxcode-ai-releases`) |
| `AWS_REGION` | Regi\u00f3n AWS (default: `us-east-1`) |
| `AWS_CLOUDFRONT_ID` | ID de distribuci\u00f3n CloudFront (opcional) |

### Configurar AWS en 5 minutos:
1. Ve a [console.aws.amazon.com/iam](https://console.aws.amazon.com/iam)
2. Users → Create user → nombre: `luxcode-deploy`
3. Attach policies: `AmazonS3FullAccess` + `CloudFrontFullAccess`
4. Security credentials → Create access key
5. Copia `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`
6. Crea el bucket S3: [console.aws.amazon.com/s3](https://console.aws.amazon.com/s3) → Create bucket → nombre: `luxcode-ai-releases`
7. En bucket → Properties → Static website hosting → Enable

## \ud83d\udcdd Agregar secrets en GitHub

```
https://github.com/luisitoys12/luxcode-ai/settings/secrets/actions/new
```
