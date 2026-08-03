'use client';

import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { ICPRecommendationResponse } from '@/lib/icp-api-client';
import { isPartialFailure } from '@/lib/icp-api-client';

interface ICPOutputViewerProps {
  result: ICPRecommendationResponse | null;
}

export default function ICPOutputViewer({ result }: ICPOutputViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['analysis', 'gtm', 'primary_icp', 'buyer_persona'])
  );

  if (!result) {
    return (
      <div className="empty-state">
        <CheckCircle2 size={24} />
        <p>Run ICP Analysis to see strategy recommendations.</p>
        <style jsx>{`
          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-tertiary);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
        `}</style>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isPartial = isPartialFailure(result);
  const statusIcon = result.status === 'success' ? (
    <CheckCircle2 size={16} style={{ color: 'var(--status-completed)' }} />
  ) : (
    <AlertCircle size={16} style={{ color: 'var(--status-failed)' }} />
  );

  return (
    <div className="icp-output">
      {/* Header with Status */}
      <div className="output-header">
        <div className="status-badge">
          {statusIcon}
          <span>
            {result.status === 'success' ? 'Analysis Complete' : 'Analysis Failed'}
            {isPartial && ' (Partial)'}
          </span>
        </div>
        {result.status === 'error' && result.message && (
          <div className="error-message">{result.message}</div>
        )}
        {isPartial && (
          <div className="warning-message">
            Some enrichment fields could not be generated. Showing available data.
          </div>
        )}
        {result.confidence_score !== undefined && (
          <div className="confidence-score">
            Confidence: <strong>{(result.confidence_score * 100).toFixed(0)}%</strong>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      {result.analysis && (
        <section className="output-section">
          <button
            className="section-header"
            onClick={() => toggleSection('analysis')}
          >
            {expandedSections.has('analysis') ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <h3>Product & Market Analysis</h3>
          </button>
          {expandedSections.has('analysis') && (
            <div className="section-content">
              <div className="analysis-grid">
                {result.analysis.company_name && (
                  <div className="info-card">
                    <span className="label">Company Name</span>
                    <span className="value">{result.analysis.company_name}</span>
                  </div>
                )}
                {result.analysis.product_name && (
                  <div className="info-card">
                    <span className="label">Product Name</span>
                    <span className="value">{result.analysis.product_name}</span>
                  </div>
                )}
                {result.analysis.technical_complexity && (
                  <div className="info-card">
                    <span className="label">Technical Complexity</span>
                    <span className="value">{result.analysis.technical_complexity}</span>
                  </div>
                )}
                {result.analysis.recommended_segment && (
                  <div className="info-card full-width">
                    <span className="label">Recommended Market Segment</span>
                    <span className="value multi-line">
                      {result.analysis.recommended_segment}
                    </span>
                  </div>
                )}
              </div>

              {result.analysis.positioning && (
                <div className="text-section">
                  <h4>Positioning</h4>
                  <p>{result.analysis.positioning}</p>
                </div>
              )}

              {result.analysis.differentiator && (
                <div className="text-section">
                  <h4>Key Differentiator</h4>
                  <p>{result.analysis.differentiator}</p>
                </div>
              )}

              {result.analysis.core_problem && (
                <div className="text-section">
                  <h4>Core Problem</h4>
                  <p>{result.analysis.core_problem}</p>
                </div>
              )}

              {result.analysis.buyer_pain && (
                <div className="text-section">
                  <h4>Buyer Pain Points</h4>
                  <p>{result.analysis.buyer_pain}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* GTM Strategy Section */}
      {result.gtm_strategy && (
        <section className="output-section">
          <button
            className="section-header"
            onClick={() => toggleSection('gtm')}
          >
            {expandedSections.has('gtm') ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <h3>Go-To-Market Strategy</h3>
          </button>
          {expandedSections.has('gtm') && (
            <div className="section-content">
              {result.gtm_strategy.target_countries?.length > 0 && (
                <div className="text-section">
                  <h4>Target Countries</h4>
                  <div className="tag-list">
                    {result.gtm_strategy.target_countries.map((country, i) => (
                      <span key={i} className="tag">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.gtm_strategy.target_regions?.length > 0 && (
                <div className="text-section">
                  <h4>Target Regions</h4>
                  <div className="tag-list">
                    {result.gtm_strategy.target_regions.map((region, i) => (
                      <span key={i} className="tag">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.gtm_strategy.recommended_channels?.length > 0 && (
                <div className="text-section">
                  <h4>Recommended Sales Channels</h4>
                  <div className="tag-list">
                    {result.gtm_strategy.recommended_channels.map((channel, i) => (
                      <span key={i} className="tag channel">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Primary ICP Section */}
      {result.primary_icp && (
        <section className="output-section">
          <button
            className="section-header primary"
            onClick={() => toggleSection('primary_icp')}
          >
            {expandedSections.has('primary_icp') ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <h3>Primary ICP</h3>
            {result.primary_icp.score && (
              <span className="score-badge">{result.primary_icp.score.toFixed(1)}/10</span>
            )}
          </button>
          {expandedSections.has('primary_icp') && (
            <div className="section-content">
              <div className="icp-description">{result.primary_icp.icp}</div>

              <div className="scoring-grid">
                <div className="score-item">
                  <span className="score-label">Pain Severity</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${(result.primary_icp.pain_severity / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="score-value">
                    {result.primary_icp.pain_severity}/10
                  </span>
                </div>

                <div className="score-item">
                  <span className="score-label">Market Size</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${(result.primary_icp.market_size / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="score-value">{result.primary_icp.market_size}/10</span>
                </div>

                <div className="score-item">
                  <span className="score-label">Ease of Sales</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${(result.primary_icp.ease_of_sales / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="score-value">
                    {result.primary_icp.ease_of_sales}/10
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Secondary ICPs Section */}
      {result.secondary_icps?.length > 0 && (
        <section className="output-section">
          <button
            className="section-header"
            onClick={() => toggleSection('secondary_icp')}
          >
            {expandedSections.has('secondary_icp') ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <h3>Secondary ICPs ({result.secondary_icps.length})</h3>
          </button>
          {expandedSections.has('secondary_icp') && (
            <div className="section-content">
              {result.secondary_icps.map((icp, idx) => (
                <div key={idx} className="secondary-icp-card">
                  <div className="icp-header">
                    <span className="icp-title">{icp.icp}</span>
                    <span className="score-badge">{icp.score.toFixed(1)}/10</span>
                  </div>
                  <div className="scoring-grid compact">
                    <div className="score-item">
                      <span className="score-label">Pain</span>
                      <span className="score-value">{icp.pain_severity}/10</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Market</span>
                      <span className="score-value">{icp.market_size}/10</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Sales</span>
                      <span className="score-value">{icp.ease_of_sales}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Buyer Persona Section */}
      {result.buyer_persona && (
        <section className="output-section">
          <button
            className="section-header"
            onClick={() => toggleSection('buyer_persona')}
          >
            {expandedSections.has('buyer_persona') ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
            <h3>Buyer Persona</h3>
          </button>
          {expandedSections.has('buyer_persona') && (
            <div className="section-content">
              {result.buyer_persona.role?.length > 0 && (
                <div className="text-section">
                  <h4>Key Roles</h4>
                  <div className="tag-list">
                    {result.buyer_persona.role.map((role, i) => (
                      <span key={i} className="tag role">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.buyer_persona.pain_points?.length > 0 && (
                <div className="text-section">
                  <h4>Top Pain Points</h4>
                  <ul className="bulleted-list">
                    {result.buyer_persona.pain_points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.buyer_persona.goals?.length > 0 && (
                <div className="text-section">
                  <h4>Key Goals</h4>
                  <ul className="bulleted-list">
                    {result.buyer_persona.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        .icp-output {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 0;
        }

        .output-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: rgba(6, 11, 30, 0.4);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .error-message {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--status-failed);
          font-size: 12px;
        }

        .warning-message {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: rgba(251, 146, 60, 0.1);
          border: 1px solid rgba(251, 146, 60, 0.2);
          color: var(--status-waiting);
          font-size: 12px;
        }

        .confidence-score {
          font-size: 13px;
          color: var(--text-secondary);
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .output-section {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          background: rgba(6, 11, 30, 0.4);
          border: none;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          text-align: left;
        }

        .section-header:hover {
          background: rgba(6, 11, 30, 0.6);
        }

        .section-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .section-header.primary h3 {
          color: var(--violet-bright);
        }

        .score-badge {
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(168, 85, 247, 0.15);
          color: var(--violet-bright);
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-mono);
        }

        .section-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid var(--border-subtle);
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .info-card {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-card.full-width {
          grid-column: 1 / -1;
        }

        .info-card .label {
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .info-card .value {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .info-card .value.multi-line {
          line-height: 1.5;
        }

        .text-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .text-section h4 {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--font-mono);
        }

        .text-section p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 16px;
          background: rgba(168, 85, 247, 0.1);
          color: var(--violet-bright);
          border: 1px solid rgba(168, 85, 247, 0.2);
          font-size: 12px;
          font-weight: 500;
        }

        .tag.channel {
          background: rgba(85, 219, 201, 0.1);
          color: var(--cyan-bright);
          border-color: rgba(85, 219, 201, 0.2);
        }

        .tag.role {
          background: rgba(251, 146, 60, 0.1);
          color: var(--status-waiting);
          border-color: rgba(251, 146, 60, 0.2);
        }

        .icp-description {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: rgba(168, 85, 247, 0.05);
          border-left: 3px solid var(--violet-bright);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .scoring-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .scoring-grid.compact {
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .score-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .score-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .score-bar {
          height: 6px;
          border-radius: 3px;
          background: var(--bg-hover);
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--violet-bright), var(--cyan-bright));
          transition: width 0.3s ease;
        }

        .score-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .secondary-icp-card {
          padding: 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .icp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .icp-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .bulleted-list {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bulleted-list li {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
