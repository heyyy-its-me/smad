'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Table2 } from 'lucide-react';
import type { AgentResult } from '@/lib/types';

interface OutputViewerProps {
  result: AgentResult | null;
  onSendMailToLeads?: (result: AgentResult) => void;
}

interface Lead {
  company_name?: string;
  contact_name?: string;
  job_title?: string;
  email?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  score?: number;
  priority_score?: number;
  lead_score?: number;
  priority?: string;
  Designation?: string;
  'Company Name'?: string;
  'Contact Name'?: string;
  lead_id?: string;
  [key: string]: unknown;
}

interface OutreachUpdate {
  lead_id: string;
  status: 'emailed' | 'failed';
  subject?: string;
}

function getLeads(output: string): Lead[] {
  try {
    const parsed: unknown = JSON.parse(output);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).leads ?? (parsed as Record<string, unknown>).data ?? (parsed as Record<string, unknown>).results)
        : null;
    return Array.isArray(list) && list.every((item) => item && typeof item === 'object') ? list as Lead[] : [];
  } catch { return []; }
}

function getScore(lead: Lead): number {
  return typeof lead.score === 'number' ? lead.score :
         typeof lead.priority_score === 'number' ? lead.priority_score :
         typeof lead.lead_score === 'number' ? lead.lead_score : 0;
}

function getPriority(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'HIGH', color: 'var(--status-completed)' };
  if (score >= 50) return { label: 'MED', color: 'var(--status-waiting)' };
  return { label: 'LOW', color: 'var(--text-muted)' };
}

function getCompanyInitial(lead: Lead): string {
  const name = (lead.company_name ?? lead['Company Name'] ?? '') as string;
  return name ? name.charAt(0).toUpperCase() : '?';
}

