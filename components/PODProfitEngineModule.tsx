'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { PODPreset } from '@/lib/types';
import { 
  Calculator, 
  Bookmark, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Trash2, 
  Copy, 
  Check, 
  Package, 
  Printer, 
  Truck,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export function PODProfitEngineModule() {
  const { teamMember } = useAuth();
  const [presets, setPresets] = useState<PODPreset[]>([]);

  // Input states
  const [currency, setCurrency] = useState<'₹' | '$'>('₹');
  const [garmentCost, setGarmentCost] = useState<number>(240); // Base T-shirt/hoodie cost
  const [printingCost, setPrintingCost] = useState<number>(110); // DTF / DTG / Screen print
  const [packagingCourier, setPackagingCourier] = useState<number>(80); // Polymailer, thank-you card, courier
  const [platformFeePct, setPlatformFeePct] = useState<number>(3); // Shopify/Razorpay/Stripe %
  const [plannedSellingPrice, setPlannedSellingPrice] = useState<number>(799); // Retail price
  const [presetName, setPresetName] = useState<string>('Oversized Tee (Heavyweight 240 GSM)');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Firestore presets listener
  useEffect(() => {
    const q = query(collection(db, 'pod_presets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PODPreset[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          garmentCost: data.garmentCost || 0,
          printingCost: data.printingCost || 0,
          packagingCourier: data.packagingCourier || 0,
          platformFeePct: data.platformFeePct || 0,
          sellingPrice: data.sellingPrice || 0,
          netProfit: data.netProfit || 0,
          profitMarginPct: data.profitMarginPct || 0,
          breakEvenPrice: data.breakEvenPrice || 0,
          currency: data.currency || '₹',
          savedBy: data.savedBy || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      setPresets(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'pod_presets');
    });

    return () => unsubscribe();
  }, []);

  // COMPUTATIONS:
  // Direct Production Cost = Garment + Printing + Courier/Packaging
  const directCost = (garmentCost || 0) + (printingCost || 0) + (packagingCourier || 0);

  // Gateway / Platform Fee = Planned Selling Price * (Platform Fee % / 100)
  const platformFeeAmount = (plannedSellingPrice || 0) * ((platformFeePct || 0) / 100);

  // Total Cost per Unit
  const totalUnitCost = directCost + platformFeeAmount;

  // Net Profit per Unit
  const netProfit = (plannedSellingPrice || 0) - totalUnitCost;

  // Profit Percentage (%) = (Net Profit / Planned Selling Price) * 100
  const profitMarginPct = plannedSellingPrice > 0 ? (netProfit / plannedSellingPrice) * 100 : 0;

  // Minimum Break-Even Price:
  // BreakEven = DirectCost / (1 - (PlatformFeePct / 100))
  const breakEvenPrice =
    platformFeePct < 100
      ? directCost / (1 - (platformFeePct || 0) / 100)
      : directCost;

  // Save Preset to Firestore
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim() || !teamMember) return;

    try {
      await addDoc(collection(db, 'pod_presets'), {
        name: presetName.trim(),
        garmentCost,
        printingCost,
        packagingCourier,
        platformFeePct,
        sellingPrice: plannedSellingPrice,
        netProfit: Number(netProfit.toFixed(2)),
        profitMarginPct: Number(profitMarginPct.toFixed(1)),
        breakEvenPrice: Number(breakEvenPrice.toFixed(2)),
        currency,
        savedBy: teamMember.displayName,
        createdAt: new Date().toISOString(),
      });
      alert('Preset saved to team Firestore presets!');
    } catch (err) {
      console.error('Error saving preset:', err);
    }
  };

  const handleLoadPreset = (p: PODPreset) => {
    setPresetName(p.name);
    setGarmentCost(p.garmentCost);
    setPrintingCost(p.printingCost);
    setPackagingCourier(p.packagingCourier);
    setPlatformFeePct(p.platformFeePct);
    setPlannedSellingPrice(p.sellingPrice);
    if (p.currency === '₹' || p.currency === '$') {
      setCurrency(p.currency);
    }
  };

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'pod_presets', id));
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
  };

  const handleLogSaleMilestone = async () => {
    if (!teamMember) return;
    try {
      const units = 10;
      const rev = Number((plannedSellingPrice * units).toFixed(2));
      const prof = Number((netProfit * units).toFixed(2));
      await addDoc(collection(db, 'sales_logs'), {
        productName: presetName || 'POD Oversized Tee',
        unitsSold: units,
        grossRevenue: rev,
        netProfit: prof,
        date: new Date().toISOString().split('T')[0],
        channel: 'POD Profit Engine',
        loggedBy: teamMember.displayName,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error logging sale milestone:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          Print-On-Demand (POD) Profit Engine & Pricing Calculator
        </h2>
        <p className="text-sm text-slate-400">
          Compute garment unit economics, exact shipping & printing breakdown, gateway friction, and minimum break-even margins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculator Inputs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Unit Cost Breakdown & Parameters
            </h3>

            {/* Currency selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setCurrency('₹')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  currency === '₹' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ₹ (INR)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('$')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  currency === '$' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                $ (USD)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Base Garment Cost */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Base Garment Cost</span>
                <span className="text-slate-500 font-normal">Blank T-shirt/Hoodie</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{currency}</span>
                <input
                  type="number"
                  value={garmentCost}
                  onChange={(e) => setGarmentCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-8 pr-3.5 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Printing Cost */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Custom Printing Cost</span>
                <span className="text-slate-500 font-normal">DTF / Screen print</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{currency}</span>
                <input
                  type="number"
                  value={printingCost}
                  onChange={(e) => setPrintingCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-8 pr-3.5 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Packaging & Courier */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Packaging & Courier</span>
                <span className="text-slate-500 font-normal">Box + Shiprocket</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{currency}</span>
                <input
                  type="number"
                  value={packagingCourier}
                  onChange={(e) => setPackagingCourier(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-8 pr-3.5 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Platform / Gateway Fee % */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Platform/Payment Fee</span>
                <span className="text-slate-500 font-normal">Shopify + Gateway</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                <input
                  type="number"
                  step="0.1"
                  value={platformFeePct}
                  onChange={(e) => setPlatformFeePct(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl pl-8 pr-3.5 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Planned Selling Price */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Planned Customer Selling Price (M.R.P)
              </label>
              <span className="text-xs text-slate-400">Direct-To-Consumer Target</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-sm text-emerald-400 font-bold">{currency}</span>
              <input
                type="number"
                value={plannedSellingPrice}
                onChange={(e) => setPlannedSellingPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border-2 border-emerald-500/50 text-white text-lg font-bold rounded-xl pl-10 pr-4 py-2.5 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Save Preset to Firestore */}
          <form onSubmit={handleSavePreset} className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <input
              type="text"
              required
              placeholder="Preset Name (e.g. Acid Wash Tee 280 GSM)"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md"
            >
              <Bookmark className="w-3.5 h-3.5" /> Save Preset
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Profit Computed Metrics */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Real-Time Profit Computations
            </h3>

            {/* Net Profit Big Stat */}
            <div className={`p-4 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">Net Profit Margin per Unit</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {profitMarginPct.toFixed(1)}% Margin
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currency}{netProfit.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">clean profit / shirt</span>
              </div>
            </div>

            {/* Break-even Minimum recommendation */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Break-Even Baseline:
                </span>
                <span className="font-bold text-white font-mono text-sm">
                  {currency}{breakEvenPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Do NOT price below {currency}{breakEvenPrice.toFixed(0)} or the team loses money on base garment, DTF printing, shipping, and gateway charges combined.
              </p>
            </div>

            {/* Cost Distribution List */}
            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Production & Garment</span>
                <span className="text-slate-200 font-mono">{currency}{garmentCost}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>DTF / Custom Print</span>
                <span className="text-slate-200 font-mono">{currency}{printingCost}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Packaging & Logistics</span>
                <span className="text-slate-200 font-mono">{currency}{packagingCourier}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Gateway Fee ({platformFeePct}%)</span>
                <span className="text-slate-200 font-mono">{currency}{platformFeeAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-white font-semibold border-t border-slate-800 pt-1.5">
                <span>Total Cost of Goods Sold (COGS)</span>
                <span className="font-mono text-emerald-400">{currency}{totalUnitCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick Milestone Log Button */}
            <button
              type="button"
              onClick={handleLogSaleMilestone}
              className="cursor-pointer min-h-[40px] w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Log 10-Unit Sale Milestone &bull; Notify Team</span>
            </button>
          </div>
        </div>

        {/* Bottom Presets Row */}
        <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 sm:mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              Saved POD Presets for 3-Member Team
            </h3>
            <span className="text-xs text-slate-400">{presets.length} presets stored in Firestore</span>
          </div>

          {presets.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No presets saved yet. Configure your oversized tee, hoodie, or crop-top margins above and click &quot;Save Preset&quot;.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleLoadPreset(p)}
                  className="cursor-pointer bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {p.name}
                    </h4>
                    <button
                      onClick={(e) => handleDeletePreset(p.id, e)}
                      className="text-slate-600 hover:text-red-400 p-0.5 transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Selling Price:</span>
                    <span className="font-bold text-white">{p.currency}{p.sellingPrice}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-semibold">Profit: +{p.currency}{p.netProfit}</span>
                    <span className="text-slate-400 text-[11px] font-medium">{p.profitMarginPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
