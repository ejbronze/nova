"use client";

import { useEffect, useState } from "react";
import { db, exportAllData, importAllData } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import {
  disconnectGoogleCalendar,
  fetchGoogleCalendarStatus,
  pushPendingCalendarEvents,
  syncGoogleCalendarFromRemote,
} from "@/lib/google-calendar";
import { downloadJSON } from "@/lib/utils";
import type { ZodiacSign } from "@/types";
import { Card, CardHeader, CardTitle, PageHeader, Button, Badge } from "@/components/ui";
import { Download, Upload, AlertTriangle, RefreshCw, Link2, Unplug } from "lucide-react";

const ZODIAC_SIGNS: ZodiacSign[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

function formatSign(sign: ZodiacSign) {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

function formatCalendarFeedback(code: string | null) {
  if (!code) return null;
  if (code === "connected") return { tone: "success", text: "Google Calendar connected." };
  if (code === "access_denied") return { tone: "error", text: "Google Calendar access was denied." };
  if (code === "state_error") return { tone: "error", text: "Google Calendar connection expired. Try again." };
  if (code.includes("GOOGLE_")) return { tone: "error", text: "Google OAuth environment variables are missing." };
  return { tone: "error", text: "Google Calendar connection hit an error. Check your OAuth setup and try again." };
}

export default function SettingsPage() {
  const { settings, setDopRate, setPrimaryCurrency, setZodiacSign, patchSettings } = useAppStore();
  const [rateInput, setRateInput] = useState(String(settings?.dopRate ?? 59.5));
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [urlFeedback, setUrlFeedback] = useState<ReturnType<typeof formatCalendarFeedback>>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrlFeedback(formatCalendarFeedback(new URLSearchParams(window.location.search).get("googleCalendar")));
  }, []);

  useEffect(() => {
    setRateInput(String(settings?.dopRate ?? 59.5));
  }, [settings?.dopRate]);

  useEffect(() => {
    const loadCalendarStatus = async () => {
      try {
        const status = await fetchGoogleCalendarStatus();
        await patchSettings({
          googleCalendarConnected: status.connected,
          googleCalendarEmail: status.email,
          googleCalendarCalendarId: status.calendarId,
          googleCalendarCalendarName: status.calendarName,
        });
      } catch {
        setCalendarMessage("Could not load Google Calendar status.");
      } finally {
        setCalendarLoading(false);
      }
    };

    void loadCalendarStatus();
  }, [patchSettings]);

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
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    await db.delete();
    window.location.reload();
  };

  const handleConnectCalendar = () => {
    window.location.href = "/api/google-calendar/connect";
  };

  const handleDisconnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      await disconnectGoogleCalendar();
      await patchSettings({
        googleCalendarConnected: false,
        googleCalendarEmail: undefined,
        googleCalendarCalendarId: undefined,
        googleCalendarCalendarName: undefined,
      });
      setCalendarMessage("Google Calendar disconnected.");
    } catch (error) {
      setCalendarMessage(error instanceof Error ? error.message : "Unable to disconnect Google Calendar.");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCalendarSync = async () => {
    setCalendarSyncing(true);
    setCalendarMessage(null);
    try {
      const push = await pushPendingCalendarEvents();
      const pulled = await syncGoogleCalendarFromRemote();
      if (push.errors.length) {
        setCalendarMessage(`Synced with ${push.errors.length} issue${push.errors.length === 1 ? "" : "s"}.`);
      } else {
        setCalendarMessage(
          `Calendar synced: ${push.created} created, ${push.updated} updated, ${push.deleted} deleted, ${pulled} pulled.`
        );
      }
    } catch (error) {
      setCalendarMessage(error instanceof Error ? error.message : "Calendar sync failed.");
    } finally {
      setCalendarSyncing(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl">
      <PageHeader title="⚙️ Settings" subtitle="Preferences, backups, and integrations" />

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-nova-muted block mb-2">Primary Currency</label>
              <div className="flex gap-2">
                {(["USD", "DOP"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => void setPrimaryCurrency(c)}
                    className={`px-6 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${settings?.primaryCurrency === c ? "border-money bg-money/10 text-money" : "border-nova-border text-nova-muted hover:border-money/50"}`}
                  >
                    {c === "USD" ? "🇺🇸 USD" : "🇩🇴 DOP"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-nova-muted block mb-2">USD → DOP Exchange Rate</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="number"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="rounded-xl border border-nova-border px-4 py-2 text-sm min-w-[180px]"
                />
                <Button variant="primary" onClick={saveRate}>Save Rate</Button>
                {saved && <Badge variant="money">Saved</Badge>}
              </div>
              {settings?.dopRateUpdatedAt && (
                <p className="text-xs text-nova-muted mt-2">
                  Last updated {new Date(settings.dopRateUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Google Calendar</CardTitle></CardHeader>
          <div className="space-y-4">
            <p className="text-sm text-nova-muted">
              Connect Nova to one Google Calendar so local events can sync both ways with Google.
            </p>

            {(urlFeedback || calendarMessage) && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${urlFeedback?.tone === "error" || calendarMessage?.toLowerCase().includes("error") ? "border-danger/30 bg-danger/5 text-danger" : "border-health/30 bg-health/5 text-health"}`}>
                {calendarMessage || urlFeedback?.text}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={settings.googleCalendarConnected ? "health" : "muted"}>
                {calendarLoading ? "Checking..." : settings.googleCalendarConnected ? "Connected" : "Not connected"}
              </Badge>
              {settings.googleCalendarCalendarName && (
                <Badge variant="muted">{settings.googleCalendarCalendarName}</Badge>
              )}
              {settings.googleCalendarEmail && (
                <span className="text-sm text-nova-muted">{settings.googleCalendarEmail}</span>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" icon={<Link2 size={16} />} onClick={handleConnectCalendar}>
                {settings.googleCalendarConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
              </Button>
              <Button
                variant="outline"
                icon={<RefreshCw size={16} />}
                onClick={handleCalendarSync}
                disabled={!settings.googleCalendarConnected || calendarSyncing}
              >
                {calendarSyncing ? "Syncing..." : "Run Calendar Sync"}
              </Button>
              <Button
                variant="ghost"
                icon={<Unplug size={16} />}
                onClick={handleDisconnectCalendar}
                disabled={!settings.googleCalendarConnected || calendarLoading}
              >
                Disconnect
              </Button>
            </div>

            <div className="text-xs text-nova-muted space-y-1">
              <p>Required env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.</p>
              <p>Recommended redirect URI: `http://localhost:3000/api/google-calendar/callback` for local dev.</p>
              {settings.googleCalendarLastSyncAt && (
                <p>Last successful sync: {new Date(settings.googleCalendarLastSyncAt).toLocaleString()}</p>
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
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${settings?.zodiacSign === sign ? "border-life bg-life/10 text-life" : "border-nova-border text-nova-muted hover:border-life/50 hover:text-nova-text"}`}
                >
                  {formatSign(sign)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Backup & Export</CardTitle></CardHeader>
          <p className="text-sm text-nova-muted mb-4">Nova stores app data locally in your browser. Export regularly to keep a backup.</p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport}>
              Export JSON Backup
            </Button>
            <Button variant="outline" icon={<Upload size={16} />} onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : "Import Backup"}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>About Nova</CardTitle></CardHeader>
          <div className="text-sm text-nova-muted space-y-1">
            <p>Nova is your personal life OS — money, health, calendar, and life admin in one app.</p>
            <p>Most data stays local in IndexedDB, with optional Google Calendar sync when you connect it.</p>
            <p className="mt-2 font-medium text-nova-text">Version 1.1.0</p>
          </div>
        </Card>

        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-nova-muted mb-4">This will permanently delete all local Nova data. Export a backup first.</p>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="border border-danger/30 text-danger hover:bg-danger/10"
          >
            {resetConfirm ? "Click again to confirm deletion" : "Reset All Data"}
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