export default function OutputViewer({ result, onSendMailToLeads }: OutputViewerProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [outreachUpdates, setOutreachUpdates] = useState<Record<string, OutreachUpdate>>({});

  useEffect(() => {
    if (result?.agentId !== 'leads' || !result.executionId) return;

    let cancelled = false;
    const loadOutreach = async () => {
      try {
        const response = await fetch(`/api/outreach/results/${result.executionId}`);
        if (!response.ok) return;
        const payload = await response.json() as { updates?: OutreachUpdate[] };
        if (!cancelled && Array.isArray(payload.updates)) {
          setOutreachUpdates(Object.fromEntries(payload.updates.map((update) => [update.lead_id, update])));
        }
      } catch {
        // Lead results remain usable if outreach status is temporarily unavailable.
      }
    };

    void loadOutreach();
    const interval = window.setInterval(loadOutreach, 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [result?.agentId, result?.executionId]);

  if (!result) {
    return (
      <div className="empty-state">
        <FileText size={24} />
        <p>Run a test to see the final workflow output.</p>
        <style jsx>{`
          .empty-state {
            text-align: center; padding: 40px 20px; color: var(--text-tertiary);
            display: flex; flex-direction: column; align-items: center; gap: 10px;
          }
          /* Outcome showcase treatment */
        .metrics-bar { border-radius: 16px; background: #202020; border-color: rgba(255,255,255,0.15); box-shadow: 0 12px 26px rgba(19,8,42,0.16); }
        .metric { transition: transform var(--duration-fast) var(--ease-out); }
        .metric:hover { transform: translateY(-3px) scale(1.04); }
        .lead-table-wrapper { border-radius: 16px; background: rgba(14,8,34,0.28); }
        .lead-table tbody tr { animation: row-enter 0.38s var(--ease-out) both; }
        .lead-table tbody tr:hover td { background: rgba(255,255,255,0.065); }
        .cell-initial { width: 32px; }
        .cell-initial::first-letter { display: inline-grid; }
        .score-pill { box-shadow: 0 4px 12px rgba(0,0,0,0.14); }
        @keyframes row-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      </div>
    );
  }

  const finalOutput = result.nodes.map((node) => node.output).filter(Boolean).at(-1) ?? '';
  const leads = getLeads(finalOutput);
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => getScore(l) >= 50).length;
  const highPriorityLeads = leads.filter((l) => getScore(l) >= 80).length;

  const startTime = result.startTime ?? Date.now();
  const endTime = result.endTime ?? Date.now();
  const totalDuration = endTime - startTime;

  return (
    <div className="output-viewer">
      {/* Metrics bar */}
      {leads.length > 0 && (
        <div className="metrics-bar">
          <div className="metric">
            <span className="metric-value">{totalLeads}</span>
            <span className="metric-label">LEADS FOUND</span>
          </div>
          <div className="metric-divider" />
          <div className="metric">
            <span className="metric-value qualified">{qualifiedLeads}</span>
            <span className="metric-label">QUALIFIED</span>
          </div>
          <div className="metric-divider" />
          <div className="metric">
            <span className="metric-value high-priority">{highPriorityLeads}</span>
            <span className="metric-label">HIGH PRIORITY</span>
          </div>
          <div className="metric-divider" />
          <div className="metric">
            <span className="metric-value duration">{(totalDuration / 1000).toFixed(1)}s</span>
            <span className="metric-label">DURATION</span>
          </div>
        </div>
      )}

      {result.agentId === 'leads' && leads.length > 0 && (
        <div className="outreach-cta">
          <div>
            <strong>Ready to contact these leads?</strong>
            <p>Review the results, then continue to Outreach to send the emails.</p>
          </div>
          <button onClick={() => onSendMailToLeads?.(result)}>
            Send mail to {totalLeads} lead{totalLeads === 1 ? '' : 's'}
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          <Table2 size={14} />
          <span>Lead Table</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          <FileText size={14} />
          <span>Raw Output</span>
        </button>
      </div>

      {/* Table view */}
      {activeTab === 'table' && leads.length > 0 && (
        <div className="lead-table-wrapper">
          <table className="lead-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Company</th>
                <th>Contact</th>
                <th>Title</th>
                <th>Score</th>
                <th>Outreach</th>
                <th style={{ width: 24 }}></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => {
                const score = getScore(lead);
                const priority = getPriority(score);
                const isExpanded = expandedRow === index;
                const leadId = String(lead.lead_id ?? lead['Lead ID'] ?? lead.email ?? '');
                const outreach = outreachUpdates[leadId];
                return (
                  <tr key={index}>
                    <td className="cell-initial">{getCompanyInitial(lead)}</td>
                    <td className="cell-company">{lead.company_name ?? lead['Company Name'] ?? '—'}</td>
                    <td className="cell-contact">{lead.contact_name ?? lead['Contact Name'] ?? '—'}</td>
                    <td className="cell-title">{lead.job_title ?? lead.Designation ?? '—'}</td>
                    <td className="cell-score">
                      <span className="score-pill" style={{ background: priority.color + '18', color: priority.color, borderColor: priority.color + '30' }}>
                        {score > 0 ? score : '—'}
                      </span>
                      <span className={`priority-tag ${priority.label.toLowerCase()}`}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="cell-outreach" title={outreach?.subject}>
                      <span className={`outreach-status ${outreach?.status ?? 'pending'}`}>
                        {outreach?.status === 'emailed' ? 'Emailed' : outreach?.status === 'failed' ? 'Failed' : 'Ready to send'}
                      </span>
                    </td>
                    <td>
                      <button className="expand-btn" onClick={() => setExpandedRow(isExpanded ? null : index)}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw output */}
      {activeTab === 'raw' && (
        <pre className="raw-output">{finalOutput || JSON.stringify(result.nodes, null, 2)}</pre>
      )}

      {/* Execution details */}
      <details className="exec-details">
        <summary className="exec-summary">
          Execution details · {result.logs.length} log entries
        </summary>
        <div className="exec-logs">
          {result.logs.map((log, index) => (
            <div key={index} className="exec-log-entry">
              <span className="exec-log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={`exec-log-level ${log.level}`}>[{log.level}]</span>
              <span className="exec-log-msg">{log.message}</span>
            </div>
          ))}
        </div>
      </details>

      <style jsx>{`
        .output-viewer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .metrics-bar {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 16px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.3);
          border: 1px solid var(--border-subtle);
        }
        .metric {
          flex: 1;
          text-align: center;
        }
        .metric-value {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          animation: count-up 0.4s var(--ease-out);
        }
        .metric-value.qualified { color: var(--status-waiting); }
        .metric-value.high-priority { color: var(--status-completed); }
        .metric-value.duration { color: var(--violet-bright); font-family: var(--font-mono); font-size: 18px; }
        .metric-label {
          display: block;
          font-size: 8px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .metric-divider {
          width: 1px;
          height: 36px;
          background: var(--border-subtle);
        }
        .outreach-cta {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 14px 16px; border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-sm); background: #202020;
        }
        .outreach-cta strong { font-size: 12px; color: var(--text-primary); }
        .outreach-cta p { margin: 3px 0 0; font-size: 10px; color: var(--text-tertiary); }
        .outreach-cta button { flex-shrink: 0; border: 0; border-radius: 7px; padding: 9px 12px; background: #f5f5f5; color: #111; font-size: 10px; font-weight: 700; cursor: pointer; }
        .outreach-cta button:hover { filter: brightness(1.08); }
        .tab-bar {
          display: flex;
          gap: 2px;
          padding: 3px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.4);
          border: 1px solid var(--border-subtle);
          width: fit-content;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
        }
        .tab-btn.active {
          background: var(--bg-hover);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .tab-btn:hover:not(.active) { color: var(--text-secondary); }
        .lead-table-wrapper {
          overflow-x: auto;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .lead-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          min-width: 600px;
        }
        .lead-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          background: rgba(6, 11, 30, 0.4);
          border-bottom: 1px solid var(--border-subtle);
        }
        .lead-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          transition: background var(--duration-fast) ease;
        }
        .lead-table tbody tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        .cell-initial {
          width: 32px;
          font-size: 10px;
          font-weight: 700;
          color: var(--violet-bright);
          text-align: center;
        }
        .cell-company {
          font-weight: 600;
          color: var(--text-primary);
        }
        .cell-title {
          color: var(--text-tertiary);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cell-score {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cell-outreach { white-space: nowrap; }
        .outreach-status { display: inline-flex; padding: 3px 7px; border-radius: 999px; font-size: 9px; font-family: var(--font-mono); }
        .outreach-status.pending { color: var(--text-muted); background: rgba(148,163,184,.12); }
        .outreach-status.emailed { color: var(--status-completed); background: rgba(94,234,158,.12); }
        .outreach-status.failed { color: var(--status-failed); background: rgba(251,113,133,.12); }
        .score-pill {
          display: inline-flex;
          align-items: center;
          padding: 1px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          font-family: var(--font-mono);
          border: 1px solid;
          min-width: 32px;
          justify-content: center;
        }
        .priority-tag {
          font-size: 8px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .priority-tag.high { background: rgba(94,234,158,0.1); color: var(--status-completed); }
        .priority-tag.med { background: rgba(251,191,36,0.1); color: var(--status-waiting); }
        .priority-tag.low { background: rgba(74,85,120,0.1); color: var(--text-muted); }
        .expand-btn {
          display: grid; place-items: center;
          width: 24px; height: 24px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all var(--duration-fast) ease;
        }
        .expand-btn:hover {
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
        }
        .raw-output {
          padding: 16px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.6);
          border: 1px solid var(--border-subtle);
          font-family: var(--font-mono);
          font-size: 10px;
          line-height: 1.6;
          color: var(--text-secondary);
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 400px;
          overflow-y: auto;
        }
        .exec-details {
          border-top: 1px solid var(--border-subtle);
          padding-top: 12px;
        }
        .exec-summary {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          cursor: pointer;
          user-select: none;
        }
        .exec-summary:hover { color: var(--text-tertiary); }
        .exec-logs {
          margin-top: 8px;
          max-height: 160px;
          overflow-y: auto;
          padding: 10px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.4);
          font-family: var(--font-mono);
          font-size: 9px;
          line-height: 1.8;
        }
        .exec-log-entry { display: flex; gap: 8px; padding: 1px 0; }
        .exec-log-time { color: var(--text-muted); flex-shrink: 0; }
        .exec-log-level { flex-shrink: 0; }
        .exec-log-level.info { color: var(--status-completed); }
        .exec-log-level.warn { color: var(--status-waiting); }
        .exec-log-level.error { color: var(--status-failed); }
        .exec-log-level.debug { color: var(--violet-bright); }
        .exec-log-msg { color: var(--text-secondary); }
        /* Outcome showcase treatment */
        .metrics-bar { border-radius: 16px; background: #202020; border-color: rgba(255,255,255,0.15); box-shadow: 0 12px 26px rgba(19,8,42,0.16); }
        .metric { transition: transform var(--duration-fast) var(--ease-out); }
        .metric:hover { transform: translateY(-3px) scale(1.04); }
        .lead-table-wrapper { border-radius: 16px; background: rgba(14,8,34,0.28); }
        .lead-table tbody tr { animation: row-enter 0.38s var(--ease-out) both; }
        .lead-table tbody tr:hover td { background: rgba(255,255,255,0.065); }
        .cell-initial { width: 32px; }
        .cell-initial::first-letter { display: inline-grid; }
        .score-pill { box-shadow: 0 4px 12px rgba(0,0,0,0.14); }
        @keyframes row-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
