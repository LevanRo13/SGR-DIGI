import { FileSearch } from 'lucide-react';
import Layout from '../components/Layout';

export default function ProcessesPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-3xl bg-slate-100 p-6 mb-6">
          <FileSearch className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Processes</h1>
        <p className="text-slate-500 text-center max-w-md">
          View and manage all guarantee processes. This feature will be available in HU-13.
        </p>
        <div className="mt-6 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
          Coming in next sprint
        </div>
      </div>
    </Layout>
  );
}
