"use client";
import { useState } from "react";
import { db, exportAllData, importAllData } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { downloadJSON } from "@/lib/utils";
import { ZODIAC_THEMES, ELEMENT_EMOJI } from "@/lib/themes";
import { Card, CardHeader, CardTitle, PageHeader, Button } from "@/components/ui";
import { Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { settings, setDopRate, setPrimaryCurrency, setZodiacTheme } = useAppStore();
  const [rateInput, setRateInput]     = useState(String(settings?.dopRate ?? 59.5));
  const [saved, setSaved]             = useState(false);
  const [importing, setImporting]     = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const activeTheme = settings?.zodiacTheme;
  const selectedTheme = ZODIAC_THEMES.find((theme) => theme.sign === activeTheme);

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
    <div className="animate-fadeIn max-w-3xl">
      <PageHeader title="⚙️ Settings" subtitle="Preferences & data management" />

      <div className="space-y-5">

        {/* ── Zodiac Theme ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Zodiac Theme</CardTitle>
            {activeTheme && (
              <button
                onClick={() => void setZodiacTheme(undefined)}
                className="text-xs text-nova-muted hover:text-nova-text underline"
              >
                Reset to default
              </button>
            )}
          </CardHeader>
          <p className="text-sm text-nova-muted mb-5">
            Choose a zodiac sign to personalise your nav, buttons, and dashboard layout.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {ZODIAC_THEMES.map((theme) => {
              const isActive = activeTheme === theme.sign;
              return (
                <button
                  key={theme.sign}
                  type="button"
                  onClick={() => void setZodiacTheme(isActive ? undefined : theme.sign)}
                  className={`relative text-left rounded-2xl p-3 border-2 transition-all hover:scale-[1.02] active:scale-100 ${
                    isActive
                      ? "border-[var(--theme-accent,#4F7CFF)] shadow-md"
                      : "border-nova-border hover:border-nova-hint"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`${theme.name} zodiac theme`}
                >
                  {/* Color swatch — nav bg preview */}
                  <div
                    className="w-full h-8 rounded-lg mb-2 flex items-center justify-center text-lg"
                    style={{ backgroundColor: theme.navBg }}
                  >
                    <span>{theme.symbol}</span>
                  </div>

                  {/* Accent dot */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }} />
                    <span className="text-sm font-semibold text-nova-text">{theme.name}</span>
                  </div>

                  <p className="text-[10px] text-nova-muted leading-tight">{theme.dates}</p>
                  <p className="text-[10px] text-nova-muted">{ELEMENT_EMOJI[theme.element]} {theme.element} · {theme.description}</p>

                  {/* Layout badge */}
                  <span className={`mt-1.5 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    theme.layout === "money-dominant"  ? "bg-money/10 text-money" :
                    theme.layout === "health-dominant" ? "bg-health/10 text-health" :
                    "bg-nova-bg text-nova-muted"
                  }`}>
                    {theme.layout === "money-dominant" ? "💰 finance" :
                     theme.layout === "health-dominant" ? "🌿 wellness" : "⚖️ balanced"}
                  </span>

                  {/* Active checkmark */}
                  {isActive && (
                    <span
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: theme.accent }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedTheme && (
            <div className="mt-4 p-3 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "var(--theme-accent-light)", color: "var(--theme-accent)" }}>
              <span className="text-lg">{selectedTheme.symbol}</span>
              <span className="font-medium">
                {selectedTheme.name} theme active
                {" - "}{selectedTheme.description}
              </span>
            </div>
          )}
        </Card>

        {/* ── Currency ────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-nova-muted block mb-2">Primary Currency</label>
              <div className="flex gap-2">
                {(["USD", "DOP"] as const).map(c => (
                  <button key={c} onClick={() => setPrimaryCurrency(c)}
                    className={`px-6 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${settings?.primaryCurrency === c ? "border-[var(--theme-accent)] bg-theme-accent-light text-theme-accent" : "border-nova-border text-nova-muted hover:border-nova-hint"}`}>
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
                    className="w-28 px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-[var(--theme-accent)]"
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

        {/* ── Backup ──────────────────────────────────────────── */}
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

        {/* ── About ───────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>About Nova</CardTitle></CardHeader>
          <div className="text-sm text-nova-muted space-y-1">
            <p>Nova is your personal life OS — money, health & life admin in one private app.</p>
            <p>All data is stored locally in your browser using IndexedDB. Nothing leaves your device.</p>
            <p className="mt-2 font-medium text-nova-text">Version 1.0.0</p>
          </div>
        </Card>

        {/* ── Danger Zone ─────────────────────────────────────── */}
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
