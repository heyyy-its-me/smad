'use client';

import type { AgentInfo } from './AgentPipeline';

interface AgentHeaderProps {
  agent: AgentInfo;
  runStatus: 'idle' | 'loading' | 'running' | 'completed' | 'failed';
}

export default function AgentHeader({ agent, runStatus }: AgentHeaderProps) {
  const Icon = agent.icon;

  const statusDisplay = (() => {
    switch (runStatus) {
      case 'loading': return { text: 'CONNECTING', cls: 'running' };
      case 'running': return { text: 'RUNNING', cls: 'running' };
      case 'completed': return { text: 'COMPLETED', cls: 'completed' };
      case 'failed': return { text: 'FAILED', cls: 'failed' };
      default: return { text: agent.status.toUpperCase(), cls: agent.status.toLowerCase() };
    }
  })();

  return (
    <div className="agent-header">
      <div className="agent-header-main">
        <div className={`agent-icon ${agent.tone}`} style={{ width: 44, height: 44, borderRadius: 14, fontSize: 20 }}>
          <Icon size={22} />
        </div>
        <div className="agent-header-info">
          <div className="agent-header-top">
            <h1 className="agent-title">{agent.title}</h1>
            <span className={`status-badge ${statusDisplay.cls}`}>
              <span className="dot" />
              {statusDisplay.text}
            </span>
          </div>
          <p className="agent-desc">{agent.desc}</p>
        </div>
      </div>

      <style jsx>{`
        .agent-header {
          margin-bottom: 20px;
        }

        .agent-header-main {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .agent-header-info {
          flex: 1;
          min-width: 0;
        }

        .agent-header-top {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .agent-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: var(--text-primary);
          margin: 0;
        }

        .agent-desc {
          font-size: 13px;
          color: var(--text-tertiary);
          margin: 6px 0 0;
          max-width: 520px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
