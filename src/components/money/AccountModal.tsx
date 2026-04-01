"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { Account, AccountType, Currency } from "@/types";

const ACCOUNT_TYPES: { value: AccountType; label: string; emoji: string; balanceLabel: string }[] = [
  { value: "checking",       label: "Checking",        emoji: "🏦", balanceLabel: "Current Balance" },
  { value: "savings",        label: "Savings",         emoji: "🐖", balanceLabel: "Current Balance" },
  { value: "cash",           label: "Cash",            emoji: "💵", balanceLabel: "Amount on Hand" },
  { value: "credit",         label: "Credit Card",     emoji: "💳", balanceLabel: "Current Balance (negative = owed)" },
  { value: "line_of_credit", label: "Line of Credit",  emoji: "🔄", balanceLabel: "Current Balance (negative = owed)" },
  { value: "loan",           label: "Loan",            emoji: "📄", balanceLabel: "Remaining Balance (negative)" },
  { value: "mortgage",       label: "Mortgage",        emoji: "🏠", balanceLabel: "Remaining Balance (negative)" },
  { value: "investment",     label: "Investment",      emoji: "📈", balanceLabel: "Current Value" },
  { value: "ira",            label: "IRA",             emoji: "🛡️", balanceLabel: "Current Value" },
  { value: "retirement",     label: "Retirement / 401k", emoji: "🌅", balanceLabel: "Current Value" },
  { value: "hsa",            label: "HSA",             emoji: "❤️‍🩹", balanceLabel: "Current Balance" },
];

const PRESET_COLORS = [
  "#4F7CFF", "#5BB88A", "#F5A623", "#F25F5C",
  "#A78BFA", "#34D399", "#F87171", "#60A5FA",
  "#FBBF24", "#E879F9", "#2DD4BF", "#FB923C",
];

export function AccountModal({
  account,
  onClose,
}: {
  account?: Account | null;
  onClose: () => void;
}) {
  const isEdit = !!account;

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [balance, setBalance] = useState(account?.balance !== undefined ? String(account.balance) : "");
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? "USD");
  const [color, setColor] = useState(account?.color ?? PRESET_COLORS[0]);
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedType = ACCOUNT_TYPES.find(t => t.value === type)!;
  const isDebt = ["credit", "line_of_credit", "loan", "mortgage"].includes(type);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const parsedBalance = parseFloat(balance) || 0;
    if (isEdit && account) {
      await db.accounts.update(account.id, {
        name: name.trim(),
        type,
        balance: parsedBalance,
        currency,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      await db.accounts.add({
        id: generateId("acc"),
        name: name.trim(),
        type,
        balance: parsedBalance,
        currency,
        color,
        notes: notes.trim() || undefined,
        createdAt: now,
      });
    }
    setSaving(false);
    onClose();
  };

  const deleteAccount = async () => {
    if (!account) return;
    await db.accounts.delete(account.id);
    onClose();
  };

  const inp = "w-full px-3 py-2.5 border border-nova-border rounded-xl bg-nova-bg text-sm text-nova-text outline-none focus:border-money focus:bg-white transition-colors";
  const lbl = "block text-xs font-semibold text-nova-muted uppercase tracking-wide mb-1";

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit Account" : "Add Account"}>
      <div className="space-y-4">
        {/* Type */}
        <div>
          <label className={lbl}>Account Type</label>
          <select value={type} onChange={e => setType(e.target.value as AccountType)} className={inp}>
            {ACCOUNT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className={lbl}>Account Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`e.g. ${selectedType.emoji} Chase ${selectedType.label}`}
            className={inp}
            autoFocus={!isEdit}
          />
        </div>

        {/* Balance + Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>{selectedType.balanceLabel}</label>
            {isDebt && (
              <p className="text-xs text-nova-muted mb-1">Enter negative for amounts owed</p>
            )}
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder={isDebt ? "-1,240.00" : "0.00"}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={inp}>
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
            </select>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className={lbl}>Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: c,
                  outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                  opacity: color === c ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={lbl}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Joint account, last 4 digits, etc."
            rows={2}
            className={`${inp} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            className="flex-1 justify-center"
            onClick={save}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Account"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>

        {/* Delete */}
        {isEdit && (
          <div className="pt-1 border-t border-nova-border">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-danger flex-1">Delete this account?</p>
                <Button variant="danger" onClick={deleteAccount}>Yes, Delete</Button>
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-nova-muted hover:text-danger transition-colors"
              >
                Delete account
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; emoji: string }> = Object.fromEntries(
  ACCOUNT_TYPES.map(t => [t.value, { label: t.label, emoji: t.emoji }])
) as Record<AccountType, { label: string; emoji: string }>;
