import { useLocation, Link } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants/styles';

const ROUTE_MAP: Record<string, string> = {
  'Dashboard': '/dashboard',
  'New Guarantee': '/guarantee',
  'Processes': '/processes',
  'Certificates': '/certificates',
  'Marketplace': '/marketplace',
  'Blend Protocol': '/lending',
  'Blockchain Explorer': '/explorer',
  'Companies': '/companies',
  'Settings': '/settings',
};

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
      {/* Logo */}
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm">
            SG
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">SGR DIGI</div>
            <div className="text-sm text-slate-500">AI + blockchain guarantees</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-5 text-sm">
        {NAVIGATION_ITEMS.map((item) => {
          const href = ROUTE_MAP[item as string] || `/${item.toLowerCase()}`;
          const isActive = location.pathname === href;

          return (
            <Link
              key={item}
              to={href}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                isActive
                  ? 'bg-blue-50 font-medium text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{item}</span>
              {isActive && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Network Status */}
      <div className="p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium">Network status</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Stellar Testnet online
          </div>
        </div>
      </div>
    </aside>
  );
}
