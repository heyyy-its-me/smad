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
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.88) 100%);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
        }
        .topbar-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .breadcrumb-studio { color: var(--text-secondary); font-weight: 500; }
        .breadcrumb-sep { color: var(--text-muted); }
        .breadcrumb-agent { color: var(--text-primary); font-weight: 700; letter-spacing: -0.2px; }
        .topbar-right { display: flex; align-items: center; gap: 24px; }
        .user-profile {
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; padding: 6px 12px 6px 6px;
          border-radius: var(--radius-lg);
          transition: all var(--duration-normal) var(--ease-smooth);
          border: 1px solid transparent;
        }
        .user-profile:hover {
          border-color: rgba(124, 92, 255, 0.2);
          background: rgba(124, 92, 255, 0.08);
        }
        .user-avatar {
          width: 36px; height: 36px; border-radius: var(--radius-lg);
          display: grid; place-items: center;
          background: linear-gradient(135deg, var(--violet-bright) 0%, var(--violet) 100%);
          color: #fff; font-size: 11px; font-weight: 700;
          box-shadow: 0 4px 12px rgba(124, 92, 255, 0.25);
        }
        .user-name { font-size: 13px; color: var(--text-primary); font-weight: 600; }
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
