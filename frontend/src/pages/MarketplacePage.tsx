import { useState, useEffect } from 'react';
import { ShoppingBag, Tag, Coins, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';
import Layout from '../components/Layout';

// Tipos base
interface Guarantee {
  id: string;
  guaranteeId: number;
  tipo: string;
  estado: string;
  txHash: string;
}

interface Offer {
  offerId: string;
  seller: string;
  amount: string;
  price: string;
}

export default function MarketplacePage() {
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales / formularios
  const [selectedGuarantee, setSelectedGuarantee] = useState<string>('');
  const [offerAmount, setOfferAmount] = useState('1000');
  const [offerPrice, setOfferPrice] = useState('10');
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  const [buyAmount, setBuyAmount] = useState('100');
  const [isBuying, setIsBuying] = useState<string | null>(null);

  const fetchGuarantees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://127.0.0.1:3000/guarantee');
      const data = await res.json();
      if (data.success) {
        setGuarantees(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    if (!selectedGuarantee) return;
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:3000/marketplace/offers/${selectedGuarantee}`);
      const data = await res.json();
      if (data.success) {
        setOffers(data.data);
      } else {
        setOffers([]);
      }
    } catch (err: any) {
      console.error(err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuarantees();
  }, []);

  useEffect(() => {
    if (selectedGuarantee) {
      fetchOffers();
    } else {
      setOffers([]);
    }
  }, [selectedGuarantee]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuarantee) return;
    try {
      setIsCreatingOffer(true);
      setError(null);
      const payload = {
        guaranteeId: Number(selectedGuarantee),
        amount: Number(offerAmount),
        pricePerToken: Number(offerPrice)
      };
      
      const res = await fetch('http://127.0.0.1:3000/marketplace/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Oferta creada exitosamente. TxHash: ${data.data.txHash}`);
        fetchOffers();
      } else {
        setError(data.error || 'Error al crear la oferta');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleBuyTokens = async (offerId: string) => {
    try {
      setIsBuying(offerId);
      setError(null);
      const payload = {
        offerId: Number(offerId),
        amount: Number(buyAmount)
      };
      
      const res = await fetch('http://127.0.0.1:3000/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Compra exitosa. TxHash: ${data.data.txHash}`);
        fetchOffers();
      } else {
        alert(`Error al comprar: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error al comprar: ${err.message}`);
    } finally {
      setIsBuying(null);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-2 max-w-6xl mx-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace DeFi</h1>
          <p className="text-slate-500 mt-1">
            Creá ofertas de venta y comprá garantías tokenizadas en Stellar Testnet.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Col 1: Crear Ofertas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Crear oferta de venta</h2>
                <p className="text-sm text-slate-500">Vendé fracciones de tu garantía activa</p>
              </div>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Seleccionar garantía</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={selectedGuarantee}
                  onChange={(e) => setSelectedGuarantee(e.target.value)}
                  disabled={loading && guarantees.length === 0}
                >
                  <option value="">-- Seleccionar ID de Garantía --</option>
                  {guarantees
                    .filter(g => g.guaranteeId !== undefined)
                    .map(g => (
                    <option key={g.id} value={g.guaranteeId}>
                      ID: {g.guaranteeId} - {g.tipo} ({g.estado})
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-xs text-slate-500">
                    Mostrando solo garantías en testnet.
                  </span>
                  <button 
                    type="button" 
                    onClick={fetchGuarantees} 
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    <RefreshCcw className="w-3 h-3" /> Actualizar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Cantidad a vender</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Precio (XLM)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedGuarantee || isCreatingOffer}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all ${
                  !selectedGuarantee || isCreatingOffer 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isCreatingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                {isCreatingOffer ? 'Creando oferta on-chain...' : 'Publicar oferta'}
              </button>
            </form>
          </section>

          {/* Col 2: Comprar Tokens */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Ofertas activas</h2>
                <p className="text-sm text-slate-500">
                  {selectedGuarantee 
                    ? `Ofertas para Garantía #${selectedGuarantee}`
                    : 'Seleccioná una garantía para ver ofertas'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {loading && !isCreatingOffer ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.map(offer => (
                    <div key={offer.offerId} className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Oferta #{offer.offerId}</span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-semibold text-slate-900">{Number(offer.amount) / 10000000}</span>
                            <span className="text-sm font-medium text-slate-500">fracciones</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Precio</span>
                          <div className="flex items-center gap-1 mt-1 justify-end text-blue-600">
                            <Coins className="w-4 h-4" />
                            <span className="text-lg font-semibold">{Number(offer.price) / 10000000} XLM</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center pt-3 border-t border-slate-200">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cantidad"
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                        />
                        <button
                          onClick={() => handleBuyTokens(offer.offerId)}
                          disabled={isBuying === offer.offerId}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition"
                        >
                          {isBuying === offer.offerId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Comprar'}
                          {!isBuying && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <ShoppingBag className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No se encontraron ofertas activas</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
