import { Building2 } from 'lucide-react';
import Layout from '../components/Layout';

export default function CompaniesPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-3xl bg-slate-100 p-6 mb-6">
          <Building2 className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Companies</h1>
        <p className="text-slate-500 text-center max-w-md">
          Manage company profiles and their guarantee history. This feature is planned for a future release.
        </p>
        <div className="mt-6 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
          Future release
        </div>
      </div>
    </Layout>
  );
}
