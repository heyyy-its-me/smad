'use client';

import { useEffect, useRef } from 'react';
import type { LogEntry } from '@/lib/types';

interface LiveLogProps {
  logs: LogEntry[];
}

const levelColors: Record<string, string> = {
  info: '#469d6c',
  warn: '#d88348',
  error: '#c44a4a',
  debug: '#755ac4',
};

export default function LiveLog({ logs }: LiveLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div
      style={{
        background: '#1a1b2e',
        borderRadius: 10,
        padding: 14,
        fontFamily: "'DM Mono', 'Courier New', monospace",
        fontSize: 10,
        lineHeight: 1.6,
        maxHeight: 240,
        overflowY: 'auto',
        color: '#c8c9d4',
      }}
    >
      {logs.length === 0 && (
        <span style={{ color: '#5a5b6e' }}>{'// waiting for logs…'}</span>
      )}
      {logs.map((log, i) => {
        const time = new Date(log.timestamp);
        const ts = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padStart(3, '0')}`;
        return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '1px 0' }}>
            <span style={{ color: '#5a5b6e', flexShrink: 0 }}>{ts}</span>
            <span style={{ color: levelColors[log.level] ?? '#c8c9d4', flexShrink: 0 }}>
              [{log.level.toUpperCase()}]
            </span>
            {log.nodeId && (
              <span style={{ color: '#a58feb', flexShrink: 0 }}>[{log.nodeId}]</span>
            )}
            <span style={{ color: '#e8e8f0' }}>{log.message}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
