'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import type { ICPRequestPayload } from '@/lib/icp-api-client';

interface ICPFormProps {
  payload: ICPRequestPayload;
  onChange: (key: keyof ICPRequestPayload, value: string) => void;
}

const businessStages = ['MVP', 'Early', 'Growth', 'Scale', 'Mature'];
const priorities = ['High', 'Medium', 'Low'];
const geographies = ['United States', 'Canada', 'Europe', 'APAC', 'Anywhere'];

export default function ICPForm({ payload, onChange }: ICPFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="icp-form">
      {/* Product Description */}
      <div className="form-section">
        <div className="section-header">
          <span className="section-label">PRODUCT</span>
          <h4>Tell us about your product</h4>
        </div>
        <div className="form-group">
          <label htmlFor="product-description">Product Description</label>
          <textarea
            id="product-description"
            value={payload.product_description}
            onChange={(e) => onChange('product_description', e.target.value)}
            onFocus={() => setFocusedField('product-description')}
            onBlur={() => setFocusedField(null)}
            placeholder="Describe your product, its key capabilities, and unique technical aspects. More detail = better output."
            className={`form-textarea ${focusedField === 'product-description' ? 'focused' : ''}`}
            rows={5}
          />
          <span className="field-hint">
            {payload.product_description.length}/500 characters
          </span>
        </div>

        {/* Product Name (Optional) */}
        <div className="form-group">
          <label htmlFor="product-name">Product Name (Optional)</label>
          <input
            id="product-name"
            type="text"
            value={payload.product_name || ''}
            onChange={(e) => onChange('product_name', e.target.value)}
            placeholder="e.g. NexVigil, CloudShield"
            className="form-input"
          />
        </div>

        {/* Company Name (Optional) */}
        <div className="form-group">
          <label htmlFor="company-name">Company Name (Optional)</label>
          <input
            id="company-name"
            type="text"
            value={payload.company_name || ''}
            onChange={(e) => onChange('company_name', e.target.value)}
            placeholder="e.g. Acme Corp"
            className="form-input"
          />
        </div>
      </div>

      {/* Market Configuration */}
      <div className="form-section">
        <div className="section-header">
          <span className="section-label">MARKET</span>
          <h4>Define your target market</h4>
        </div>

        {/* Target Geography */}
        <div className="form-group">
          <label htmlFor="target-geography">Target Geography</label>
          <select
            id="target-geography"
            value={payload.target_geography}
            onChange={(e) => onChange('target_geography', e.target.value)}
            className="form-select"
          >
            <option value="">Select a geography</option>
            {geographies.map((geo) => (
              <option key={geo} value={geo}>
                {geo}
              </option>
            ))}
          </select>
        </div>

        {/* Business Stage */}
        <div className="form-group">
          <label htmlFor="business-stage">Business Stage</label>
          <select
            id="business-stage"
            value={payload.business_stage}
            onChange={(e) => onChange('business_stage', e.target.value)}
            className="form-select"
          >
            <option value="">Select a stage</option>
            {businessStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority">Priority Level</label>
          <select
            id="priority"
            value={payload.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            className="form-select"
          >
            <option value="">Select priority</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <style jsx>{`
        .icp-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-label {
          font-size: 9px;
          font-weight: 700;
          font-family: var(--font-mono);
          letter-spacing: 0.12em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .section-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-textarea,
        .form-input,
        .form-select {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          transition: all var(--duration-fast) ease;
        }

        .form-textarea:focus,
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--violet-bright);
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1);
        }

        .form-textarea.focused {
          border-color: var(--violet-bright);
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
          font-family: inherit;
        }

        .field-hint {
          font-size: 10px;
          color: var(--text-muted);
          text-align: right;
        }
      `}</style>
    </div>
  );
}
