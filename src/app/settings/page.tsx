"use client";
import { useState } from "react";
import { db, exportAllData, importAllData } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { downloadJSON } from "@/lib/utils";
import type { ZodiacSign } from "@/types";
import { Card, CardHeader, CardTitle, PageHeader, Button } from "@/components/ui";
import { Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";

const ZODIAC_SIGNS: ZodiacSign[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

function formatSign(sign: ZodiacSign) {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

export default function SettingsPage() {
  const { settings, setDopRate, setPrimaryCurrency, setZodiacSign } = useAppStore();
  const [rateInput, setRateInput] = useState(String(settings?.dopRate ?? 59.5));
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const saveRate = async () => {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) return;
    await setDopRate(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const json = await exportAllData();
    downloadJSON(json, `nova-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      const text = await file.text();
      await importAllData(text);
      setImporting(false);
      alert("Data imported successfully! Refresh the page.");
    };
    input.click();
  };

  const handleReset = async () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="animate-fadeIn max-w-2xl">
      <PageHeader title="⚙️ Settings" subtitle="Preferences & data management" />

      <div className="space-y-5">
        {/* Currency */}
        <Card>
          <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-nova-muted block mb-2">Primary Currency</label>
              <div className="flex gap-2">
                {(["USD", "DOP"] as const).map(c => (
                  <button key={c} onClick={() => setPrimaryCurrency(c)}
                    className={`px-6 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${settings?.primaryCurrency === c ? "border-money bg-money/10 text-money" : "border-nova-border text-nova-muted hover:border-money/50"}`}>
                    {c === "USD" ? "🇺🇸 USD" : "🇩🇴 DOP"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-nova-muted block mb-2">USD → DOP Exchange Rate</label>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-nova-muted text-sm">$1 USD =</span>
                  <input
                    type="number"
                    value={rateInput}
                    onChange={e => setRateInput(e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-money"
                    step="0.1"
                  />
                  <span className="text-nova-muted text-sm">DOP</span>
                </div>
                <Button variant="primary" onClick={saveRate} icon={<RefreshCw size={14} />}>
                  {saved ? "Saved ✓" : "Update"}
                </Button>
              </div>
              {settings?.dopRateUpdatedAt && (
                <p className="text-xs text-nova-muted mt-1">
                  Last updated: {new Date(settings.dopRateUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Zodiac</CardTitle></CardHeader>
          <div className="space-y-3">
            <p className="text-sm text-nova-muted">
              Choose the sign you want Nova to reflect in rewards, prompts, and ritual energy.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ZODIAC_SIGNS.map((sign) => (
                <button
                  key={sign}
                  onClick={() => void setZodiacSign(sign)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    settings?.zodiacSign === sign
                      ? "border-life bg-life/10 text-life"
                      : "border-nova-border text-nova-muted hover:border-life/50 hover:text-nova-text"
                  }`}
                >
                  {formatSign(sign)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader><CardTitle>Backup & Export</CardTitle></CardHeader>
          <p className="text-sm text-nova-muted mb-4">Nova stores all data locally in your browser. Export regularly to keep a backup.</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport}>
              Export JSON Backup
            </Button>
            <Button variant="outline" icon={<Upload size={16} />} onClick={handleImport} disabled={importing}>
              {importing ? "Importing…" : "Import Backup"}
            </Button>
          </div>
        </Card>

        {/* About */}
        <Card>
          <CardHeader><CardTitle>About Nova</CardTitle></CardHeader>
          <div className="text-sm text-nova-muted space-y-1">
            <p>Nova is your personal life OS — money, health & life admin in one private app.</p>
            <p>All data is stored locally in your browser using IndexedDB. Nothing leaves your device.</p>
            <p className="mt-2 font-medium text-nova-text">Version 1.0.0</p>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-nova-muted mb-4">This will permanently delete all data. Export a backup first.</p>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="border border-danger/30 text-danger hover:bg-danger/10"
          >
            {resetConfirm ? "⚠️ Click again to confirm deletion" : "Reset All Data"}
          </Button>
          {resetConfirm && (
            <button onClick={() => setResetConfirm(false)} className="ml-3 text-sm text-nova-muted underline">
              Cancel
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
