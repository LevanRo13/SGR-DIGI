import type { Certificate } from '../../types';

interface CertificateCardProps {
  certificate: Certificate;
  onViewCertificate?: () => void;
  onViewOnChain?: () => void;
}

export function CertificateCard({ certificate, onViewCertificate, onViewOnChain }: CertificateCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold">{certificate.company}</div>
          <div className="mt-1 text-sm text-slate-500">Issued {certificate.issuedAt}</div>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          Issued
        </div>
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Guarantee amount</span>
          <span className="font-medium">{certificate.amount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Hash</span>
          <span className="font-mono text-xs text-slate-700">{certificate.hash}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Network</span>
          <span className="font-medium">{certificate.network}</span>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={onViewCertificate}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          View certificate
        </button>
        <button
          onClick={onViewOnChain}
          className="flex-1 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          View on-chain
        </button>
      </div>
    </div>
  );
}
