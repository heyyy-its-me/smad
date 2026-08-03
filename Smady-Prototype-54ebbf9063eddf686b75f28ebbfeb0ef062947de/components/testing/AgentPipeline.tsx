'use client';

import { clsx } from 'clsx';
import { 
  Target, 
  Users, 
  Send, 
  Calendar, 
  FileText, 
  BarChart3,
} from 'lucide-react';

export interface AgentInfo {
  id: string;
  icon: typeof Target;
  title: string;
  short: string;
  desc: string;
  tone: string;
  status: string;
}

export const agents: AgentInfo[] = [
  { id: 'icp', icon: Target, title: 'ICP & GTM Strategy', short: 'Strategy', desc: 'Turn a sharp point of view into a focused market map.', tone: 'violet', status: 'Connected' },
  { id: 'leads', icon: Users, title: 'Lead Management', short: 'Prospects', desc: 'Find and qualify the companies worth knowing.', tone: 'cyan', status: 'Ready' },
  { id: 'outreach', icon: Send, title: 'Outreach', short: 'Outreach', desc: 'Make every first hello feel thoughtfully personal.', tone: 'pink', status: 'Ready' },
  { id: 'meeting', icon: Calendar, title: 'Meeting Scheduler', short: 'Meetings', desc: 'Turn interest into conversations that matter.', tone: 'orange', status: 'Waiting' },
  { id: 'proposal', icon: FileText, title: 'Proposal Generation', short: 'Proposals', desc: 'Build a proposal tailored to the client in the room.', tone: 'green', status: 'Ready' },
  { id: 'crm', icon: BarChart3, title: 'CRM & Analytics', short: 'Analytics', desc: 'Keep the story of every deal clear and useful.', tone: 'indigo', status: 'Ready' },
];

interface AgentPipelineProps {
  active: string;
  onSelect: (id: string) => void;
  runningAgent?: string | null;
}

