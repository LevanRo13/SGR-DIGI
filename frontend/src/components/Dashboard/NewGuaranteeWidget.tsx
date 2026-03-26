import { Link } from 'react-router-dom';

export function NewGuaranteeWidget() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">New guarantee</h2>
          <p className="text-sm text-slate-500">Start a new issuance workflow.</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          MVP
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="text-sm font-medium">
          Upload commercial and asset-backed documentation
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          AI will extract core data for validation, then a hash with metadata will be registered
          on Stellar Testnet to generate a verifiable certificate.
        </div>
        <Link
          to="/guarantee"
          className="mt-5 block w-full rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload documentation
        </Link>
      </div>
    </section>
  );
}
