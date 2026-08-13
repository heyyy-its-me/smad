'use client';

import type { AgentNode } from '@/lib/types';

interface ProgressTimelineProps {
  nodes: AgentNode[];
}

const statusIcons: Record<string, string> = {
  pending: '○',
  running: '◌',
  success: '✓',
  failed: '✕',
};

const statusColors: Record<string, string> = {
  pending: '#d9d9e0',
  running: '#755ac4',
  success: '#64bd88',
  failed: '#c44a4a',
};

export default function ProgressTimeline({ nodes }: ProgressTimelineProps) {
  const completed = nodes.filter((n) => n.status === 'success' || n.status === 'failed').length;
  const total = nodes.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: '#858591', fontFamily: "'DM Mono', monospace" }}>
          PROGRESS
        </span>
        <span style={{ fontSize: 10, color: '#858591', fontFamily: "'DM Mono', monospace" }}>
          {completed}/{total} nodes ({pct}%)
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: '#e9e9ef',
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #755ac4, #a58feb)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ position: 'relative', paddingLeft: 16 }}>
        {/* vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 7,
            top: 4,
            bottom: 4,
            width: 2,
            background: '#e9e9ef',
          }}
        />
        {nodes.map((node, i) => (
          <div
            key={node.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              paddingBottom: i < nodes.length - 1 ? 14 : 0,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${statusColors[node.status]}`,
                background: node.status === 'pending' ? '#fff' : statusColors[node.status],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
                color: node.status === 'pending' ? '#858591' : '#fff',
                flexShrink: 0,
                marginTop: 1,
                transition: 'all 0.2s ease',
              }}
            >
              {node.status !== 'pending' && statusIcons[node.status]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 12, color: '#222334' }}>{node.name}</strong>
                <span
                  style={{
                    fontSize: 10,
                    color: statusColors[node.status],
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  {node.status.toUpperCase()}
                  {node.duration > 0 && ` · ${node.duration}ms`}
                </span>
              </div>
              {node.status === 'running' && (
                <div
                  style={{
                    height: 2,
                    borderRadius: 1,
                    background: '#e9e9ef',
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '50%',
                      background: '#755ac4',
                      borderRadius: 1,
                      animation: 'shimmer 1s ease-in-out infinite',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
