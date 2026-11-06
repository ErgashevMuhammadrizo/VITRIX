"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";
export const accountId = (id: string) =>
  /^\d+$/.test(id) ? `VX-${id.padStart(6, "0")}` : id;
export function AccountId({ id }: { id: string }) {
  const value = accountId(id);
  return (
    <button
      type="button"
      className="account-id"
      title="Akkaunt ID nusxalash"
      onClick={() =>
        navigator.clipboard
          .writeText(value)
          .then(() => toast.success("ID nusxalandi."))
          .catch(() => toast.error("ID: " + value))
      }
    >
      {value}
      <Copy size={12} />
    </button>
  );
}
