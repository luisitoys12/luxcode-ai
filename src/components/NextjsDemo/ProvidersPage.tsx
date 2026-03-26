// Server Component (default en App Router)
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load del form (Client Component) — skeleton mientras carga
const ProviderForm = dynamic(() => import('./ProviderForm'), {
  loading: () => <ProviderFormSkeleton />,
  ssr: false,
});

// Server-side data fetch con Next.js 16 cache
async function getProviders() {
  'use cache';
  // En producción: reemplazar por query a DB / fetch a API
  return [
    { id: '1', name: 'Gemini',     model: 'gemini-2.0-flash', color: '#22c55e' },
    { id: '2', name: 'Groq',       model: 'llama-3.3-70b',   color: '#a78bfa' },
    { id: '3', name: 'OpenRouter', model: 'deepseek-coder',  color: '#3b82f6' },
  ];
}

// Skeleton para Suspense
function ProviderFormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando formulario">
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />
      ))}
    </div>
  );
}

// Page — Server Component
export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <main>
      <header>
        {/* next/image con priority en imagen above-the-fold */}
        <Image
          src="/logo.svg"
          alt="LuxCode AI logo"
          width={120}
          height={40}
          priority
        />
        <h1>Proveedores de IA</h1>
      </header>

      {/* Suspense wrapper para el Client Component */}
      <Suspense fallback={<ProviderFormSkeleton />}>
        <ProviderForm initialProviders={providers} />
      </Suspense>
    </main>
  );
}
