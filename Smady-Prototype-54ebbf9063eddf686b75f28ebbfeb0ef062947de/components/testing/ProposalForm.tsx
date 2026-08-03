'use client';

import { useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProposalForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/proposal/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: name,
          lead_email: email,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook error ${response.status}: ${errorText}`);
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setName('');
        setEmail('');
      }, 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(msg);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="proposal-form">
      <div className="instruction-card">
        <div className="card-header">
          <div className="card-icon">📋</div>
          <div className="card-title-section">
            <h3 className="card-title">Proposal Generation</h3>
            <p className="card-subtitle">Meeting to Proposal Workflow</p>
          </div>
        </div>

        <div className="card-body">
          <p className="instruction-text">
            Proposals are generated automatically after a successful meeting with a lead. The system uses call transcripts and meeting context to create tailored proposals.
          </p>
          <p className="instruction-text emphasis">
            For this prototype demonstration, assume the role of a lead and provide your name and email address. The system will generate a personalized proposal and send it to your email.
          </p>

          <div className="workflow-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <h5>Enter Your Details</h5>
                <p>Your name and email as the lead</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <h5>Trigger Proposal Generation</h5>
                <p>System drafts proposal from meeting context</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <h5>Review & Approve</h5>
                <p>AI reviewer validates against guardrails</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div>
                <h5>Proposal Delivered</h5>
                <p>Customized proposal sent to lead email</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="trigger-form">
          <div className="form-group">
            <label htmlFor="lead-name">Your Name</label>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lead-email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for proposal delivery"
                className="form-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!name.trim() || !email.trim() || isLoading || status === 'success'}
                className={`submit-btn ${status === 'success' ? 'success' : ''} ${status === 'error' ? 'error' : ''} ${isLoading ? 'loading' : ''}`}
              >
                {status === 'success' ? (
                  <>✓ Sent</>
                ) : status === 'error' ? (
                  <>✕ Failed</>
                ) : isLoading ? (
                  <>⟳ Triggering...</>
                ) : (
                  <>
                    <Send size={14} />
                    Trigger Proposal
                  </>
                )}
              </button>
            </div>
            <span className="field-hint">
              Personalized proposal will be generated for {name || 'you'} and sent to this email address
            </span>
            {status === 'error' && (
              <div className="error-message">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}
            {status === 'success' && (
              <div className="success-message">
                <CheckCircle2 size={14} />
                <span>Proposal triggered! Check your email shortly.</span>
              </div>
            )}
          </div>
        </form>

        <div className="process-info">
          <div className="info-section">
            <h5 className="info-title">Proposal Safeguards</h5>
            <ul className="info-list">
              <li>Pricing validated against approved catalog</li>
              <li>Proposal reviewed for transcript compliance</li>
              <li>Auto-rejected if contradicts call discussion</li>
              <li>Sales ops notified for manual review if needed</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .proposal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0;
        }

        .instruction-card {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);
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
          background: rgba(34, 197, 94, 0.03);
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
          gap: 18px;
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
          background: rgba(34, 197, 94, 0.08);
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--green-bright);
        }

        .workflow-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin: 8px 0;
        }

        .step {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: var(--radius-sm);
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          width: 28px;
          height: 28px;
          background: var(--green-bright);
          color: var(--text-primary);
          border-radius: 50%;
          font-weight: 700;
          font-size: 12px;
        }

        .step h5 {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 3px 0;
        }

        .step p {
          font-size: 11px;
          color: var(--text-tertiary);
          margin: 0;
          line-height: 1.4;
        }

        .trigger-form {
          padding: 24px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(34, 197, 94, 0.02);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .form-input {
          flex: 1;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          transition: all var(--duration-fast) ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--green-bright);
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--green-bright);
          color: var(--text-primary);
          border: none;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          white-space: nowrap;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--green-bright);
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        .submit-btn.success {
          background: var(--green-bright);
          opacity: 0.8;
        }

        .submit-btn.error {
          background: var(--status-failed);
          opacity: 0.8;
        }

        .field-hint {
          font-size: 11px;
          color: var(--text-muted);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--status-failed);
        }

        .error-message svg {
          flex-shrink: 0;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--status-completed);
        }

        .success-message svg {
          flex-shrink: 0;
        }

        .process-info {
          padding: 20px 24px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(34, 197, 94, 0.02);
        }

        .info-section h5 {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 10px 0;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .info-list li {
          font-size: 12px;
          color: var(--text-tertiary);
          line-height: 1.5;
          position: relative;
        }

        .info-list li:before {
          content: '✓';
          position: absolute;
          left: -16px;
          color: var(--green-bright);
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            gap: 12px;
          }

          .workflow-steps {
            grid-template-columns: 1fr;
          }

          .input-wrapper {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
