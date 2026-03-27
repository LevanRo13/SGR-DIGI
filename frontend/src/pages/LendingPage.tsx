import { useState } from 'react';
import { Landmark, Wallet, AlertCircle, Coins, ShieldCheck, Activity, ArrowRightLeft } from 'lucide-react';
import Layout from '../components/Layout';

export default function LendingPage() {
  const [walletAura, setWalletAura] = useState(5000); // Mock AURA in wallet
  const [supplyInput, setSupplyInput] = useState('');
  const [borrowInput, setBorrowInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Position Protocol State
  const [suppliedAura, setSuppliedAura] = useState(0);
  const [borrowedXlm, setBorrowedXlm] = useState(0);

  // Constants (Component 2: Oracle Mock)
  const AURA_PRICE = 1.0; // $1
  const XLM_PRICE = 0.10; // $0.10
  const C_FACTOR = 0.70; // 70% collateral factor

  // Calculations
  const totalCollateralUsd = suppliedAura * AURA_PRICE;
  const totalDebtUsd = borrowedXlm * XLM_PRICE;
  const borrowLimitUsd = totalCollateralUsd * C_FACTOR;
  
  // Math.max avoids negative borrow capacity when debt > borrow limit (e.g. liquidatable state)
  const availableBorrowXlm = Math.max(0, (borrowLimitUsd - totalDebtUsd) / XLM_PRICE);
  
  const currentHealthFactor = totalDebtUsd > 0 ? borrowLimitUsd / totalDebtUsd : 0;

  // Derived state for simulations
  const simulateSupply = parseFloat(supplyInput) || 0;
  const simulatedCollateralUsd = (suppliedAura + simulateSupply) * AURA_PRICE;
  const simulatedBorrowLimitUsd = simulatedCollateralUsd * C_FACTOR;
  
  const simulateBorrow = parseFloat(borrowInput) || 0;
  const simulatedDebtUsd = (borrowedXlm + simulateBorrow) * XLM_PRICE;
  const simulatedHealthFactor = simulatedDebtUsd > 0 ? simulatedBorrowLimitUsd / simulatedDebtUsd : 0;

  const handleSupply = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(supplyInput);
    if (isNaN(amount) || amount <= 0 || amount > walletAura) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setWalletAura(prev => prev - amount);
      setSuppliedAura(prev => prev + amount);
      setSupplyInput('');
      setIsSubmitting(false);
    }, 1500); // Simulate blockchain interaction
  };

  const handleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(borrowInput);
    if (isNaN(amount) || amount <= 0 || amount > availableBorrowXlm) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setBorrowedXlm(prev => prev + amount);
      setBorrowInput('');
      setIsSubmitting(false);
    }, 1500);
  };

  const handleRepayAll = () => {
    if (borrowedXlm === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setBorrowedXlm(0);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100/50 rounded-xl">
            <Landmark className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            BLEND Protocol Lending
          </h1>
        </div>
        <p className="text-slate-500 max-w-2xl text-lg">
          Use your tokenized AURA guarantees as collateral to borrow XLM.
        </p>
      </div>

      {/* Position Overview (Dashboard) */}
      <section className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-24 h-24 text-blue-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Collateral (AURA)</p>
            <div className="text-3xl font-bold text-slate-900 flex items-baseline gap-2">
              {suppliedAura.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="text-sm font-medium text-slate-400">≈ ${totalCollateralUsd.toLocaleString()}</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Activity className="w-3.5 h-3.5" />
              Earning BLND Rewards
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Coins className="w-24 h-24 text-violet-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Debt (XLM)</p>
            <div className="text-3xl font-bold text-slate-900 flex items-baseline gap-2">
              {borrowedXlm.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="text-sm font-medium text-slate-400">≈ ${totalDebtUsd.toLocaleString()}</span>
            </div>
            <div className="mt-4">
               <button 
                  onClick={handleRepayAll}
                  disabled={borrowedXlm === 0 || isSubmitting}
                  className="text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl border border-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Repay Full Balance
                </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-slate-500">Health Factor</p>
              <AlertCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className={`text-3xl font-bold ${
              currentHealthFactor === 0 ? 'text-slate-400' : 
              currentHealthFactor >= 1.5 ? 'text-emerald-500' : 
              currentHealthFactor > 1.0 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {currentHealthFactor === 0 ? '∞' : currentHealthFactor > 99 ? '>99' : currentHealthFactor.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              &lt; 1.0 means your collateral may be liquidated.
            </p>
          </div>
          
          <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
             <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Borrow Limit Used</span>
                <span className="font-medium text-slate-700">
                  {borrowLimitUsd > 0 ? ((totalDebtUsd / borrowLimitUsd) * 100).toFixed(1) : 0}%
                </span>
             </div>
             <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    borrowLimitUsd > 0 && (totalDebtUsd / borrowLimitUsd) > 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, borrowLimitUsd > 0 ? (totalDebtUsd / borrowLimitUsd) * 100 : 0)}%` }}
                />
             </div>
          </div>
        </div>
      </section>

      {/* Action Forms */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Supply Section */}
        <section className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Supply Collateral</h2>
              <p className="text-sm text-slate-500">Deposit AURA to enable borrowing</p>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
               <Wallet className="w-4 h-4 text-slate-500" />
               <span className="text-sm font-medium text-slate-700">{walletAura.toLocaleString()} AURA</span>
            </div>
          </div>

          <form onSubmit={handleSupply} className="space-y-6">
            <div className="relative">
              <label htmlFor="supply" className="block text-sm font-medium text-slate-700 mb-2">Amount to Supply</label>
              <div className="relative flex items-center">
                <input
                  id="supply"
                  type="number"
                  step="0.01"
                  min="0"
                  max={walletAura}
                  value={supplyInput}
                  onChange={(e) => setSupplyInput(e.target.value)}
                  className="w-full pl-4 pr-20 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-lg font-medium transition-all"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
                <div className="absolute right-2 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSupplyInput(walletAura.toString())}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-sm font-semibold text-slate-400 mr-3">AURA</span>
                </div>
              </div>
            </div>

            {/* Supply Simulation Output */}
            {simulateSupply > 0 && (
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New Supply Balance</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-slate-400 line-through">{suppliedAura}</span>
                      <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                      <span className="text-slate-900">{suppliedAura + simulateSupply} AURA</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New Borrow Limit</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-slate-400 line-through">${borrowLimitUsd.toFixed(2)}</span>
                      <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                      <span className="text-emerald-600">${simulatedBorrowLimitUsd.toFixed(2)}</span>
                    </div>
                  </div>
               </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !supplyInput || parseFloat(supplyInput) <= 0 || parseFloat(supplyInput) > walletAura}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/20 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Deposit Collateral'}
            </button>
          </form>
        </section>

        {/* Borrow Section */}
        <section className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Borrow XLM</h2>
              <p className="text-sm text-slate-500">Borrow up to 70% of collateral value</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 mb-0.5">Available to Borrow</span>
              <span className="text-sm font-semibold text-violet-700">{availableBorrowXlm.toLocaleString(undefined, {maximumFractionDigits: 2})} XLM</span>
            </div>
          </div>

          <form onSubmit={handleBorrow} className="space-y-6">
            <div className="relative">
              <label htmlFor="borrow" className="block text-sm font-medium text-slate-700 mb-2">Amount to Borrow</label>
              <div className="relative flex items-center">
                <input
                  id="borrow"
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableBorrowXlm}
                  value={borrowInput}
                  onChange={(e) => setBorrowInput(e.target.value)}
                  className="w-full pl-4 pr-20 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-lg font-medium transition-all"
                  placeholder="0.00"
                  disabled={isSubmitting || availableBorrowXlm <= 0}
                />
                <div className="absolute right-2 flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setBorrowInput(availableBorrowXlm.toString())}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-sm font-semibold text-slate-400 mr-3">XLM</span>
                </div>
              </div>
            </div>

            {/* Borrow Simulation Output */}
            {simulateBorrow > 0 && (
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New Health Factor</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-slate-400 line-through">
                        {currentHealthFactor === 0 ? '∞' : currentHealthFactor.toFixed(2)}
                      </span>
                      <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                      <span className={simulatedHealthFactor < 1.05 ? 'text-red-500' : simulatedHealthFactor < 1.5 ? 'text-amber-500' : 'text-emerald-500'}>
                        {simulatedHealthFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {simulatedHealthFactor < 1.05 && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Warning: High risk of liquidation
                    </div>
                  )}
               </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !borrowInput || parseFloat(borrowInput) <= 0 || parseFloat(borrowInput) > availableBorrowXlm}
              className="w-full py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-600/20 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Borrow XLM'}
            </button>
          </form>
        </section>

      </div>
    </Layout>
  );
}
