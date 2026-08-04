'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Activity, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { LogEntry, ExecutionState, ExecutionError } from '@/lib/types';

interface ExecutionConsoleProps {
  logs: LogEntry[];
  executionState: ExecutionState;
  elapsed: number;
  executionError: ExecutionError | null;
  requestId: string | null;
}

const activitySteps = [
  { id: 'accepted', label: 'Request accepted', icon: Zap },
  { id: 'webhook', label: 'n8n workflow triggered', icon: Activity },
  { id: 'searching', label: 'Searching target companies', icon: Activity },
  { id: 'qualifying', label: 'Qualifying prospects', icon: Activity },
  { id: 'enriching', label: 'Enriching contacts', icon: Activity },
  { id: 'preparing', label: 'Preparing output', icon: Activity },
  { id: 'response', label: 'Waiting for workflow response', icon: Clock },
];

export default function ExecutionConsole({
  logs,
  executionState,
  elapsed,
  executionError,
  requestId,
}: ExecutionConsoleProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  useEffect(() => {
    if (executionState === 'running' || executionState === 'loading') {
      const interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev < activitySteps.length - 1) return prev + 1;
          return activitySteps.length - 1;
        });
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setActiveStepIndex(executionState === 'completed' ? activitySteps.length - 1 : 0);
    }
  }, [executionState]);

  const isActive = executionState === 'running' || executionState === 'loading';
  const isCompleted = executionState === 'completed';
  const isFailed = executionState === 'failed' || executionState === 'error';

  return (
    <div className="execution-console">
      {/* Header */}
      <div className="console-header">
        <div className="console-title">
          <Activity size={14} />
          <span>LIVE EXECUTION</span>
        </div>
        <span className={`console-status ${isActive ? 'running' : isCompleted ? 'completed' : isFailed ? 'failed' : 'idle'}`}>
          <span className="status-dot" />
          {executionState === 'loading' ? 'CONNECTING' :
           executionState === 'running' ? 'RUNNING' :
           executionState === 'completed' ? 'COMPLETED' :
           executionState === 'failed' || executionState === 'error' ? 'FAILED' :
           'IDLE'}
        </span>
      </div>

      {/* Info row */}
      {(isActive || isCompleted || isFailed) && (
        <div className="console-info">
          {requestId && (
            <div className="info-item">
              <span className="info-label">Request</span>
              <span className="info-value mono">{requestId.slice(0, 8)}...</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Started</span>
            <span className="info-value">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Elapsed</span>
            <span className="info-value mono">{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* Activity flow */}
      {isActive && (
        <div className="activity-flow">
          <div className="activity-line" />
          {activitySteps.map((step, index) => {
            const StepIcon = step.icon;
            const isStepActive = index === activeStepIndex;
            const isStepDone = index < activeStepIndex;
            const isStepWaiting = index > activeStepIndex;

            return (
              <div key={step.id} className={`activity-step ${isStepActive ? 'active' : isStepDone ? 'done' : 'waiting'}`}>
                <div className="step-dot">
                  {isStepDone ? (
                    <CheckCircle size={12} />
                  ) : isStepActive ? (
                    <Loader2 size={12} className="spin-icon" />
                  ) : (
                    <StepIcon size={12} />
                  )}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error display */}
      {executionError && (
        <div className="console-error">
          <XCircle size={14} />
          <div>
            <strong>{executionError.type === 'timeout' ? 'Request Timed Out' :
                      executionError.type === 'network' ? 'Connection Error' :
                      executionError.type === 'api' ? 'API Error' : 'Unexpected Error'}</strong>
            <p>{executionError.message}</p>
          </div>
        </div>
      )}

      {/* Success display */}
      {isCompleted && !executionError && (
        <div className="console-success">
          <CheckCircle size={16} />
          <div className="success-content">
            <strong>Execution Completed Successfully</strong>
            <p>Your lead generation workflow has finished. Check the Output tab to view results.</p>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="console-logs">
        <div className="logs-header">
          <span className="logs-label">EVENT LOG</span>
          {isActive && <span className="logs-recording">● Recording</span>}
        </div>
        <div className="logs-list">
          {logs.length === 0 && (
            <span className="logs-empty">{'// waiting for events...'}</span>
          )}
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`log-level ${log.level}`}>
                [{log.level.toUpperCase()}]
              </span>
              {log.nodeId && (
                <span className="log-node">[{log.nodeId}]</span>
              )}
              <span className="log-message">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      <style jsx>{`
        .execution-console {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .console-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .console-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
        }

        .console-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px 3px 8px;
          border-radius: 100px;
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .console-status .status-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }
        .console-status.running {
          background: rgba(255, 255, 255,0.12);
          color: var(--violet-bright);
          border: 1px solid rgba(255, 255, 255,0.2);
        }
        .console-status.running .status-dot {
          background: var(--violet-bright);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .console-status.completed {
          background: rgba(94,234,158,0.1);
          color: var(--status-completed);
          border: 1px solid rgba(94,234,158,0.2);
        }
        .console-status.completed .status-dot { background: var(--status-completed); }
        .console-status.failed {
          background: rgba(248,113,113,0.1);
          color: var(--status-failed);
          border: 1px solid rgba(248,113,113,0.2);
        }
        .console-status.failed .status-dot { background: var(--status-failed); }
        .console-status.idle {
          background: rgba(74,85,120,0.1);
          color: var(--text-tertiary);
          border: 1px solid rgba(74,85,120,0.2);
        }
        .console-status.idle .status-dot { background: var(--text-tertiary); }

        .console-info {
          display: flex;
          gap: 20px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.4);
          border: 1px solid var(--border-subtle);
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .info-label {
          font-size: 8px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .info-value {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .info-value.mono {
          font-family: var(--font-mono);
          font-size: 10px;
        }

        .activity-flow {
          position: relative;
          padding: 4px 0 4px 24px;
        }
        .activity-line {
          position: absolute;
          left: 11px;
          top: 4px;
          bottom: 4px;
          width: 1.5px;
          background: var(--border-subtle);
        }
        .activity-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          position: relative;
        }
        .step-dot {
          position: absolute;
          left: -18px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 10px;
          transition: all var(--duration-normal) ease;
        }
        .activity-step.active .step-dot {
          background: rgba(255, 255, 255,0.15);
          color: var(--violet-bright);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .activity-step.done .step-dot {
          background: rgba(94,234,158,0.12);
          color: var(--status-completed);
        }
        .activity-step.waiting .step-dot {
          background: transparent;
          color: var(--text-muted);
        }
        .step-label {
          font-size: 11px;
          color: var(--text-tertiary);
          transition: color var(--duration-fast) ease;
        }
        .activity-step.active .step-label { color: var(--violet-bright); font-weight: 500; }
        .activity-step.done .step-label { color: var(--status-completed); }
        .spin-icon { animation: spin-slow 1s linear infinite; }

        .console-error {
          display: flex;
          gap: 10px;
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          background: rgba(248,113,113,0.06);
          border: 1px solid rgba(248,113,113,0.2);
          color: var(--status-failed);
        }
        .console-error strong {
          display: block;
          font-size: 12px;
          color: var(--status-failed);
          margin-bottom: 3px;
        }
        .console-error p {
          font-size: 10px;
          color: rgba(248,113,113,0.8);
          margin: 0;
          line-height: 1.5;
        }

        .console-success {
          display: flex;
          gap: 10px;
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          background: rgba(94,234,158,0.06);
          border: 1px solid rgba(94,234,158,0.2);
          color: var(--status-completed);
        }
        .console-success strong {
          display: block;
          font-size: 12px;
          color: var(--status-completed);
          margin-bottom: 3px;
        }
        .console-success p {
          font-size: 10px;
          color: rgba(94,234,158,0.8);
          margin: 0;
          line-height: 1.5;
        }
        .success-content {
          flex: 1;
        }

        .console-logs {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logs-label {
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .logs-recording {
          font-size: 8px;
          font-family: var(--font-mono);
          color: var(--violet-bright);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .logs-list {
          max-height: 180px;
          overflow-y: auto;
          padding: 10px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.6);
          border: 1px solid var(--border-subtle);
          font-family: var(--font-mono);
          font-size: 9px;
          line-height: 1.8;
        }
        .logs-empty {
          color: var(--text-muted);
          font-style: italic;
        }
        .log-entry {
          display: flex;
          gap: 8px;
          padding: 1px 0;
        }
        .log-time { color: var(--text-muted); flex-shrink: 0; }
        .log-level { flex-shrink: 0; }
        .log-level.info { color: var(--status-completed); }
        .log-level.warn { color: var(--status-waiting); }
        .log-level.error { color: var(--status-failed); }
        .log-level.debug { color: var(--violet-bright); }
        .log-node { color: var(--violet-bright); flex-shrink: 0; }
        .log-message { color: var(--text-secondary); }
        /* Execution centerpiece treatment */
        .execution-console { position: relative; }
        .console-header { padding: 12px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: linear-gradient(110deg, rgba(255, 255, 255,0.11), rgba(255, 255, 255,0.12)); }
        .console-info { border-radius: 14px; background: rgba(16, 9, 35, 0.4); border-color: rgba(255,255,255,0.1); }
        .activity-flow { border-radius: 16px; border: 1px solid rgba(255, 255, 255,0.15); background: linear-gradient(145deg, rgba(255, 255, 255,0.07), rgba(255, 255, 255,0.045)); padding: 14px; }
        .console-logs { border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: rgba(13, 7, 31, 0.42); }
        .log-entry { animation: log-arrive 0.25s var(--ease-out); }
        @keyframes log-arrive { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
