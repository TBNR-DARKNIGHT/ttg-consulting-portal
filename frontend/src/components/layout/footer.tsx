import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-dark">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-5 py-10 text-center md:flex-row md:px-8 md:text-left">
        <div>
          <p className="font-serif text-[15px] font-bold text-brand-indigo">beyond grades</p>
          <p className="mt-1 text-xs text-white/35">Part of Think Teach Group · beyondgrades.sg</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
          <Link to="/portal" className="text-xs text-white/40 hover:text-white/70">Portal</Link>
          <Link to="/group-programme" className="text-xs text-white/40 hover:text-white/70">DSA Interview Intensive</Link>
          <Link to="/consult" className="text-xs text-white/40 hover:text-white/70">DSA Consulting</Link>
          <Link to="/about" className="text-xs text-white/40 hover:text-white/70">About Us</Link>
        </nav>
        <p className="text-xs text-white/30">© 2026 Beyond Grades.</p>
      </div>
    </footer>
  );
}
