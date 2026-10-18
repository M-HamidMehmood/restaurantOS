'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  QrCode,
  ArrowLeft,
  Printer,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Laptop,
  Sparkles,
  Coffee,
  Camera,
  Layers,
  UtensilsCrossed,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { generateQrDataUrl } from '@/lib/qrCode';
import { toast } from 'sonner';

interface TableRecord {
  id: string;
  tableNumber: string;
  displayName: string;
  qrSlug: string;
  capacity: number;
  status: string;
}

const DEFAULT_TABLES: TableRecord[] = [
  { id: 't-01', tableNumber: 'T-01', displayName: 'Table 01', qrSlug: 't-01', capacity: 2, status: 'available' },
  { id: 't-02', tableNumber: 'T-02', displayName: 'Table 02', qrSlug: 't-02', capacity: 2, status: 'available' },
  { id: 't-03', tableNumber: 'T-03', displayName: 'Table 03', qrSlug: 't-03', capacity: 4, status: 'available' },
  { id: 't-04', tableNumber: 'T-04', displayName: 'Table 04', qrSlug: 't-04', capacity: 4, status: 'occupied' },
  { id: 't-05', tableNumber: 'T-05', displayName: 'Table 05', qrSlug: 't-05', capacity: 4, status: 'available' },
  { id: 't-06', tableNumber: 'T-06', displayName: 'Table 06', qrSlug: 't-06', capacity: 6, status: 'available' },
  { id: 't-07', tableNumber: 'T-07', displayName: 'Table 07', qrSlug: 't-07', capacity: 6, status: 'available' },
  { id: 't-08', tableNumber: 'T-08', displayName: 'Table 08', qrSlug: 't-08', capacity: 8, status: 'available' },
];

const PROD_ORIGIN = 'https://restaurant-os-nine-fawn.vercel.app';

