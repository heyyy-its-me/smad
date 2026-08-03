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
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.06) 0%, rgba(251, 146, 60, 0.02) 100%);
          border: 1px solid rgba(251, 146, 60, 0.2);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card-header {
          display: flex;
          gap: 18px;
          padding: 28px;
          border-bottom: 1px solid rgba(251, 146, 60, 0.15);
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(251, 146, 60, 0.03) 100%);
        }

        .card-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.4px;
        }

        .card-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .instruction-text {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }

        .instruction-text.emphasis {
          color: var(--text-primary);
          font-weight: 600;
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(251, 146, 60, 0.05) 100%);
          padding: 16px;
          border-radius: var(--radius-md);
          border-left: 4px solid var(--orange-bright);
          box-shadow: 0 4px 12px rgba(251, 146, 60, 0.1);
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
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .feature-check {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(251, 146, 60, 0.1) 100%);
          color: var(--orange-bright);
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .form-container {
          padding: 28px;
          border-top: 1px solid rgba(251, 146, 60, 0.15);
          flex: 1;
          background: linear-gradient(180deg, rgba(251, 146, 60, 0.02) 0%, transparent 100%);
        }

        .footer-note {
          padding: 20px 28px;
          border-top: 1px solid rgba(251, 146, 60, 0.15);
          background: rgba(251, 146, 60, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .footer-note p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          flex: 1;
          line-height: 1.6;
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
