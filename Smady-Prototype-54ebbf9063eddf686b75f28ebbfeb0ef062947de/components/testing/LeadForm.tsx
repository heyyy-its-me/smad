'use client';

import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface LeadFormData {
  industry: string;
  roles: string;
  region: string;
  cities: string;
  states: string;
  company_size: string;
  business_context: string;
}

interface LeadFormProps {
  values: LeadFormData;
  onChange: (key: keyof LeadFormData, value: string) => void;
  payload: Record<string, unknown>;
}

type LeadFormField = {
  key: Exclude<keyof LeadFormData, 'business_context'>;
  label: string;
  placeholder: string;
  wide: boolean;
  hint?: string;
};

type LeadFormFieldGroup = {
  label: string;
  fields: LeadFormField[];
};

const fieldGroups: LeadFormFieldGroup[] = [
  {
    label: 'TARGET MARKET',
    fields: [
      { key: 'industry' as const, label: 'Industry', placeholder: 'e.g. Logistics & Supply Chain', wide: false },
    ],
  },
  {
    label: 'BUYER',
    fields: [
      { key: 'roles' as const, label: 'Target roles', placeholder: 'Fleet Manager, Director of Operations', wide: false, hint: 'Comma-separated' },
    ],
  },
  {
    label: 'GEOGRAPHY',
    fields: [
      { key: 'region' as const, label: 'Region', placeholder: 'e.g. Canada', wide: false },
      { key: 'cities' as const, label: 'Cities', placeholder: 'Toronto, Vancouver', wide: false, hint: 'Comma-separated' },
      { key: 'states' as const, label: 'States / Provinces', placeholder: 'Optional', wide: true },
    ],
  },
  {
    label: 'COMPANY',
    fields: [
      { key: 'company_size' as const, label: 'Company size', placeholder: 'e.g. 51-200', wide: false },
    ],
  },
];

export default function LeadForm({ values, onChange, payload }: LeadFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const chips = useMemo(() => {
    const result: { key: string; values: string[] }[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (key === 'business_context') continue;
      const parts = value.split(',').map((p: string) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        result.push({ key, values: parts });
      }
    }
    return result;
  }, [values]);

  return (
    <div className="lead-form">
      {/* Grouped fields */}
      {fieldGroups.map((group) => (
        <div key={group.label} className="field-group">
          <span className="group-label">{group.label}</span>
          <div className="group-fields">
            {group.fields.map((field) => (
              <div key={field.key} className={field.wide ? 'field-wide' : 'field-item'}>
                <label className="field-label" htmlFor={`lead-${field.key}`}>
                  {field.label}
                </label>
                <div className={`input-wrapper ${focusedField === field.key ? 'focused' : ''}`}>
                  <input
                    id={`lead-${field.key}`}
                    type="text"
                    value={values[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder}
                    className="lead-input"
                  />
                  {values[field.key] && (
                    <button
                      className="input-clear"
                      onClick={() => onChange(field.key, '')}
                      tabIndex={-1}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {field.hint && (
                  <span className="field-hint">{field.hint}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Business Context */}
      <div className="field-group">
        <span className="group-label">CONTEXT</span>
        <div className="group-fields">
          <div className="field-wide">
            <label className="field-label" htmlFor="lead-business_context">
              Business context
            </label>
            <div className={`input-wrapper textarea-wrapper ${focusedField === 'business_context' ? 'focused' : ''}`}>
              <textarea
                id="lead-business_context"
                value={values.business_context}
                onChange={(e) => onChange('business_context', e.target.value)}
                onFocus={() => setFocusedField('business_context')}
                onBlur={() => setFocusedField(null)}
                placeholder="Optional context for this lead search..."
                className="lead-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chips display */}
      {chips.length > 0 && (
        <div className="chips-area">
          {chips.map((chip) => (
            <div key={chip.key} className="chip-group">
              {chip.values.map((val, i) => (
                <span key={i} className="chip">
                  {val}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Payload preview */}
      <details className="payload-toggle">
        <summary className="payload-summary">View payload → n8n</summary>
        <pre className="payload-preview">{JSON.stringify(payload, null, 2)}</pre>
      </details>

      <style jsx>{`
        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .group-label {
          font-size: 9px;
          font-weight: 700;
          font-family: var(--font-mono);
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }

        .group-fields {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .field-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-wide {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .field-hint {
          font-size: 9px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          background: rgba(15, 22, 51, 0.7);
          transition: all var(--duration-normal) var(--ease-smooth);
        }

        .input-wrapper.focused {
          border-color: var(--cyan-bright);
          background: rgba(15, 22, 51, 0.9);
          box-shadow: 0 0 0 3px rgba(34, 211, 197, 0.15), 0 4px 16px rgba(34, 211, 197, 0.2);
        }

        .textarea-wrapper {
          padding: 6px 8px;
          align-items: flex-start;
        }

        .lead-input {
          flex: 1;
          height: 34px;
          font-size: 12px;
          color: var(--text-primary);
          background: transparent;
          border: none;
          outline: none;
          min-width: 0;
        }

        .lead-input::placeholder {
          color: var(--text-muted);
        }

        .lead-textarea {
          width: 100%;
          font-size: 12px;
          color: var(--text-primary);
          background: transparent;
          border: none;
          outline: none;
          resize: vertical;
          min-height: 52px;
          line-height: 1.5;
        }

        .lead-textarea::placeholder {
          color: var(--text-muted);
        }

        .input-clear {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          flex-shrink: 0;
          border: none;
        }

        .input-clear:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
        }

        .chips-area {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 0;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--violet-bright);
          font-size: 10px;
          font-weight: 500;
          animation: scale-in 0.2s var(--ease-spring);
        }

        .payload-toggle {
          border-top: 1px solid var(--border-subtle);
          padding-top: 12px;
        }

        .payload-summary {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-tertiary);
          cursor: pointer;
          user-select: none;
        }

        .payload-summary:hover {
          color: var(--text-secondary);
        }

        .payload-preview {
          margin-top: 8px;
          padding: 12px;
          border-radius: var(--radius-sm);
          background: rgba(6, 11, 30, 0.6);
          border: 1px solid var(--border-subtle);
          font-family: var(--font-mono);
          font-size: 10px;
          line-height: 1.6;
          color: var(--text-secondary);
          overflow-x: auto;
          max-height: 200px;
          white-space: pre;
        }

        @media (max-width: 700px) {
          .group-fields {
            grid-template-columns: 1fr;
          }
        }
        /* Command center input treatment */
        .field-group { padding: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)); transition: transform var(--duration-normal) var(--ease-out), border-color var(--duration-fast) ease; }
        .field-group:focus-within { border-color: rgba(255,154,210,0.48); transform: translateY(-2px); box-shadow: 0 10px 24px rgba(24,10,51,0.16); }
        .input-wrapper { border-radius: 11px; background: rgba(16, 9, 35, 0.42); }
        .input-wrapper.focused { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(255, 255, 255,0.13), inset 0 1px 0 rgba(255,255,255,0.08); }
        .chip { background: linear-gradient(100deg, rgba(255, 255, 255,0.16), rgba(255, 255, 255,0.14)); border-color: rgba(255,191,226,0.25); color: #ffe5f5; }
        .payload-toggle { border: 1px dashed rgba(255,255,255,0.17); border-radius: 12px; padding: 12px; background: rgba(12,8,31,0.26); }
      `}</style>
    </div>
  );
}
