'use client';

import { ChevronRight } from 'lucide-react';

interface TopBarProps {
  agentTitle: string;
  status: string;
  isRunning: boolean;
}

export default function TopBar({ agentTitle, status, isRunning }: TopBarProps) {
  const statusClass = isRunning ? 'running' : status.toLowerCase() === 'connected' ? 'ready' : status.toLowerCase();

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-studio">Agent Studio</span>
        <ChevronRight size={12} className="breadcrumb-sep" />
        <span className="breadcrumb-agent">{agentTitle}</span>
      </div>

      <div className="topbar-right">
        <span className={`status-badge ${statusClass}`}>
          <span className="dot" />
          {isRunning ? 'RUNNING' : status}
        </span>
        <div className="user-profile">
          <span className="user-avatar">AS</span>
          <span className="user-name">Amika</span>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(10, 15, 42, 0.5);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }
        .topbar-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .breadcrumb-studio { color: var(--text-tertiary); }
        .breadcrumb-sep { color: var(--text-muted); }
        .breadcrumb-agent { color: var(--text-primary); font-weight: 600; }
        .topbar-right { display: flex; align-items: center; gap: 16px; }
        .user-profile {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; padding: 4px 8px 4px 4px;
          border-radius: var(--radius-sm);
          transition: background var(--duration-fast) ease;
        }
        .user-profile:hover { background: rgba(255,255,255,0.04); }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 7px;
          display: grid; place-items: center;
          background: #e5e5e5;
          color: #111; font-size: 9px; font-weight: 700;
        }
        .user-name { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        @media (max-width: 700px) {
          .topbar { padding: 0 16px; }
          .user-name { display: none; }
        }
        /* Top bar glass treatment */
        .topbar { background: rgba(10, 10, 10, 0.88); border-bottom-color: rgba(255,255,255,0.12); }
        .user-profile { border: 1px solid transparent; }
        .user-profile:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.07); }
        .user-avatar { border-radius: 50%; box-shadow: 0 5px 14px rgba(0,0,0,0.3); }
      `}</style>
    </header>
  );
}
