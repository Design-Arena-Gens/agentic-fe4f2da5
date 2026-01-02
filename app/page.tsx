'use client';

import { FormEvent, useState, useTransition } from 'react';

type Suggestion = {
  handle: string;
  rationale: string;
};

export default function HomePage() {
  const [name, setName] = useState('');
  const [tone, setTone] = useState<'professional' | 'playful' | 'edgy'>('professional');
  const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'tiktok' | 'youtube'>('instagram');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      setError(null);
      setSuggestions([]);

      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, tone, platform })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = typeof payload.error === 'string' ? payload.error : 'Agent failed to respond.';
          throw new Error(message);
        }

        const data = (await response.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
        setError(message);
      }
    });
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 720,
          backgroundColor: 'var(--card-bg)',
          border: `1px solid var(--card-border)`,
          borderRadius: 20,
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(8, 9, 17, 0.55)'
        }}
      >
        <header style={{ marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '0.9rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: 0
            }}
          >
            HandleCraft Agent
          </p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem', fontSize: '2.2rem' }}>
            Tailored social handles from your name.
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Share your name, pick a vibe, and let the agent craft ready-to-use usernames across social platforms.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>What&apos;s your name?</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Jordan Lee"
              required
              minLength={2}
              style={{
                backgroundColor: '#0c0c0c',
                border: `1px solid ${name.length > 0 ? 'var(--accent)' : 'var(--card-border)'}`,
                borderRadius: 12,
                padding: '0.85rem 1rem',
                fontSize: '1rem',
                color: 'var(--text-color)',
                transition: 'border-color 0.15s ease'
              }}
            />
          </label>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>Pick your vibe</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {(
                [
                  { id: 'professional', label: 'Professional' },
                  { id: 'playful', label: 'Playful' },
                  { id: 'edgy', label: 'Edgy' }
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTone(option.id)}
                  style={{
                    borderRadius: 12,
                    padding: '0.85rem 1rem',
                    border: `1px solid ${tone === option.id ? 'var(--accent)' : 'var(--card-border)'}`,
                    background: tone === option.id ? 'rgba(79, 70, 229, 0.15)' : '#0c0c0c',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>Target platform</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {(
                [
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'twitter', label: 'X / Twitter' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'youtube', label: 'YouTube' }
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPlatform(option.id)}
                  style={{
                    borderRadius: 12,
                    padding: '0.85rem 1rem',
                    border: `1px solid ${platform === option.id ? 'var(--accent)' : 'var(--card-border)'}`,
                    background: platform === option.id ? 'rgba(79, 70, 229, 0.15)' : '#0c0c0c',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || name.trim().length < 2}
            style={{
              borderRadius: 12,
              padding: '0.9rem 1.1rem',
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              transition: 'background 0.2s ease'
            }}
          >
            {isPending ? 'Crafting handles…' : 'Generate usernames'}
          </button>
        </form>

        {error ? (
          <div
            style={{
              marginTop: '1.75rem',
              padding: '1rem 1.25rem',
              borderRadius: 12,
              border: '1px solid rgba(255, 99, 71, 0.5)',
              background: 'rgba(255, 99, 71, 0.1)',
              color: '#ff8877'
            }}
          >
            {error}
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <div style={{ marginTop: '2.5rem', display: 'grid', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Here&apos;s what the agent suggests</h2>
            {suggestions.map((item) => (
              <article
                key={item.handle}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 12,
                  border: '1px solid var(--card-border)',
                  background: '#0a0a0a',
                  display: 'grid',
                  gap: '0.5rem'
                }}
              >
                <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{item.handle}</p>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{item.rationale}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
