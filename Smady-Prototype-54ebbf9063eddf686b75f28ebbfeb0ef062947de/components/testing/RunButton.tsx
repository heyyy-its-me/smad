'use client';

import { Play, Square, Loader2 } from 'lucide-react';

interface RunButtonProps {
  state: 'idle' | 'loading' | 'running' | 'completed' | 'failed';
  onRun: () => void;
  onCancel: () => void;
  disabled?: boolean;
  idleLabel?: string;
}

export default function RunButton({ state, onRun, onCancel, disabled, idleLabel = 'RUN AGENT' }: RunButtonProps) {
  if (state === 'loading') {
    return (
      <button className="run-btn loading" disabled>
        <Loader2 size={16} className="spin-icon" />
        <span>CONNECTING</span>
        <style jsx>{`
          .run-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: var(--radius-md);
            border: 1px solid rgba(255, 255, 255,0.3);
            background: rgba(255, 255, 255,0.12);
            color: var(--violet-bright);
            font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
            cursor: not-allowed; transition: all var(--duration-fast) ease;
          }
          .spin-icon { animation: spin-slow 1s linear infinite; }
            /* Playful run controls */
          .run-btn { border-radius: 999px !important; min-height: 44px; padding-inline: 24px !important; }
          .run-btn.idle { background: #f5f5f5 !important; color: #111 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.22) !important; }
          .run-btn.idle:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important; transform: translateY(-3px) scale(1.02) !important; }
          .run-btn.loading { background: linear-gradient(100deg, rgba(189,120,255,0.25), rgba(85,219,201,0.18)) !important; }
          .run-btn.running { background: linear-gradient(100deg, rgba(255,126,157,0.22), rgba(255,184,107,0.16)) !important; }
          .run-btn.completed { background: linear-gradient(100deg, rgba(255, 255, 255,0.2), rgba(168,245,138,0.15)) !important; }
      `}</style>
      </button>
    );
  }

  if (state === 'running') {
    return (
      <button className="run-btn running" onClick={onCancel}>
        <Square size={12} fill="currentColor" />
        <span>STOP</span>
        <style jsx>{`
          .run-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: var(--radius-md);
            border: 1px solid rgba(248,113,113,0.3);
            background: rgba(248,113,113,0.1);
            color: var(--status-failed);
            font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
            cursor: pointer; transition: all var(--duration-fast) ease;
          }
          .run-btn:hover { background: rgba(248,113,113,0.18); }
            /* Playful run controls */
          .run-btn { border-radius: 999px !important; min-height: 44px; padding-inline: 24px !important; }
          .run-btn.idle { background: #f5f5f5 !important; color: #111 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.22) !important; }
          .run-btn.idle:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important; transform: translateY(-3px) scale(1.02) !important; }
          .run-btn.loading { background: linear-gradient(100deg, rgba(189,120,255,0.25), rgba(85,219,201,0.18)) !important; }
          .run-btn.running { background: linear-gradient(100deg, rgba(255,126,157,0.22), rgba(255,184,107,0.16)) !important; }
          .run-btn.completed { background: linear-gradient(100deg, rgba(255, 255, 255,0.2), rgba(168,245,138,0.15)) !important; }
      `}</style>
      </button>
    );
  }

  if (state === 'completed') {
    return (
      <button className="run-btn completed" disabled>
        <span className="check-icon">✓</span>
        <span>COMPLETE</span>
        <style jsx>{`
          .run-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: var(--radius-md);
            border: 1px solid rgba(94,234,158,0.25);
            background: rgba(94,234,158,0.08);
            color: var(--status-completed);
            font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
            cursor: default;
          }
          .check-icon {
            display: grid; place-items: center;
            width: 18px; height: 18px; border-radius: 50%;
            background: rgba(94,234,158,0.2);
            font-size: 10px;
          }
            /* Playful run controls */
          .run-btn { border-radius: 999px !important; min-height: 44px; padding-inline: 24px !important; }
          .run-btn.idle { background: #f5f5f5 !important; color: #111 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.22) !important; }
          .run-btn.idle:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important; transform: translateY(-3px) scale(1.02) !important; }
          .run-btn.loading { background: linear-gradient(100deg, rgba(189,120,255,0.25), rgba(85,219,201,0.18)) !important; }
          .run-btn.running { background: linear-gradient(100deg, rgba(255,126,157,0.22), rgba(255,184,107,0.16)) !important; }
          .run-btn.completed { background: linear-gradient(100deg, rgba(255, 255, 255,0.2), rgba(168,245,138,0.15)) !important; }
      `}</style>
      </button>
    );
  }

  if (state === 'failed') {
    return (
      <button className="run-btn failed" onClick={onRun} disabled={disabled}>
        <Play size={14} fill="currentColor" />
        <span>RETRY</span>
        <style jsx>{`
          .run-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: var(--radius-md);
            border: 1px solid rgba(248,113,113,0.25);
            background: rgba(248,113,113,0.08);
            color: var(--status-failed);
            font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
            cursor: pointer; transition: all var(--duration-fast) ease;
          }
          .run-btn:hover { background: rgba(248,113,113,0.18); }
            /* Playful run controls */
          .run-btn { border-radius: 999px !important; min-height: 44px; padding-inline: 24px !important; }
          .run-btn.idle { background: #f5f5f5 !important; color: #111 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.22) !important; }
          .run-btn.idle:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important; transform: translateY(-3px) scale(1.02) !important; }
          .run-btn.loading { background: linear-gradient(100deg, rgba(189,120,255,0.25), rgba(85,219,201,0.18)) !important; }
          .run-btn.running { background: linear-gradient(100deg, rgba(255,126,157,0.22), rgba(255,184,107,0.16)) !important; }
          .run-btn.completed { background: linear-gradient(100deg, rgba(255, 255, 255,0.2), rgba(168,245,138,0.15)) !important; }
      `}</style>
      </button>
    );
  }

  // idle state
  return (
    <button className="run-btn idle" onClick={onRun} disabled={disabled}>
      <span className="play-icon"><Play size={14} fill="currentColor" /></span>
      <span>{idleLabel}</span>
      <style jsx>{`
        .run-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 12px 28px; border-radius: var(--radius-md);
          border: none;
          background: #f5f5f5; color: #111;
          color: #fff;
          font-size: 13px; font-weight: 700; letter-spacing: 0.03em;
          cursor: pointer; transition: all var(--duration-normal) var(--ease-spring);
          box-shadow: 0 4px 16px rgba(255, 255, 255,0.3);
          position: relative; overflow: hidden;
        }
        .run-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .run-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(255, 255, 255,0.4);
        }
        .run-btn:hover::before { transform: translateX(100%); }
        .run-btn:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(255, 255, 255,0.3); }
        .play-icon { display: grid; place-items: center; }
          /* Playful run controls */
          .run-btn { border-radius: 999px !important; min-height: 44px; padding-inline: 24px !important; }
          .run-btn.idle { background: #f5f5f5 !important; color: #111 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.22) !important; }
          .run-btn.idle:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important; transform: translateY(-3px) scale(1.02) !important; }
          .run-btn.loading { background: linear-gradient(100deg, rgba(189,120,255,0.25), rgba(85,219,201,0.18)) !important; }
          .run-btn.running { background: linear-gradient(100deg, rgba(255,126,157,0.22), rgba(255,184,107,0.16)) !important; }
          .run-btn.completed { background: linear-gradient(100deg, rgba(255, 255, 255,0.2), rgba(168,245,138,0.15)) !important; }
      `}</style>
    </button>
  );
}