export default function TableQrSetupPage() {
  const { user, isLoading: authLoading, signOut } = useAdminAuth();

  const [tables, setTables] = useState<TableRecord[]>(DEFAULT_TABLES);
  const [domainMode, setDomainMode] = useState<'prod' | 'local' | 'custom'>('prod');
  const [customOrigin, setCustomOrigin] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Map of tableNumber -> QR Code Data URL (PNG base64)
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(true);

  // Filter for printable standees: 'ALL' or specific tableNumber
  const [printFilter, setPrintFilter] = useState<string>('ALL');

  // Detect current client origin on mount
  const clientOrigin = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  }, []);

  // Compute active base URL for QR codes
  const activeBaseUrl = useMemo(() => {
    if (domainMode === 'prod') return PROD_ORIGIN;
    if (domainMode === 'local') return clientOrigin;
    if (domainMode === 'custom' && customOrigin.trim()) return customOrigin.trim();
    return PROD_ORIGIN;
  }, [domainMode, customOrigin, clientOrigin]);

  // Fetch real tables from backend if available
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiUrl}/tables`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.tables) && json.tables.length > 0) {
            const mapped: TableRecord[] = json.tables.map((t: any) => ({
              id: t.id || t.tableNumber,
              tableNumber: t.tableNumber,
              displayName: t.displayName || `Table ${t.tableNumber.replace('T-', '')}`,
              qrSlug: t.qrSlug || t.tableNumber.toLowerCase(),
              capacity: t.capacity || 4,
              status: t.status || 'available',
            }));
            setTables(mapped);
          }
        }
      } catch {
        // Fallback to DEFAULT_TABLES silently
      }
    };

    fetchTables();
  }, []);

  // Generate QR code data URLs for all tables whenever activeBaseUrl or tables change
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const generateAll = async () => {
      const newMap: Record<string, string> = {};

      for (const tbl of tables) {
        const targetUrl = `${activeBaseUrl}/table/${tbl.qrSlug}`;
        const dataUrl = await generateQrDataUrl(targetUrl, {
          width: 512,
          margin: 1,
          darkColor: '#0c0a09',
          lightColor: '#ffffff',
          errorCorrectionLevel: 'H',
        });
        if (dataUrl) {
          newMap[tbl.tableNumber] = dataUrl;
        }
      }

      if (!isCancelled) {
        setQrCodeMap(newMap);
        setIsGenerating(false);
      }
    };

    generateAll();

    return () => {
      isCancelled = true;
    };
  }, [tables, activeBaseUrl]);

  // Copy URL to clipboard
  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success('Table ordering URL copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download high-resolution PNG
  const handleDownloadPng = (table: TableRecord) => {
    const dataUrl = qrCodeMap[table.tableNumber];
    if (!dataUrl) {
      toast.error('QR code is still generating, please wait a moment.');
      return;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Chaska-Chai-${table.tableNumber}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded high-res QR for ${table.displayName}!`);
  };

  // Trigger print for all tables
  const handlePrintAll = () => {
    setPrintFilter('ALL');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Trigger print for a single table
  const handlePrintSingle = (tableNumber: string) => {
    setPrintFilter(tableNumber);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const printableTables = useMemo(() => {
    if (printFilter === 'ALL') return tables;
    return tables.filter((t) => t.tableNumber === printFilter);
  }, [tables, printFilter]);

  return (
    <div className="flex w-full min-h-screen bg-stone-100 font-sans">
      {/* Admin Sidebar (hidden during printing) */}
      <AdminSidebar activeOrdersCount={0} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto no-print">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <Link
                href="/admin"
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                title="Back to Operations Feed"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-stone-900 tracking-tight">
                    Table QR Code Provisioning
                  </h1>
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] font-bold">
                    8 Cafe Tables
                  </Badge>
                </div>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Generate scannable, high-density QR codes and printable acrylic table standees.
                </p>
              </div>
            </div>

            {/* Quick Global Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                type="button"
                onClick={handlePrintAll}
                className="bg-stone-900 hover:bg-black text-white text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print All Standees</span>
              </Button>
            </div>
          </div>

          {/* Domain & Target Configuration Panel */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-700">
                  Target Domain Encoding
                </h3>
              </div>
              <p className="text-[11px] text-stone-500">
                Choose which base domain is encoded into physical QR codes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Option 1: Live Production */}
              <button
                type="button"
                onClick={() => setDomainMode('prod')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  domainMode === 'prod'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Production (Vercel)</span>
                <span className="text-[10px] opacity-75 font-mono">
                  restaurant-os-nine-fawn.vercel.app
                </span>
              </button>

              {/* Option 2: Localhost */}
              <button
                type="button"
                onClick={() => setDomainMode('local')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  domainMode === 'local'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Local Development</span>
                <span className="text-[10px] opacity-75 font-mono">{clientOrigin}</span>
              </button>

              {/* Option 3: Custom IP / LAN */}
              <button
                type="button"
                onClick={() => setDomainMode('custom')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  domainMode === 'custom'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>Custom IP / LAN</span>
              </button>
            </div>

            {domainMode === 'custom' && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. http://192.168.1.15:3001"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  className="flex-1 max-w-sm px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-500">
                  Allows physical phones connected to the same Wi-Fi to scan and test local orders.
                </span>
              </div>
            )}
          </div>

          {/* Grid of Tables & Scannable QR Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const targetUrl = `${activeBaseUrl}/table/${table.qrSlug}`;
              const qrDataUrl = qrCodeMap[table.tableNumber];
              const isCopied = copiedKey === table.tableNumber;

              return (
                <div
                  key={table.id}
                  className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all group"
                >
                  {/* Table Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-stone-900 tracking-tight">
                        {table.displayName}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Seats {table.capacity} Guests • {table.tableNumber}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold ${
                        table.status === 'occupied'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {table.status === 'occupied' ? 'Occupied' : 'Available'}
                    </Badge>
                  </div>

                  {/* Scannable High-Res QR Code Card */}
                  <div className="relative aspect-square w-full rounded-2xl bg-white border border-stone-200 p-3 flex flex-col items-center justify-center shadow-inner group-hover:shadow-md transition-shadow">
                    {qrDataUrl && typeof qrDataUrl === 'string' && qrDataUrl.trim().length > 0 ? (
                      <img
                        src={qrDataUrl}
                        alt={`Scannable QR for ${table.displayName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-[11px] font-semibold">Generating QR...</span>
                      </div>
                    )}
                  </div>

                  {/* Encoded URL with Copy Action */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-semibold">Direct Slug URL:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(targetUrl, table.tableNumber)}
                        className="text-stone-600 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                        title="Copy direct ordering URL"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[10px] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-1.5 truncate">
                      {targetUrl}
                    </p>
                  </div>

                  {/* Table Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPng(table)}
                      className="text-[11px] font-bold h-8 rounded-xl border-stone-200 hover:bg-stone-100 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-stone-600" />
                      <span>PNG</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePrintSingle(table.tableNumber)}
                      className="text-[11px] font-bold h-8 rounded-xl bg-stone-900 hover:bg-black text-white flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-amber-400" />
                      <span>Standee</span>
                    </Button>
                  </div>

                  {/* Test Open Digital Menu */}
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1 text-center text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Test Open Menu</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* PRINT-ONLY CONTAINER (Standard Table Standee Card Sheet with @media print) */}
      {/* ========================================================================= */}
      <div className="hidden print:block w-full text-black bg-white">
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
            .table-standee-card {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .table-standee-break {
              page-break-after: always;
              break-after: page;
            }
          }
        `}</style>

        <div className="grid grid-cols-2 gap-8 p-4">
          {printableTables.map((table, index) => {
            const qrDataUrl = qrCodeMap[table.tableNumber];
            const targetUrl = `${activeBaseUrl}/table/${table.qrSlug}`;

            return (
              <div
                key={table.id}
                className="table-standee-card border-4 border-black rounded-3xl p-6 flex flex-col items-center justify-between text-center bg-white min-h-[480px] space-y-4"
              >
                {/* Standee Header */}
                <div className="space-y-1 w-full border-b-2 border-black pb-3">
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="w-5 h-5 fill-black text-black" />
                    <h2 className="text-xl font-black tracking-tight uppercase">
                      CHASKA & CHAI CAFE
                    </h2>
                  </div>
                  <p className="text-[11px] font-semibold tracking-wide text-neutral-800 uppercase">
                    Authentic Pakistani Street Flavors • Real-Time Ordering
                  </p>
                </div>

                {/* Big Bold Table Number */}
                <div className="bg-black text-white px-6 py-2 rounded-2xl w-full">
                  <h3 className="text-2xl font-black tracking-wider uppercase">
                    {table.displayName}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                    Seats {table.capacity} Guests • Self-Ordering QR
                  </p>
                </div>

                {/* Scannable High-Contrast QR Code */}
                <div className="w-56 h-56 p-2 border-2 border-black rounded-2xl flex items-center justify-center bg-white">
                  {qrDataUrl && typeof qrDataUrl === 'string' && qrDataUrl.trim().length > 0 && (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${table.displayName}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* 3 Simple Ordering Steps */}
                <div className="w-full bg-neutral-100 border border-neutral-300 rounded-xl p-3 text-left space-y-1 text-[11px]">
                  <div className="font-black text-black uppercase tracking-wider text-[10px] pb-1 border-b border-neutral-200">
                    How To Order:
                  </div>
                  <div className="flex items-center gap-2 font-bold text-black">
                    <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0">
                      1
                    </span>
                    <span>Open phone camera & point at this QR code</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-black">
                    <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0">
                      2
                    </span>
                    <span>Browse live menu & customize your favorite dishes</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-black">
                    <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] shrink-0">
                      3
                    </span>
                    <span>Send order directly to kitchen — no waiting!</span>
                  </div>
                </div>

                {/* Standee Footer */}
                <div className="w-full pt-2 border-t border-black text-[10px] text-neutral-700 space-y-0.5">
                  <p className="font-mono font-bold">{targetUrl}</p>
                  <p className="font-semibold">
                    Free Guest Wi-Fi: <span className="font-bold">Chaska-Guest</span> • No App Download Required
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
