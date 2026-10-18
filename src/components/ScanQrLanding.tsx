'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Camera,
  UtensilsCrossed,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  ChevronRight,
  Store,
  CheckCircle2,
  ExternalLink,
  Flame,
  Coffee,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMenuStore } from '@/store/useMenuStore';
import { generateQrDataUrl } from '@/lib/qrCode';

interface ScanQrLandingProps {
  detectedTableId?: string;
}

export const ScanQrLanding: React.FC<ScanQrLandingProps> = ({ detectedTableId }) => {
  const router = useRouter();
  const tableId = useMenuStore((state) => state.tableId);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);
  const activeOrders = useMenuStore((state) => state.activeOrders);

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Selected table for the QR code display (defaults to table 4 or current tableId)
  const [selectedTable, setSelectedTable] = useState<string>(() => {
    return detectedTableId || tableId || '4';
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const rawNumber = selectedTable.replace(/^T-0*/i, '').replace(/^table-0*/i, '') || '4';
    const slug = `t-${rawNumber.padStart(2, '0')}`;
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://restaurant-os-nine-fawn.vercel.app';
    const url = `${origin}/table/${slug}`;
    setTargetUrl(url);

    generateQrDataUrl(url, {
      width: 480,
      margin: 1,
      darkColor: '#0c0a09',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'H',
    }).then((data) => {
      if (data) setQrDataUrl(data);
    });
  }, [selectedTable]);

  const handleCopy = () => {
    if (targetUrl) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasActiveSession = Boolean(tableId && tableId.trim().length > 0 && activeOrders.length > 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-stone-800/80 bg-stone-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 font-black text-base">
              <Flame className="w-5 h-5 fill-stone-950" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Chaska & Chai Cafe
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Dine-In POS
                </span>
              </h1>
              <p className="text-[10px] text-stone-400">Authentic Street Flavors • Real-Time Ordering</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs font-semibold text-stone-400 hover:text-amber-400 transition-colors px-2.5 py-1.5 rounded-lg border border-stone-800 hover:border-amber-500/40 flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-8">
        {/* Active Session Alert Banner (if user previously had an active order) */}
        {hasActiveSession && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border border-amber-500/40 rounded-2xl p-3.5 text-left flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-amber-200">
                  Active Dining Session at {getFormattedTable()}
                </p>
                <p className="text-[11px] text-stone-300">
                  {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in kitchen progression
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => router.push(`/table/${tableId.toLowerCase()}`)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              Resume Order
            </Button>
          </div>
        )}

        {/* Hero Header */}
        <div className="space-y-3">
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-3 py-1 text-xs uppercase tracking-wider">
            Digital QR Table Ordering
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Order?
          </h2>
          <p className="text-sm sm:text-base text-stone-300 max-w-md mx-auto leading-relaxed">
            Scan the QR code on your table to start ordering your delicious meal
          </p>
        </div>

        {/* Interactive Stylized QR Scanner Viewfinder Graphic */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-stone-900/90 border border-stone-800 p-5 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/10 group">
          {/* Viewfinder Target Brackets (Corners) */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-3 border-l-3 border-amber-500 rounded-tl-xl pointer-events-none"></div>
          <div className="absolute top-3 right-3 w-6 h-6 border-t-3 border-r-3 border-amber-500 rounded-tr-xl pointer-events-none"></div>
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-3 border-l-3 border-amber-500 rounded-bl-xl pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-3 border-r-3 border-amber-500 rounded-br-xl pointer-events-none"></div>

          {/* Animated Laser Scanning Beam */}
          <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none"></div>

          {/* Real Scannable High-Res QR Card in center */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl bg-white p-2.5 shadow-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-stone-100">
            {qrDataUrl && typeof qrDataUrl === 'string' && qrDataUrl.trim().length > 0 ? (
              <img
                src={qrDataUrl}
                alt={`Scannable QR Code for Table ${selectedTable}`}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-stone-500 animate-pulse font-medium">
                Generating QR code...
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Point camera to scan
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
              Table {selectedTable.replace(/^T-0*/i, '').replace(/^table-0*/i, '').padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Quick Table Switcher & Direct Menu Action */}
        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-semibold flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-500" />
              Active Table QR Code:
            </span>
            <span className="font-mono text-amber-400 font-bold text-[11px] truncate max-w-[200px]">
              {targetUrl}
            </span>
          </div>

          {/* Quick Table Buttons (T-01 to T-08) */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {['1', '2', '3', '4', '5', '6', '7', '8'].map((num) => {
              const isSelected =
                selectedTable.replace(/^T-0*/i, '').replace(/^table-0*/i, '') === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedTable(num)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700'
                  }`}
                >
                  Table {num.padStart(2, '0')}
                </button>
              );
            })}
          </div>

          {/* Tap to Open Directly (for desktop/browser users without camera) */}
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/table/t-${selectedTable
                    .replace(/^T-0*/i, '')
                    .replace(/^table-0*/i, '')
                    .padStart(2, '0')}`
                )
              }
              className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs h-9.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <span>
                Tap to Open Table{' '}
                {selectedTable
                  .replace(/^T-0*/i, '')
                  .replace(/^table-0*/i, '')
                  .padStart(2, '0')}{' '}
                Menu
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto px-3 h-9.5 rounded-xl border border-stone-800 bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px]">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The 3 Steps (Exact User Requirement) */}
        <div className="w-full space-y-3">
          <div className="text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
              How It Works
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full text-left">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 flex items-start gap-3.5 transition-all hover:border-stone-700">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Locate the QR code on your table
                </h4>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                  Look for the wooden standee or QR sticker placed on your table top.
                </p>
              </div>
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 flex items-start gap-3.5 transition-all hover:border-stone-700">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Open your phone&apos;s camera
                </h4>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                  Point your mobile camera at the code. No special app or download required!
                </p>
              </div>
              <Camera className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 flex items-start gap-3.5 transition-all hover:border-stone-700">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Scan and start ordering!
                </h4>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                  Tap the notification to browse the live menu, customize dishes, and send orders straight to the kitchen.
                </p>
              </div>
              <UtensilsCrossed className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Terms & Privacy Statement Links */}
        <div className="w-full pt-4 border-t border-stone-800/80 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-stone-400">
            By dining & ordering, you agree to cafe policies.
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="text-stone-300 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-stone-300 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Privacy Statement
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-stone-800/80 bg-stone-900/40 text-center">
        <p className="text-[11px] text-stone-400">
          Chaska & Chai Cafe • Real-Time Restaurant Operating System & POS
        </p>
      </footer>

      {/* Terms & Conditions Dialog Modal */}
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-md w-full bg-stone-900 border border-stone-800 text-stone-100 p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1">
              <FileText className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Terms & Conditions
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Chaska & Chai Cafe Dining & Ordering Guidelines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-stone-300 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                1. Dine-In Ordering & Kitchen Dispatch
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Orders submitted through the table QR digital menu are transmitted instantly to the kitchen display system (KDS) and thermal KOT printer. Each dish is prepared fresh to order.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                2. Table Verification
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Please ensure you scan the QR code affixed to your actual dining table. Orders are delivered directly to the physical table number encoded in the QR code.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                3. Order Adjustments & Cancellations
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Once an order transitions to the &quot;Preparing&quot; status in the kitchen, items cannot be cancelled automatically. Please call your server if you require urgent changes.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                4. Bill Settlement & Payments
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Final bills include ordered items and service. You may request bill settlement directly from your mobile screen via cash, credit/debit card, or online transfer with your floor server.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setIsTermsOpen(false)}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer"
            >
              I Understand & Agree
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Statement Dialog Modal */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-md w-full bg-stone-900 border border-stone-800 text-stone-100 p-6 rounded-3xl">
          <DialogHeader className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Privacy Statement
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              How we protect your dining experience and data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-stone-300 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                1. No Account Required
              </h5>
              <p className="text-stone-400 leading-relaxed">
                We believe in frictionless dining. You do not need to register an account, download any app, or share sensitive personal passwords to order.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                2. Device Local Session Storage
              </h5>
              <p className="text-stone-400 leading-relaxed">
                We store temporary session information (such as your table number, cart items, and active order IDs) locally on your device&apos;s browser so your order tracker remains active if your connection hiccups.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                3. Real-Time Encrypted WebSockets
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Kitchen notifications and waiter call alerts travel across encrypted WebSocket channels with strict server-side schema validation.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                4. Data Retention
              </h5>
              <p className="text-stone-400 leading-relaxed">
                Order records are maintained solely for cafe accounting and kitchen performance analytics. No personal profiling or third-party ad targeting is ever conducted.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setIsPrivacyOpen(false)}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer"
            >
              Close Privacy Statement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
