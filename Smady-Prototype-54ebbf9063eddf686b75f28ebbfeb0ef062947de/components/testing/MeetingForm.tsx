'use client';

import { ExternalLink } from 'lucide-react';

export default function MeetingForm() {
  const n8nFormUrl = 'https://n8n-smady-adgtdkg5hvacf7fs.canadacentral-01.azurewebsites.net/form/4b6bfcd9-a034-4e23-aa3a-908c9aa2734d';

  return (
    <div className="meeting-form">
      <div className="instruction-card">
        <div className="card-header">
          <div className="card-icon">📅</div>
          <div className="card-title-section">
            <h3 className="card-title">Meeting Scheduler</h3>
            <p className="card-subtitle">Interactive Demo Mode</p>
          </div>
        </div>

        <div className="card-body">
          <p className="instruction-text">
            The meeting scheduler requires a genuine email response from a lead to successfully schedule a meeting. 
          </p>
          <p className="instruction-text emphasis">
            For this prototype demonstration, please assume the role of a lead and enter your contact details below to simulate a real scheduling interaction.
          </p>
          
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Enter your email as if you are the lead</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Confirm availability for a meeting</span>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <span>Watch the scheduler process your response</span>
            </div>
          </div>
        </div>

        <div className="form-container">
          <iframe
            src={n8nFormUrl}
            width="100%"
            height="600"
            frameBorder="0"
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
            }}
            title="Meeting Scheduler Form"
          />
        </div>

        <div className="footer-note">
          <p>
            Once submitted, the scheduler will acknowledge your response and demonstrate how the system processes real lead interactions.
          </p>
          <a href={n8nFormUrl} target="_blank" rel="noopener noreferrer" className="external-link-btn">
            <ExternalLink size={14} />
            Open form in new window
          </a>
        </div>
      </div>

      <style jsx>{`
        .meeting-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0;
        }

        .instruction-card {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(251, 146, 60, 0.02) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          display: flex;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(251, 146, 60, 0.03);
        }

        .card-icon {
          font-size: 32px;
          line-height: 1;
        }

        .card-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.3px;
        }

        .card-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 500;
        }

        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .instruction-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }

        .instruction-text.emphasis {
          color: var(--text-primary);
          font-weight: 500;
          background: rgba(251, 146, 60, 0.08);
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--orange-bright);
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 8px 0;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .feature-check {
          color: var(--orange-bright);
          font-weight: 700;
          min-width: 20px;
        }

        .form-container {
          padding: 24px;
          border-top: 1px solid var(--border-subtle);
          flex: 1;
        }

        .footer-note {
          padding: 20px 24px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(251, 146, 60, 0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .footer-note p {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0;
          flex: 1;
        }

        .external-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--orange-bright);
          color: var(--text-primary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          transition: all var(--duration-fast) ease;
          white-space: nowrap;
        }

        .external-link-btn:hover {
          background: var(--orange-bright);
          opacity: 0.8;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            gap: 12px;
          }

          .footer-note {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
