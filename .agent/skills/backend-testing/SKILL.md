---
name: backend-testing
version: 1.0.0
description: "Testing de APIs y servicios backend generados por LuxCode AI. Aplica cuando el usuario pide tests, coverage, mocks, fixtures, o revisión de calidad en APIs Node.js/Express."
source: "built-in (supercent-io/skills-template no existe — construido desde cero)"
triggers:
  - /backend-testing
  - /test-api
  - write tests
  - add coverage
  - revisar tests
  - agregar tests
  - unit tests
  - integration tests
  - mock API
author: luisitoys12
license: MIT
---

# 🧪 Backend Testing Skill — LuxCode AI

## Stack de testing recomendado

| Capa | Herramienta | Comando |
|---|---|---|
| Unit tests | **Vitest** | `npx vitest run` |
| Integration / API | **Supertest** + Vitest | `npx vitest run --reporter=verbose` |
| Coverage | **V8 coverage** | `npx vitest run --coverage` |
| Mocks | **vi.mock()** | inline |
| Fixtures | archivos `.fixture.ts` | `src/__fixtures__/` |

---

## Estructura de carpetas

```
src/
├── __tests__/
│   ├── unit/           # Tests de funciones puras, servicios
│   ├── integration/    # Tests de endpoints con Supertest
│   └── e2e/            # Tests de flujo completo
├── __fixtures__/       # Datos de prueba reutilizables
└── __mocks__/          # Mocks globales (DB, servicios externos)
```

---

## Patrones obligatorios

### Unit test (Vitest)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../services/UserService';

describe('UserService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return user by id', async () => {
    const mockUser = { id: '1', name: 'Luis', email: 'luis@test.com' };
    vi.spyOn(UserService, 'findById').mockResolvedValue(mockUser);
    const result = await UserService.findById('1');
    expect(result).toEqual(mockUser);
    expect(result.email).toMatch(/@/);
  });

  it('should throw when user not found', async () => {
    vi.spyOn(UserService, 'findById').mockResolvedValue(null);
    await expect(UserService.findById('999')).rejects.toThrow('User not found');
  });
});
```

### Integration test con Supertest

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.disconnect(); });

describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Luis', email: 'luis@test.com' })
      .expect(201);
    expect(res.body).toMatchObject({ id: expect.any(String), name: 'Luis' });
  });

  it('returns 400 with invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Luis', email: 'not-an-email' })
      .expect(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    await request(app).get('/api/users/me').expect(401);
  });
});
```

---

## Reglas de calidad

| Regla | Descripción |
|---|---|
| **BT-01** | Coverage mínimo: 80% statements, 70% branches |
| **BT-02** | Cada endpoint tiene: test happy path + test error (400/401/404/500) |
| **BT-03** | `beforeEach(() => vi.clearAllMocks())` en cada describe |
| **BT-04** | Nunca usar datos de producción en tests — usar fixtures |
| **BT-05** | Tests de autenticación: probar con y sin token, con token expirado |
| **BT-06** | Validación de inputs: test con datos vacíos, nulos, strings muy largos |
| **BT-07** | Mocks de servicios externos (APIs de pago, email, etc.) SIEMPRE |
| **BT-08** | Nombres de test: `it('should <acción> when <condición>')` |
| **BT-09** | Un `expect` principal por test (máx 3 expects relacionados) |
| **BT-10** | Tests deben ser independientes: no depender del orden de ejecución |

---

## Fixture pattern

```ts
// src/__fixtures__/user.fixture.ts
export const userFixture = {
  valid: { id: 'u1', name: 'Luis', email: 'luis@test.com', role: 'admin' },
  noEmail: { id: 'u2', name: 'Ana' },
  expired: { id: 'u3', name: 'Bob', tokenExpiry: new Date('2020-01-01') },
};
```

---

## vitest.config.ts generado por LuxCode

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 }
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

---

## Checklist

- [ ] Happy path test por endpoint
- [ ] Error test (4xx, 5xx) por endpoint
- [ ] Auth tests (sin token, token expirado)
- [ ] Input validation tests (vacío, nulo, muy largo)
- [ ] Mocks de servicios externos
- [ ] `beforeEach(vi.clearAllMocks)` en cada describe
- [ ] Coverage >= 80% statements
- [ ] Fixtures en `__fixtures__/` (no datos inline)
