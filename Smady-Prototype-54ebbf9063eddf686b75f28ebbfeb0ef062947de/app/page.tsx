"use client";

import { useCallback, useMemo, useState } from "react";
import Sidebar from "@/components/testing/Sidebar";
import TopBar from "@/components/testing/TopBar";
import AgentPipeline, { agents } from "@/components/testing/AgentPipeline";
import AgentHeader from "@/components/testing/AgentHeader";
import LeadForm from "@/components/testing/LeadForm";
import ICPForm from "@/components/testing/ICPForm";
import MeetingForm from "@/components/testing/MeetingForm";
import ProposalForm from "@/components/testing/ProposalForm";
import AgentProgress from "@/components/testing/AgentProgress";
import PortalBackdrop from "@/components/testing/PortalBackdrop";
import type { AgentResult } from "@/lib/types";
import type { ICPRequestPayload, ICPRecommendationResponse } from "@/lib/icp-api-client";
import {
  extractRecommendedIndustries,
  extractTargetRegions,
  extractBuyerRoles,
  estimateCompanySize,
} from "@/lib/icp-api-client";

type LeadFormData = {
  industry: string;
  roles: string;
  region: string;
  cities: string;
  states: string;
  company_size: string;
  business_context: string;
};

const initialLeadForm: LeadFormData = {
  industry: "Logistics & Supply Chain",
  roles: "Fleet Manager, Director of Operations",
  region: "Canada",
  cities: "Toronto",
  states: "",
  company_size: "51-200",
  business_context: "",
};

const initialICPForm: ICPRequestPayload = {
  product_description: "",
  target_geography: "United States",
  business_stage: "Growth",
  priority: "High",
  company_name: "",
  product_name: "",
};

const split = (value: string) =>
  value.split(",").map((part) => part.trim()).filter(Boolean);

const buildLeadPayload = (form: LeadFormData, requestId: string) => ({
  request_id: requestId,
  industry: split(form.industry),
  roles: split(form.roles),
  region: split(form.region),
  cities: split(form.cities),
  states: split(form.states),
  company_size: split(form.company_size),
  business_context: form.business_context,
});

