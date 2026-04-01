"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Modal, Button } from "@/components/ui";
import { db } from "@/lib/db";
import { generateId, todayStr, TRANSACTION_CATEGORIES } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Transaction } from "@/types";

const schema = z.object({
  date: z.string().min(1, "Date required"),
  type: z.enum(["income", "expense", "withdrawal"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "DOP"]),
  usdAmount: z.coerce.number().optional(),
  description: z.string().min(1, "Description required"),
  category: z.string().min(1, "Category required"),
  paymentMethod: z.enum(["cash", "debit", "credit", "transfer", "other"]),
  accountId: z.string(),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
});

type FormData = z.infer<typeof schema>;
export type AddTransactionDraft = Partial<FormData>;

const DEFAULT_FORM_VALUES: Partial<FormData> = {
  date: todayStr(),
  type: "expense",
  currency: "USD",
  paymentMethod: "debit",
  isRecurring: false,
  accountId: "",
};

export function AddTransactionModal({
  onClose,
  initialValues,
}: {
  onClose: () => void;
  initialValues?: AddTransactionDraft;
}) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const { settings } = useAppStore();
  const dopRate = settings?.dopRate ?? 59.5;

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    },
  });

  const currency = useWatch({ control, name: "currency" });
  const amount = useWatch({ control, name: "amount" });

  useEffect(() => {
    reset({
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    });
  }, [initialValues, reset]);

  // Auto-fill usdAmount when DOP amount changes
  useEffect(() => {
    if (currency === "DOP" && amount && amount > 0) {
      setValue("usdAmount", parseFloat((amount / dopRate).toFixed(2)));
    } else {
      setValue("usdAmount", undefined);
    }
  }, [currency, amount, dopRate, setValue]);

  async function onSubmit(data: FormData) {
    const tx: Transaction & { usdAmount?: number } = {
      id: generateId(),
      date: data.date,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      category: data.category,
      paymentMethod: data.paymentMethod,
      accountId: data.accountId,
      notes: data.notes,
      isRecurring: data.isRecurring,
      tags: [],
      createdAt: new Date().toISOString(),
      ...(data.currency === "DOP" && data.usdAmount ? { usdAmount: data.usdAmount } : {}),
    };
    await db.transactions.add(tx);
    reset({
      ...DEFAULT_FORM_VALUES,
    });
    onClose();
  }

  const inp = "w-full px-3 py-2 border border-nova-border rounded-xl bg-nova-bg text-sm text-nova-text outline-none focus:border-money focus:bg-white transition-colors";
  const lbl = "block text-xs font-semibold text-nova-muted uppercase tracking-wide mb-1";
  const err = "text-xs text-danger mt-1";

  return (
    <Modal onClose={onClose} title="Add Transaction">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Type</label>
            <select {...register("type")} className={inp}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Date</label>
            <input type="date" {...register("date")} className={inp} />
            {errors.date && <p className={err}>{errors.date.message}</p>}
          </div>
        </div>

        <div>
          <label className={lbl}>Description</label>
          <input type="text" {...register("description")} className={inp} placeholder="e.g. Trader Joe's" />
          {errors.description && <p className={err}>{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Amount</label>
            <input type="number" step="0.01" {...register("amount")} className={inp} placeholder="0.00" />
            {errors.amount && <p className={err}>{errors.amount.message}</p>}
          </div>
          <div>
            <label className={lbl}>Currency</label>
            <select {...register("currency")} className={inp}>
              <option value="USD">USD</option>
              <option value="DOP">DOP</option>
            </select>
          </div>
        </div>

        {/* DOP → USD conversion row */}
        {currency === "DOP" && (
          <div className="bg-money/5 border border-money/20 rounded-xl p-3">
            <label className={`${lbl} text-money`}>USD Equivalent <span className="normal-case font-normal text-nova-muted">(auto · 1 USD = {dopRate} DOP)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-money">$</span>
              <input
                type="number"
                step="0.01"
                {...register("usdAmount")}
                className="flex-1 px-3 py-2 border border-money/30 rounded-xl bg-white text-sm text-nova-text outline-none focus:border-money transition-colors"
                placeholder="0.00"
              />
              <span className="text-xs text-nova-muted">USD</span>
            </div>
            <p className="text-xs text-nova-muted mt-1.5">Manually edit if the rate differs</p>
          </div>
        )}

        <div>
          <label className={lbl}>Category</label>
          <select {...register("category")} className={inp}>
            <option value="">Select category…</option>
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className={err}>{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Payment Method</label>
            <select {...register("paymentMethod")} className={inp}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Account</label>
            <select {...register("accountId")} className={inp}>
              <option value="">No account</option>
              {(accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Notes (optional)</label>
          <textarea {...register("notes")} className={`${inp} resize-none h-16`} placeholder="Any extra details…" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("isRecurring")} id="isRecurring" className="accent-money" />
          <label htmlFor="isRecurring" className="text-sm text-nova-muted">Recurring transaction</label>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="flex-1 justify-center" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Transaction"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
