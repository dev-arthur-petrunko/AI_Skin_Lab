export function Aurora() {
  const base = 'absolute rounded-full blur-[90px] animate-drift transition-[background,opacity] duration-700';
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <i className={base} style={{ width: '46vw', height: '46vw', left: '-10vw', top: '-10vw', background: 'var(--b1)', opacity: 'var(--bo)' }} />
      <i className={base} style={{ width: '36vw', height: '36vw', right: '-8vw', top: '20vh', background: 'var(--b2)', opacity: 'var(--bo)', animationDelay: '-8s' }} />
      <i className={base} style={{ width: '48vw', height: '48vw', left: '28vw', bottom: '-24vw', background: 'var(--b3)', opacity: 'var(--bo)', animationDelay: '-14s' }} />
    </div>
  );
}
