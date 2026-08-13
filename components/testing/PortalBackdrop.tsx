export default function PortalBackdrop() {
  return (
    <div className="portal-backdrop" aria-hidden="true">
      <span className="portal-orb orb-one" />
      <span className="portal-orb orb-two" />
      <span className="portal-orb orb-three" />
      <span className="portal-grid" />
      <style jsx>{`
        .portal-backdrop { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: -1; }
        .portal-orb { position: absolute; border-radius: 999px; filter: blur(14px); opacity: 0.72; mix-blend-mode: screen; }
        .orb-one { width: 24rem; height: 24rem; top: 5%; left: 12%; background: radial-gradient(circle, rgba(249, 135, 207, 0.5), transparent 68%); animation: drift-one 18s ease-in-out infinite; }
        .orb-two { width: 32rem; height: 32rem; right: -8rem; top: 18%; background: radial-gradient(circle, rgba(104, 235, 216, 0.32), transparent 67%); animation: drift-two 23s ease-in-out infinite; }
        .orb-three { width: 22rem; height: 22rem; bottom: -6rem; left: 42%; background: radial-gradient(circle, rgba(255, 190, 99, 0.28), transparent 67%); animation: drift-three 20s ease-in-out infinite; }
        .portal-grid { position: absolute; inset: 0; opacity: 0.18; background-image: linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 46px 46px; mask-image: radial-gradient(circle at 50% 30%, black, transparent 73%); }
        @keyframes drift-one { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(56px,28px,0) scale(1.08); } }
        @keyframes drift-two { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-48px,46px,0) scale(0.92); } }
        @keyframes drift-three { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(-20px,-46px,0) rotate(11deg); } }
        @media (prefers-reduced-motion: reduce) { .portal-orb { animation: none; } }
      `}</style>
    </div>
  );
}