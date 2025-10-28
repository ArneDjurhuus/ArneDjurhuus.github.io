"use client";
import { useState } from 'react';

export function DigestButton({ spaceId }: { spaceId: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/digests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        setError(`HTTP ${res.status}: ${text.slice(0, 180)}`);
        return;
      }
      if (json?.ok) setSummary(json.data?.summary);
      else setError(json?.error || `HTTP ${res.status}`);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          background: '#4f46e5',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Generating digest…' : 'Generate daily digest'}
      </button>
      {summary && (
        <div style={{ marginTop: 12, color: '#93a2b8' }}>
          <strong>Summary:</strong> {summary}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12, color: '#ef4444' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
