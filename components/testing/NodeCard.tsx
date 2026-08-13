'use client';

import type { AgentNode } from '@/lib/types';

const statusColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: '#f4f4f7', border: '#e2e2e8', text: '#81818f', icon: '○' },
  running: { bg: '#f0ebff', border: '#c9bfff', text: '#755ac4', icon: '◌' },
  success: { bg: '#e4f5eb', border: '#a8dbbc', text: '#469d6c', icon: '✓' },
  failed: { bg: '#ffe7e7', border: '#f5baba', text: '#c44a4a', icon: '✕' },
};

interface NodeCardProps {
  node: AgentNode;
  index: number;
}

export default function NodeCard({ node, index }: NodeCardProps) {
  const colors = statusColors[node.status] ?? statusColors.pending;

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        background: colors.bg,
        padding: '12px 14px',
        marginBottom: 8,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            background: colors.border,
            color: colors.text,
          }}
        >
          {index + 1}
        </span>
        <strong style={{ fontSize: 13, color: '#222334', flex: 1 }}>{node.name}</strong>
        <span style={{ fontSize: 11, color: colors.text, fontWeight: 600 }}>
          {colors.icon}
        </span>
        {node.duration > 0 && (
          <span style={{ fontSize: 10, color: '#858591', fontFamily: "'DM Mono', monospace" }}>
            {node.duration}ms
          </span>
        )}
      </div>
{node.status === 'running' && (
        <div
          style={{
            height: 3,
            borderRadius: 2,
            marginTop: 6,
            overflow: 'hidden',
            background: 'linear-gradient(90deg, #e2e2e8 25%, #c9bfff 50%, #e2e2e8 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1s ease-in-out infinite',
          }}
        />
      )}
      {node.status === 'failed' && node.error && (
        <p style={{ fontSize: 10, color: '#c44a4a', margin: '4px 0 0' }}>{node.error}</p>
      )}
      {node.status === 'success' && node.output && (
        <p style={{ fontSize: 10, color: '#469d6c', margin: '4px 0 0' }}>{node.output}</p>
      )}
      {node.status === 'pending' && (
        <p style={{ fontSize: 10, color: '#858591', margin: '4px 0 0' }}>{node.input}</p>
      )}
    </div>
  );
}
