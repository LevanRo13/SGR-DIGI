import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo - Mobile only */}
        <div className="flex items-center gap-3 xl:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white">
            SG
          </div>
          <div>
            <div className="font-semibold tracking-tight">SGR DIGI</div>
            <div className="text-xs text-slate-500">Technical validation MVP</div>
          </div>
        </div>

        {/* Search - Desktop */}
        <div className="hidden flex-1 items-center gap-3 md:flex">
          <div className="max-w-md flex-1">
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              placeholder="Search company, certificate hash, or process ID"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:block">
            Testnet connected
          </div>
          <Link
            to="/guarantee"
            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            New Guarantee
          </Link>
          {/* Avatar placeholder */}
          <div className="h-10 w-10 rounded-full bg-slate-200" />
        </div>
      </div>
    </header>
  );
}
