"use client";

import { useFormState, useFormStatus } from "react-dom";
import { recordSaleAction } from "./actions";

const initial = { error: undefined, message: undefined } as {
  error?: string;
  message?: string;
};

export function SaleForm({ clientId }: { clientId: string }) {
  const [state, action] = useFormState(recordSaleAction.bind(null, clientId), initial);
  return (
    <form action={action} className="space-y-3">
      <p className="eyebrow">Record sale</p>
      <input
        name="product"
        required
        className="input"
        placeholder="Product (e.g. Submariner 126610LN)"
      />
      <div className="grid grid-cols-2 gap-3">
        <input name="reference" className="input" placeholder="Reference" />
        <input
          name="amount"
          required
          type="number"
          step="0.01"
          className="input"
          placeholder="Amount"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="currency"
          className="input"
          placeholder="USD"
          defaultValue="USD"
          maxLength={3}
        />
        <input name="purchaseDate" required type="date" className="input" />
      </div>
      {state?.error ? (
        <p className="text-[12px] text-danger">{state.error}</p>
      ) : null}
      {state?.message ? (
        <p className="text-[12px] text-success">{state.message}</p>
      ) : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" type="submit" disabled={pending}>
      {pending ? "Recording…" : "Record sale"}
    </button>
  );
}