export default function AgentPipeline({ active, onSelect, runningAgent }: AgentPipelineProps) {
  return (
    <div className="pipeline card">
      <div className="pipeline-header">
        <div>
          <h2 className="pipeline-title">Agent Pipeline</h2>
          <p className="pipeline-desc">Select a stage to test its live input and execution lifecycle.</p>
        </div>
        <span className="pipeline-status">
          <span className="dot" />
          SYSTEM READY
        </span>
      </div>

      <div className="pipeline-steps">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isActive = active === agent.id;
          const isRunning = runningAgent === agent.id;
          const isLast = index === agents.length - 1;

          return (
            <div key={agent.id} className="step-wrapper">
              <button
                onClick={() => onSelect(agent.id)}
                className={clsx(
                  'step-button',
                  isActive && 'active',
                  isRunning && 'is-running'
                )}
              >
                <div className={clsx('step-icon', agent.tone, isActive && 'active')}>
                  <Icon size={16} />
                </div>
                <span className="step-label">{agent.short}</span>
                <span className={clsx('step-status', agent.status.toLowerCase())}>
                  {isRunning ? '●' : agent.status === 'Connected' ? '◆' : '○'}
                </span>
              </button>
              {!isLast && (
                <div className="step-connector">
                  <svg width="100%" height="2" viewBox="0 0 40 2" preserveAspectRatio="none">
                    <line
                      x1="0" y1="1" x2="40" y2="1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray={isActive ? "none" : "4 4"}
                      className="connector-line"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .pipeline {
          padding: 20px 24px;
          margin-bottom: 20px;
        }

        .pipeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .pipeline-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .pipeline-desc {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 4px 0 0;
        }

        .pipeline-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          background: rgba(34, 211, 197, 0.08);
          border: 1px solid rgba(34, 211, 197, 0.15);
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--cyan);
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .pipeline-status .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--cyan);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        .pipeline-steps {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .step-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .step-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-smooth);
          position: relative;
          border-radius: var(--radius-lg);
          min-width: 80px;
          flex: 1;
        }

        .step-button:hover {
          color: var(--text-secondary);
          background: rgba(124, 92, 255, 0.08);
        }

        .step-button:hover .step-icon {
          transform: scale(1.12);
        }

        .step-button.active {
          color: var(--text-primary);
        }

        .step-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: grid;
          place-items: center;
          transition: all var(--duration-normal) var(--ease-spring);
          border: 1.5px solid transparent;
          background: rgba(124, 92, 255, 0.08);
        }

        .step-icon.violet {
          background: rgba(124, 92, 255, 0.15);
        }

        .step-icon.cyan {
          background: rgba(34, 211, 197, 0.15);
        }

        .step-icon.pink {
          background: rgba(244, 114, 182, 0.15);
        }

        .step-icon.orange {
          background: rgba(251, 146, 60, 0.15);
        }

        .step-icon.active {
          border-color: var(--violet-bright);
          box-shadow: 0 0 20px rgba(124, 92, 255, 0.3);
        }
        }

        .step-button.is-running .step-icon {
          border-color: var(--violet-bright);
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        .step-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .step-status {
          font-size: 7px;
          line-height: 1;
        }

        .step-status.ready { color: var(--status-ready); }
        .step-status.connected { color: var(--violet-bright); }
        .step-status.waiting { color: var(--status-waiting); }

        .step-connector {
          flex: 1;
          min-width: 16px;
          padding: 0 4px;
          color: var(--border-strong);
          display: flex;
          align-items: center;
        }

        .step-connector svg {
          display: block;
        }

        .connector-line {
          transition: stroke-dasharray var(--duration-normal) ease;
        }

        @media (max-width: 700px) {
          .pipeline {
            padding: 16px;
          }
          .pipeline-desc { display: none; }
          .pipeline-steps { overflow-x: auto; gap: 4px; }
          .step-wrapper { min-width: 60px; }
          .step-connector { min-width: 8px; }
        }

        /* AI operating system pipeline treatment */
        .pipeline { position: relative; overflow: hidden; background: linear-gradient(120deg, rgba(58, 36, 96, 0.9), rgba(29, 48, 78, 0.74)); }
        .pipeline::before { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 24%, rgba(255,255,255,0.1) 48%, transparent 70%); transform: translateX(-110%); animation: pipeline-sheen 7s ease-in-out infinite; pointer-events: none; }
        .pipeline-header, .pipeline-steps { position: relative; z-index: 1; }
        .step-button { min-height: 104px; padding: 12px 8px; border: 1px solid transparent; background: rgba(255,255,255,0.015); }
        .step-button:hover { border-color: rgba(255,255,255,0.17); background: rgba(255,255,255,0.065); transform: translateY(-4px) scale(1.02); }
        .step-button.active { background: linear-gradient(150deg, rgba(255,255,255,0.12), rgba(255,255,255,0.025)); border-color: color-mix(in srgb, currentColor 36%, transparent); box-shadow: 0 12px 26px rgba(18, 8, 40, 0.24); }
        .step-icon { width: 48px; height: 48px; border-radius: 17px; box-shadow: 0 9px 18px rgba(11, 5, 32, 0.2); }
        .step-button.is-running { animation: step-pulse 1.8s ease-in-out infinite; }
        .step-connector { color: rgba(255,255,255,0.22); }
        .step-button.active + .step-connector .connector-line, .step-button.is-running + .step-connector .connector-line { stroke: var(--cyan); stroke-dasharray: 7 5; animation: flow-dash 1.15s linear infinite; }
        @keyframes pipeline-sheen { 0%, 64%, 100% { transform: translateX(-110%); } 80% { transform: translateX(110%); } }
        @keyframes step-pulse { 0%,100% { filter: saturate(1); } 50% { filter: saturate(1.4) brightness(1.12); } }
        @keyframes flow-dash { to { stroke-dashoffset: -24; } }      `}</style>
    </div>
  );
}
