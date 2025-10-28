"use client";

import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function randomColor() {
  const colors = ['#FF6B6B', '#4FD1C5', '#F59E0B', '#6366F1', '#10B981', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function makeInitials(name?: string) {
  if (!name) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return (
      letters[Math.floor(Math.random() * letters.length)] +
      letters[Math.floor(Math.random() * letters.length)]
    );
  }
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return (first + last || first || 'AA').toUpperCase();
}

export default function RealtimeEditor({ ydocId, userName }: { ydocId: string; userName?: string }) {
  // Compute WS URL on the client. Server render must not open sockets.
  const wsUrl = useMemo(() => {
    const envUrl = (process.env.NEXT_PUBLIC_YJS_WS_URL as string) || '';
    if (typeof window !== 'undefined') {
      if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) return envUrl;
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const rawHost = window.location.hostname;
      const host = rawHost.endsWith('.localhost') ? 'localhost' : rawHost;
      return `${proto}://${host}:1234`;
    }
    return envUrl || 'ws://localhost:1234';
  }, []);

  // Lazy-create on client only to avoid server-side websocket attempts.
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [user] = useState(() => ({
    name: userName ?? `User ${Math.floor(Math.random() * 1000)}`,
    color: randomColor(),
    initials: makeInitials(userName),
  } as any));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const doc = new Y.Doc();
    const prov = new WebsocketProvider(wsUrl, ydocId, doc, { connect: true });
    try {
      prov.awareness.setLocalStateField('user', {
        name: user.name,
        color: user.color,
        initials: user.initials,
      });
    } catch {}
    try { prov.connect(); } catch {}
    setYdoc(doc);
    setProvider(prov);
    return () => {
      try { prov.destroy(); } catch {}
      try { doc.destroy(); } catch {}
    };
  }, [wsUrl, ydocId, user.name, user.color, user.initials]);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [synced, setSynced] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const onStatus = (event: any) => setStatus(event.status);
    const onSync = (isSynced: boolean) => setSynced(isSynced);
    const onError = (e: any) => {
      setLastError(String(e?.message || e || 'connection error'));
      setStatus('disconnected');
    };
    const onClose = () => setStatus('disconnected');
    if (!provider) return;
    provider.on('status', onStatus);
    provider.on('sync', onSync);
    provider.on('connection-error', onError);
    provider.on('connection-close', onClose);
    try { provider.connect(); } catch {}
    return () => {
      try { provider.off('status', onStatus); } catch {}
      try { provider.off('sync', onSync); } catch {}
      try { provider.off('connection-error', onError); } catch {}
      try { provider.off('connection-close', onClose); } catch {}
    };
  }, [provider]);

  // Mark lastSavedAt when doc updates and we appear connected
  useEffect(() => {
    if (!ydoc) return;
    const onUpdate = () => {
      // naive assumption: when connected, updates are sent immediately
      if (status === 'connected') setLastSavedAt(Date.now());
    };
    ydoc.on('update', onUpdate);
    return () => {
      ydoc.off('update', onUpdate as any);
    };
  }, [ydoc, status]);

  function formatLastSaved(ts: number | null) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 5000) return 'just now';
    const sec = Math.round(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    return `${hr}h ago`;
  }

  const editor = (useEditor as any)({
    extensions: [
      StarterKit.configure({ history: false }),
      ...(ydoc ? [Collaboration.configure({ document: ydoc })] : []),
      ...(provider ? [CollaborationCursor.configure({
        provider,
        user,
        render: (user: any) => {
          const cursor = document.createElement('span');
          cursor.classList.add('collab-cursor');
          cursor.style.borderLeft = `2px solid ${user.color}`;
          cursor.style.marginLeft = '-1px';
          cursor.style.borderRadius = '2px';
          cursor.style.pointerEvents = 'none';
          const label = document.createElement('div');
          label.style.position = 'relative';
          label.style.left = '2px';
          label.style.top = '-1.2em';
          label.style.background = user.color;
          label.style.color = '#0b1220';
          label.style.fontSize = '12px';
          label.style.padding = '2px 6px';
          label.style.borderRadius = '6px';
          label.style.fontWeight = '700';
          label.textContent = user.initials || user.name || 'User';
          cursor.appendChild(label);
          return cursor;
        },
      })] : []),
    ],
    editorProps: {
      attributes: {
        style:
          'min-height: 300px; padding: 12px; background: #0f172a; color: white; border: 1px solid #1f2a44; border-radius: 10px; outline: none;',
      },
    },
  }, [ydoc, provider]);

  useEffect(() => {
    return () => {
      try { editor?.destroy(); } catch {}
    };
  }, [editor]);

  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 8, color: status === 'connected' ? '#22c55e' : status === 'connecting' ? '#f59e0b' : '#ef4444' }}>
        {status === 'connected' ? (synced ? 'Connected' : 'Connecting…') : status === 'connecting' ? 'Connecting…' : 'Disconnected'}
      </div>
      {status === 'connected' && (
        <div style={{ fontSize: 12, marginBottom: 8, color: '#93a2b8' }}>
          Last saved {formatLastSaved(lastSavedAt)}
        </div>
      )}
      {lastError && (
        <div style={{ fontSize: 12, marginBottom: 8, color: '#ef4444' }}>WS error: {lastError}</div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
