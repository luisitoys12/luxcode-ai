// Fixtures reutilizables para tests de AIService
export const promptFixture = {
  simple: 'Genera una landing page para una pizzería',
  nextjs: 'Genera un dashboard con Next.js para gestión de usuarios',
  api: 'Genera una API REST para un e-commerce con productos y pedidos',
  empty: '',
  veryLong: 'a'.repeat(10_000),
};

export const responseFixture = {
  gemini: {
    ok: {
      candidates: [{ content: { parts: [{ text: '{"index.html":"<!DOCTYPE html>"}' }] } }],
    },
    error: {
      error: { message: 'API key not valid. Please pass a valid API key.' },
    },
  },
  openai: {
    ok: {
      choices: [{ message: { content: '{"index.html":"<!DOCTYPE html>"}' } }],
    },
    error: {
      error: { message: 'Incorrect API key provided.' },
    },
  },
  groq: {
    ok: {
      choices: [{ message: { content: '{"index.html":"<html></html>"}' } }],
    },
  },
  openrouter: {
    ok: {
      choices: [{ message: { content: '{"index.html":"<html></html>"}' } }],
    },
  },
};

export const apiKeyFixture = {
  gemini:     'AIzaFAKE_TEST_KEY_NOT_REAL_1234567890',
  openai:     'sk-fake-test-key-not-real-1234567890abcdef',
  groq:       'gsk_fake_test_key_not_real_1234567890',
  openrouter: 'sk-or-fake-test-key-not-real-1234567890',
};
