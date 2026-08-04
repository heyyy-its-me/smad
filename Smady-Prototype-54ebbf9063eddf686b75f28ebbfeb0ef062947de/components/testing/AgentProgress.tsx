'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { runner } from '@/lib/runner';
import type { AgentExecution, AgentResult, LogEntry, RunnerEvent, ExecutionState, ExecutionError } from '@/lib/types';
import type { ICPRequestPayload, ICPRecommendationResponse } from '@/lib/icp-api-client';
import { requestICPRecommendation } from '@/lib/icp-api-client';
import RunButton from './RunButton';
import ExecutionConsole from './ExecutionConsole';
import OutputViewer from './OutputViewer';
import ICPOutputViewer from './ICPOutputViewer';

interface AgentProgressProps {
  agentId: string;
  payload?: Record<string, unknown>;
  icpFormData?: ICPRequestPayload;
  onPrepareRun?: () => Record<string, unknown>;
  onRunningChange?: (running: boolean) => void;
  onResult?: (result: AgentResult) => void;
  onICPResult?: (result: ICPRecommendationResponse) => void;
  onSendMailToLeads?: (result: AgentResult) => void;
  actionLabel?: string;
  runDisabled?: boolean;
}

export default function AgentProgress({
  agentId,
  payload,
  icpFormData,
  onPrepareRun,
  onRunningChange,
  onResult,
  onICPResult,
  onSendMailToLeads,
  actionLabel,
  runDisabled,
}: AgentProgressProps) {
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [icpResult, setICPResult] = useState<ICPRecommendationResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState<'console' | 'output'>('console');
  const [execState, setExecState] = useState<ExecutionState>('idle');
  const [execError, setExecError] = useState<ExecutionError | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to runner events
  useEffect(() => {
    const unsub = runner.on((event: RunnerEvent) => {
      if (event.type === 'execution-start') {
        const current = runner.getResult();
        if (current) {
          setExecution({
            id: current.executionId,
            agentId: current.agentId,
            status: runner.status ?? 'running',
            nodes: current.nodes,
            startTime: current.startTime,
            endTime: runner.status === 'running' ? null : current.endTime,
            logs: current.logs,
          });
          setLogs(current.logs);
        }
        setResult(null);
        setElapsed(0);
        setExecState('running');
        setExecError(null);
        onRunningChange?.(true);
      }
      if (event.type === 'execution-error') {
        const error = event.data as ExecutionError;
        setExecError(error);
        setExecState('error');
        onRunningChange?.(false);
      }
      if (event.type === 'log' && event.data) {
        setLogs((prev) => [...prev, event.data as LogEntry]);
      }
      if (event.type === 'node-start' || event.type === 'node-complete' || event.type === 'node-error') {
        const current = runner.getResult();
        if (current) {
          setExecution({
            id: current.executionId,
            agentId: current.agentId,
            status: current.success ? 'completed' : 'running',
            nodes: current.nodes,
            startTime: current.startTime,
            endTime: current.endTime,
            logs: current.logs,
          });
        }
      }
      if (event.type === 'execution-complete' || event.type === 'execution-cancelled') {
        const res = runner.getResult();
        if (res) {
          setResult(res);
          onResult?.(res);
          setExecution({
            id: res.executionId,
            agentId: res.agentId,
            status: res.success ? 'completed' : 'failed',
            nodes: res.nodes,
            startTime: res.startTime,
            endTime: res.endTime,
            logs: res.logs,
          });
          setExecState(res.success ? 'completed' : 'failed');
          // Clear error when execution completes successfully
          if (res.success) {
            setExecError(null);
          }
        }
        onRunningChange?.(false);
      }
    });
    return () => unsub();
  }, [onRunningChange, onResult]);

  // Sync state on mount
  useEffect(() => {
    const current = runner.getResult();
    if (current && current.agentId === agentId) {
      setResult(current);
      setExecution({
        id: current.executionId,
        agentId: current.agentId,
        status: current.success ? 'completed' : 'failed',
        nodes: current.nodes,
        startTime: current.startTime,
        endTime: current.endTime,
        logs: current.logs,
      });
      setExecState(current.success ? 'completed' : 'failed');
      setLogs(current.logs);
      setExecError(runner.error);
    } else {
      setResult(null);
      setExecution(null);
      setLogs([]);
      setExecState('idle');
      setExecError(null);
    }
  }, [agentId, payload]);

  // Auto-switch to output view when leads complete
  useEffect(() => {
    if (execState === 'completed' && result && agentId === 'leads') {
      // Auto-switch to output view to show leads table
      setView('output');
    }
  }, [execState, result, agentId]);

  // Timer for elapsed time
  useEffect(() => {
    if (execution?.status === 'running') {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [execution?.status]);

  const handleRun = useCallback(async () => {
    setView('console');
    setExecState('running');
    setExecError(null);

    // Handle ICP agent differently - call API directly
    if (agentId === 'icp' && icpFormData) {
      try {
        onRunningChange?.(true);
        const result = await requestICPRecommendation(icpFormData);
        setICPResult(result);
        setExecState(result.status === 'success' ? 'completed' : 'failed');
        onICPResult?.(result);
        if (result.status === 'error') {
          setExecError({
            type: 'api',
            message: result.message || 'ICP analysis failed',
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setExecError({
          type: 'unknown',
          message: errorMsg,
        });
        setExecState('failed');
      } finally {
        onRunningChange?.(false);
      }
      return;
    }

    // Handle other agents via runner
    try {
      if (agentId === 'leads') {
        const payloadForRun = onPrepareRun?.() ?? payload;
        await runner.start('leads', payloadForRun);
      } else {
        await runner.start(agentId, payload);
      }
    } catch {
      // handled via events
    }
  }, [agentId, icpFormData, onPrepareRun, payload, onRunningChange, onICPResult]);

  const handleCancel = useCallback(() => {
    runner.cancel();
  }, []);

  const isRunning = runner.isRunning;

  // Determine the run button state
  const runButtonState = (() => {
    if (execState === 'running') return 'running' as const;
    if (execState === 'completed') return 'completed' as const;
    if (execState === 'failed' || execState === 'error') return 'failed' as const;
    return 'idle' as const;
  })();

  // Get request ID
  const requestId = execution?.id?.startsWith('connecting-') || execution?.id?.startsWith('error-')
    ? null
    : execution?.id ?? null;

  return (
    <div className="agent-progress">
      {/* Run button area */}
      <div className="action-bar">
        <RunButton
          state={runButtonState}
          onRun={handleRun}
          onCancel={handleCancel}
          idleLabel={actionLabel}
          disabled={runDisabled}
        />
        {runButtonState === 'running' && (
          <span className="elapsed-timer">
            {(elapsed / 1000).toFixed(1)}s elapsed
          </span>
        )}
      </div>

      {/* View toggle when there's a result (NOT for completed leads) */}
      {(result || icpResult) && !isRunning && execState !== 'running' && !(agentId === 'leads' && execState === 'completed') && (
        <div className="view-toggle">
          <button
            onClick={() => setView('console')}
            className={view === 'console' ? 'active' : ''}
          >
            Execution Console
          </button>
          <button
            onClick={() => setView('output')}
            className={view === 'output' ? 'active' : ''}
          >
            Output
          </button>
        </div>
      )}

      {/* For leads agent on completion: show metrics + full table layout */}
      {agentId === 'leads' && execState === 'completed' && result && (
        <>
          {/* Success metrics on right */}
          <div className="leads-completion-card">
            <div className="success-badge">
              <div className="success-icon">✓</div>
              <div className="success-text">
                <h3>Lead Generation Complete</h3>
                <div className="success-metrics">
                  <div className="metric">
                    <span className="metric-label">Total Leads Found</span>
                    <span className="metric-value">{result.nodes[0]?.output ? (() => {
                      try {
                        const parsed = JSON.parse(result.nodes[0].output);
                        const list = Array.isArray(parsed) ? parsed : parsed?.leads ?? parsed?.data ?? [];
                        return Array.isArray(list) ? list.length : 0;
                      } catch { return 0; }
                    })() : 0}</span>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric">
                    <span className="metric-label">Ready to Contact</span>
                    <span className="metric-value qualified">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full leads table below */}
          <div className="leads-table-container">
            <OutputViewer result={result} onSendMailToLeads={onSendMailToLeads} />
          </div>
        </>
      )}

      {/* Execution Console */}
      {view === 'console' && (
        <div className="card execution-card">
          <ExecutionConsole
            logs={logs}
            executionState={execState}
            elapsed={elapsed}
            executionError={execError}
            requestId={requestId}
          />
        </div>
      )}

      {/* Output (for non-leads or non-completed) */}
      {view === 'output' && (
        <div className="card output-card">
          {agentId === 'icp' && icpResult ? (
            <ICPOutputViewer result={icpResult} />
          ) : result ? (
            <OutputViewer result={result} onSendMailToLeads={onSendMailToLeads} />
          ) : null}
        </div>
      )}

      {/* Idle state */}
      {!result && !icpResult && !isRunning && execState === 'idle' && !execError && (
        <div className="idle-prompt">
          <div className="idle-icon">✦</div>
          <h3>Ready to test</h3>
          <p>
            Configure your input above and click <strong>Run Agent</strong> to start the
            execution.
          </p>
        </div>
      )}

      <style jsx>{`
        .agent-progress {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .action-bar {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .elapsed-timer {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .view-toggle {
          display: flex;
          gap: 2px;
          padding: 3px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.4);
          border: 1px solid var(--border-subtle);
          width: fit-content;
        }
        .view-toggle button {
          padding: 6px 14px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          transition: all var(--duration-fast) ease;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .view-toggle button.active {
          background: var(--bg-hover);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .view-toggle button:hover:not(.active) {
          color: var(--text-secondary);
        }
        .execution-card, .output-card {
          padding: 20px;
        }
        .idle-prompt {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
        }
        .idle-icon {
          font-size: 32px;
          color: var(--violet-bright);
          opacity: 0.4;
          margin-bottom: 12px;
        }
        .idle-prompt h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0 0 6px;
        }
        .idle-prompt p {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0;
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .idle-prompt strong {
          color: var(--violet-bright);
        }
        .leads-completion-card {
          padding: 24px;
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .success-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(74, 222, 128, 0.3);
        }
        .success-text h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px;
        }
        .success-metrics {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }
        .metric-value.qualified {
          color: var(--status-waiting);
        }
        .metric-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
        }
        .leads-table-container {
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
