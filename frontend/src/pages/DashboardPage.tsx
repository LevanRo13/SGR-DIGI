import Layout from '../components/Layout';
import {
  KPICard,
  ProcessTable,
  CertificateCard,
  WorkflowSteps,
  ActivityLog,
  NewGuaranteeWidget,
} from '../components/Dashboard';
import { mockKpis, mockProcesses, mockCertificates, mockLogs } from '../constants/mockData';

export default function DashboardPage() {
  return (
    <Layout>
      {/* KPIs Grid */}
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockKpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Hero Section */}
      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Accelerated issuance workflow
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Issue digital guarantees in minutes, not weeks.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Upload documentation, extract structured data with AI, validate manually, and
              register verifiable evidence on Stellar Testnet.
            </p>
          </div>

          <WorkflowSteps />
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          <ProcessTable processes={mockProcesses} />

          {/* Issued Certificates */}
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Issued certificates</h2>
                <p className="text-sm text-slate-500">
                  Recent guarantees with on-chain traceability and verification.
                </p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Open explorer
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mockCertificates.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <NewGuaranteeWidget />
          <ActivityLog entries={mockLogs} />
        </div>
      </div>
    </Layout>
  );
}