export default function Home() {
  const [active, setActive] = useState("leads");
  const [manual, setManual] = useState(true);
  const [leadForm, setLeadForm] = useState<LeadFormData>(initialLeadForm);
  const [icpForm, setICPForm] = useState<ICPRequestPayload>(initialICPForm);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [run, setRun] = useState(false);
  const [sidebarView, setSidebarView] = useState("studio");
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [leadResult, setLeadResult] = useState<AgentResult | null>(null);
  const [icpResult, setICPResult] = useState<ICPRecommendationResponse | null>(null);

  const agent = agents.find((item) => item.id === active) ?? agents[1];

  const leadPayload = useMemo(
    () => buildLeadPayload(leadForm, requestId),
    [leadForm, requestId]
  );

  const createLeadPayloadForRun = useCallback(() => {
    const nextRequestId = crypto.randomUUID();
    setRequestId(nextRequestId);
    return buildLeadPayload(leadForm, nextRequestId);
  }, [leadForm]);

  const updateLead = (key: keyof LeadFormData, value: string) =>
    setLeadForm((current) => ({ ...current, [key]: value }));

  const updateICP = (key: keyof ICPRequestPayload, value: string) =>
    setICPForm((current) => ({ ...current, [key]: value }));

  /**
   * Auto-fill Lead Management form from ICP results
   */
  const autofillLeadFormFromICP = (icpResponse: ICPRecommendationResponse) => {
    const industry = extractRecommendedIndustries(icpResponse);
    const region = extractTargetRegions(icpResponse);
    const roles = extractBuyerRoles(icpResponse);
    const companySize = estimateCompanySize(icpResponse);

    setLeadForm((current) => ({
      ...current,
      ...(industry && { industry }),
      ...(region && { region }),
      ...(roles && { roles }),
      ...(companySize && { company_size: companySize }),
    }));
  };

  const getLeadsFromResult = (result: AgentResult | null) => {
    if (!result) return [];
    try {
      const output = result.nodes.map((node) => node.output).filter(Boolean).at(-1) ?? "";
      const parsed = JSON.parse(output) as Record<string, unknown>;
      const leads = parsed.leads ?? parsed.data ?? parsed.results;
      return Array.isArray(leads) ? leads : [];
    } catch { return []; }
  };

  const outreachLeads = getLeadsFromResult(leadResult);
  const outreachPayload = leadResult ? { request_id: leadResult.executionId, leads: outreachLeads } : undefined;

  const openOutreach = (result: AgentResult) => {
    setLeadResult(result);
    setActive("outreach");
  };

  const handleAgentSelect = (id: string) => {
    setActive(id);
    // When selecting leads after ICP analysis, auto-fill the form
    if (id === "leads" && icpResult) {
      autofillLeadFormFromICP(icpResult);
    }
  };

  const handleRunningChange = (isRunning: boolean) => {
    setRun(isRunning);
    setRunningAgent(isRunning ? active : null);
  };

  return (
    <div className="app-shell">
      <PortalBackdrop />
      <Sidebar activeView={sidebarView} onViewChange={setSidebarView} />

      <div className="main-area">
        <TopBar
          agentTitle={agent.title}
          status={agent.status}
          isRunning={run}
        />

        <div className="main-content">
          {/* Agent Pipeline */}
          <AgentPipeline
            active={active}
            onSelect={handleAgentSelect}
            runningAgent={runningAgent}
          />

          {/* Agent Header */}
          <AgentHeader
            agent={agent}
            runStatus={run ? "running" : "idle"}
          />

          {/* Input + Execution grid */}
          <div className="workspace-grid">
            {/* Left: Input area */}
            <div className="input-panel card">
              <div className="input-panel-header">
                <div className="input-panel-title">
                  <span className="input-badge">INPUT</span>
                  <h3>Test configuration</h3>
                </div>
                <div className="input-mode-switch">
                  <button
                    className={!manual ? "active" : ""}
                    onClick={() => setManual(false)}
                  >
                    ⚡ Upstream
                  </button>
                  <button
                    className={manual ? "active" : ""}
                    onClick={() => setManual(true)}
                  >
                    ✎ Manual
                  </button>
                </div>
              </div>

              {manual && active === "icp" ? (
                <div className="input-body">
                  <ICPForm payload={icpForm} onChange={updateICP} />
                </div>
              ) : manual && active === "leads" ? (
                <div className="input-body">
                  <LeadForm
                    values={leadForm}
                    onChange={updateLead}
                    payload={leadPayload}
                  />
                  {icpResult && (
                    <div className="upstream-note">
                      <span>💡 Fields auto-filled from Strategy analysis</span>
                      <button
                        className="refill-btn"
                        onClick={() => autofillLeadFormFromICP(icpResult)}
                      >
                        Refill from Strategy
                      </button>
                    </div>
                  )}
                  <div className="input-footer">
                    <div className="source-drop">
                      <span className="source-icon">↑</span>
                      <div>
                        <strong>Upload CSV</strong>
                        <small>Attach a lead seed file</small>
                      </div>
                    </div>
                    <div className="source-drop">
                      <span className="source-icon">◴</span>
                      <div>
                        <strong>Previous output</strong>
                        <small>Choose a saved test result</small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : active === "outreach" ? (
                <div className="automatic-mode">
                  <div className="auto-icon">Mail</div>
                  <div>
                    <strong>{outreachLeads.length ? `${outreachLeads.length} leads ready for outreach` : "No lead results selected"}</strong>
                    <p>{outreachLeads.length ? "Email is sent only after you click Send emails to leads." : "Return to Lead Management, run it, then choose Send mail to leads."}</p>
                  </div>
                </div>
              ) : active === "meeting" ? (
                <div className="input-body">
                  <MeetingForm />
                </div>
              ) : active === "proposal" ? (
                <div className="input-body">
                  <ProposalForm />
                </div>
              ) : (
                <div className="automatic-mode">
                  <div className="auto-icon">↯</div>
                  <div>
                    <strong>
                      {manual
                        ? "Manual test input"
                        : "Waiting for upstream output"}
                    </strong>
                    <p>
                      {manual
                        ? "This agent retains its configured test controls."
                        : "The next run will use the preceding agent's real output."}
                    </p>
                  </div>
                  <button className="btn-secondary">Configure input</button>
                </div>
              )}

              <div className="input-status-bar">
                <span className="status-note">
                  ⌁ Lead Management stays RUNNING until n8n returns its final
                  workflow response.
                </span>
              </div>
            </div>

            {/* Right: Execution area */}
            <div className="execution-panel">
              <div className="execution-label-bar">
                <span>LIVE EXECUTION</span>
                <span className={run ? "status-running" : "status-idle"}>
                  {run ? "ACTIVE" : "IDLE"}
                </span>
              </div>
              <div className="card execution-card">
                <AgentProgress
                  agentId={active}
                  icpFormData={active === "icp" ? icpForm : undefined}
                  payload={active === "leads" ? leadPayload : active === "outreach" ? outreachPayload : undefined}
                  onPrepareRun={active === "leads" ? createLeadPayloadForRun : undefined}
                  onRunningChange={handleRunningChange}
                  onResult={(result) => {
                    if (result.agentId === "leads") setLeadResult(result);
                  }}
                  onICPResult={(result) => {
                    setICPResult(result);
                    // Auto-switch to leads and fill form
                    autofillLeadFormFromICP(result);
                    setActive("leads");
                  }}
                  onSendMailToLeads={openOutreach}
                  actionLabel={active === "outreach" ? `SEND EMAILS TO ${outreachLeads.length} LEAD${outreachLeads.length === 1 ? "" : "S"}` : undefined}
                  runDisabled={active === "outreach" && outreachLeads.length === 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-shell {
          display: flex;
          min-height: 100vh;
          background: transparent;
          position: relative;
          isolation: isolate;
        }

        .main-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          padding: 28px 32px 40px;
          max-width: 1680px;
          width: 100%;
          margin: 0 auto;
          overflow-y: auto;
        }

        /* Workspace grid */
        .workspace-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 20px;
          align-items: stretch;
          min-height: 100%;
        }

        /* Input panel */
        .input-panel {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .input-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .input-panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-badge {
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--violet-bright);
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .input-panel-title h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .input-mode-switch {
          display: flex;
          gap: 2px;
          padding: 3px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.4);
          border: 1px solid var(--border-subtle);
        }

        .input-mode-switch button {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-tertiary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
        }

        .input-mode-switch button.active {
          background: var(--bg-hover);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .input-mode-switch button:hover:not(.active) {
          color: var(--text-secondary);
        }

        .input-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .input-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }

        .source-drop {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.3);
          cursor: pointer;
          transition: all var(--duration-fast) ease;
        }

        .source-drop:hover {
          border-color: var(--violet);
          background: rgba(255, 255, 255, 0.04);
        }

        .source-icon {
          font-size: 16px;
          color: var(--violet-bright);
          flex-shrink: 0;
        }

        .source-drop strong {
          display: block;
          font-size: 10px;
          color: var(--text-secondary);
        }

        .source-drop small {
          display: block;
          font-size: 9px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .input-status-bar {
          padding: 12px 20px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(6, 11, 30, 0.3);
          flex-shrink: 0;
          margin-top: auto;
        }

        .status-note {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .upstream-note {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .refill-btn {
          padding: 5px 10px;
          border-radius: 4px;
          background: var(--violet-bright);
          color: white;
          border: none;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          white-space: nowrap;
        }

        .refill-btn:hover {
          filter: brightness(1.1);
        }

        /* Automatic mode */
        .automatic-mode {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px;
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.04);
          flex-shrink: 0;
        }

        .auto-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.1);
          color: var(--violet-bright);
          font-size: 18px;
          flex-shrink: 0;
        }

        .automatic-mode strong {
          font-size: 12px;
          color: var(--text-primary);
        }

        .automatic-mode p {
          margin: 3px 0 0;
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .btn-secondary {
          margin-left: auto;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          flex-shrink: 0;
        }

        .btn-secondary:hover {
          border-color: var(--violet);
          background: rgba(255, 255, 255, 0.06);
          color: var(--violet-bright);
        }

        /* Execution panel */
        .execution-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 100%;
          overflow-y: auto;
        }

        .execution-label-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .execution-label-bar .status-running {
          color: var(--violet-bright);
          font-size: 8px;
        }

        .execution-label-bar .status-idle {
          color: var(--text-muted);
          font-size: 8px;
        }

        .execution-card {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .main-content {
            padding: 24px 20px;
          }
          .workspace-grid {
            grid-template-columns: minmax(0, 1fr) 340px;
          }
        }

        @media (max-width: 860px) {
          .workspace-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .main-content {
            padding: 16px;
          }
          .input-footer {
            grid-template-columns: 1fr;
          }
          .input-panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

