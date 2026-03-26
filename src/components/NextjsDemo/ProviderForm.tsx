'use client';
import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

// --- Types ---
type Provider = { id: string; name: string; model: string; color: string };
type FormState = { success?: boolean; error?: string; providers?: Provider[] };

// --- Server Action (en proyecto real: archivo separado con 'use server') ---
async function addProvider(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  const name = formData.get('name') as string;
  const model = formData.get('model') as string;
  if (!name || !model) return { error: 'Nombre y modelo son requeridos' };
  // Simulación de insert en DB
  return { success: true };
}

// --- Submit Button con useFormStatus ---
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="btn-primary"
    >
      {pending ? 'Guardando...' : 'Agregar proveedor'}
    </button>
  );
}

// --- Componente principal ---
export default function ProviderForm({ initialProviders }: { initialProviders: Provider[] }) {
  const [state, action] = useActionState(addProvider, {});

  // useOptimistic: muestra el nuevo proveedor antes de que el server responda
  const [optimisticProviders, addOptimistic] = useOptimistic(
    initialProviders,
    (prev, newProvider: Provider) => [...prev, newProvider]
  );

  return (
    <section aria-label="Gestionar proveedores de IA">
      {/* Lista optimista */}
      <ul role="list" aria-label="Proveedores activos">
        {optimisticProviders.map((p) => (
          <li key={p.id} style={{ borderLeft: `3px solid ${p.color}` }}>
            <strong>{p.name}</strong> — {p.model}
          </li>
        ))}
      </ul>

      {/* Formulario con Server Action */}
      <form
        action={(formData) => {
          // Optimistic update inmediato
          addOptimistic({
            id: crypto.randomUUID(),
            name: formData.get('name') as string,
            model: formData.get('model') as string,
            color: '#7c3aed',
          });
          return action(formData);
        }}
        aria-label="Agregar nuevo proveedor"
        noValidate
      >
        <label htmlFor="name">Nombre del proveedor</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="ej. Gemini"
          autoComplete="off"
          required
          aria-required="true"
        />

        <label htmlFor="model">Modelo</label>
        <input
          id="model"
          name="model"
          type="text"
          placeholder="ej. gemini-2.0-flash"
          autoComplete="off"
          required
          aria-required="true"
        />

        <SubmitButton />

        {/* Feedback accesible con aria-live */}
        {state.error && (
          <p role="alert" aria-live="assertive" className="error">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" aria-live="polite" className="success">
            ✅ Proveedor agregado correctamente
          </p>
        )}
      </form>
    </section>
  );
}
