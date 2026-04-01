"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export function FXConverter() {
  const { settings, setDopRate } = useAppStore();
  const rate = settings?.dopRate ?? 59.5;
  const [usd, setUsd] = useState("100");
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(rate));

  const dop = (parseFloat(usd) || 0) * rate;
  const dopToUsd = (parseFloat(usd) || 0) / rate;

  function handleSaveRate() {
    const r = parseFloat(rateInput);
    if (r > 0) setDopRate(r);
    setEditingRate(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔄 FX Converter</CardTitle>
        {editingRate ? (
          <div className="flex items-center gap-2">
            <input
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-20 px-2 py-1 border border-nova-border rounded-lg text-sm outline-none focus:border-money"
            />
            <button onClick={handleSaveRate} className="text-xs text-money font-medium hover:underline">Save</button>
            <button onClick={() => setEditingRate(false)} className="text-xs text-nova-muted hover:underline">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditingRate(true)} className="text-xs text-nova-muted hover:text-nova-text">
            <Badge variant="muted">1 USD = {rate} DOP</Badge>
          </button>
        )}
      </CardHeader>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-nova-muted uppercase tracking-wide mb-1 block">USD</label>
          <input
            type="number"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            className="w-full px-3 py-2.5 border border-nova-border rounded-xl bg-nova-bg text-nova-text font-medium outline-none focus:border-money focus:bg-white transition-colors"
            placeholder="100"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-nova-muted uppercase tracking-wide mb-1 block">DOP</label>
          <div className="px-3 py-2.5 border border-money/30 rounded-xl bg-money/5 text-money font-semibold">
            RD${dop.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <p className="text-xs text-nova-muted mt-3 text-center">
        ${(parseFloat(usd) || 100).toLocaleString()} USD = RD${dop.toLocaleString()} · RD${(parseFloat(usd) || 100).toLocaleString()} = ${dopToUsd.toFixed(2)} USD
      </p>
    </Card>
  );
}
