'use client';

import { clsx } from 'clsx';
import { 
  FlaskConical, 
  History, 
  Database, 
  PlugZap, 
  Settings, 
  LifeBuoy,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'studio', label: 'Agent Studio', icon: FlaskConical },
  { id: 'runs', label: 'Saved Runs', icon: History, badge: '12' },
  { id: 'outputs', label: 'Outputs', icon: Database },
  { id: 'connections', label: 'Connections', icon: PlugZap },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">✦</span>
        <span className="brand-name">SMADY</span>
      </div>

      <div className="workspace-selector">
        <div className="workspace-avatar">GO</div>
        <div className="workspace-info">
          <strong>Growth Ops</strong>
          <small>Production test space</small>
        </div>
        <ChevronDown size={14} className="workspace-chevron" />
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">WORKSPACE</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx('nav-item', isActive && 'active')}
            >
              <Icon size={16} className="nav-icon" />
              <span className="nav-label-text">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <Settings size={16} className="nav-icon" />
          <span className="nav-label-text">Settings</span>
        </button>
        <div className="help-card">
          <LifeBuoy size={14} />
          <div>
            <strong>Test with intent</strong>
            <small>Real inputs, observable runs</small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px 12px 16px;
          background: rgba(6, 11, 30, 0.85);
          border-right: 1px solid var(--border-subtle);
          backdrop-filter: blur(16px);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 8px 24px;
        }
        .brand-mark {
          font-size: 20px;
          color: var(--violet-bright);
          font-weight: 700;
        }
        .brand-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .workspace-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.03);
          margin-bottom: 28px;
          cursor: pointer;
          transition: border-color var(--duration-fast) ease;
        }
        .workspace-selector:hover { border-color: var(--border-default); }
        .workspace-avatar {
          width: 28px; height: 28px; border-radius: 8px;
          display: grid; place-items: center;
          background: #f5f5f5; color: #111;
          color: #fff; font-size: 9px; font-weight: 700; flex-shrink: 0;
        }
        .workspace-info { flex: 1; min-width: 0; }
        .workspace-info strong { display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .workspace-info small { display: block; margin-top: 1px; font-size: 10px; color: var(--text-tertiary); }
        .workspace-chevron { color: var(--text-tertiary); flex-shrink: 0; }
        .sidebar-nav { flex: 1; }
        .nav-label {
          display: block; padding: 0 12px 10px;
          font-size: 9px; font-weight: 600; font-family: var(--font-mono);
          letter-spacing: 0.12em; color: var(--text-muted);
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          min-height: 38px; padding: 0 12px; margin: 2px 0;
          border-radius: var(--radius-sm); font-size: 13px;
          color: var(--text-secondary); transition: all var(--duration-fast) ease;
          text-align: left; position: relative;
        }
        .nav-item:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
        .nav-item.active {
          color: var(--text-primary);
          background: linear-gradient(90deg, rgba(255, 255, 255,0.15), rgba(255, 255, 255,0.04));
          box-shadow: inset 2px 0 0 var(--violet);
        }
        .nav-icon { flex-shrink: 0; opacity: 0.7; }
        .nav-item.active .nav-icon { opacity: 1; color: var(--violet-bright); }
        .nav-label-text { flex: 1; }
        .nav-badge {
          padding: 1px 7px; border-radius: 100px;
          background: var(--bg-hover); color: var(--text-secondary);
          font-size: 10px; font-family: var(--font-mono); font-weight: 500;
        }
        .sidebar-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle); }
        .help-card {
          display: flex; gap: 10px; padding: 12px; margin-top: 8px;
          border: 1px solid rgba(255, 255, 255,0.2);
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(255, 255, 255,0.08), rgba(34,211,197,0.04));
          color: var(--violet-bright);
        }
        .help-card strong { display: block; font-size: 11px; color: var(--text-primary); }
        .help-card small { display: block; margin-top: 2px; font-size: 9px; color: var(--text-tertiary); }
        @media (max-width: 1100px) {
          .sidebar { width: 64px; padding: 20px 8px 16px; }
          .brand-name, .workspace-info, .workspace-chevron, .nav-label, .nav-label-text, .nav-badge, .help-card { display: none; }
          .sidebar-brand { padding: 0 4px 24px; justify-content: center; }
          .workspace-selector { justify-content: center; padding: 8px; }
          .nav-item { justify-content: center; padding: 0; }
          .sidebar-footer .nav-item { justify-content: center; }
        }
        @media (max-width: 700px) { .sidebar { display: none; } }
        /* Sidebar glass treatment */
        .sidebar { background: linear-gradient(180deg, rgba(42,25,69,0.86), rgba(18,24,52,0.8)); border-right-color: rgba(255,255,255,0.12); }
        .brand-mark { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: linear-gradient(135deg, #ff8ec9, #9c83ff 52%, #67e9d3); color: #fff7ff; box-shadow: 0 8px 20px rgba(203,107,226,0.28); }
        .workspace-selector { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.13); }
        .nav-item.active { background: linear-gradient(100deg, rgba(255, 255, 255,0.16), rgba(255, 255, 255,0.08)); box-shadow: inset 2px 0 0 var(--pink), 0 6px 14px rgba(16,8,36,0.14); }
      `}</style>
    </aside>
  );
}
