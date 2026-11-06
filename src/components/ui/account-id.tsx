"use client";
import { useTranslator } from "../../i18n/runtime";
import { Copy } from "lucide-react";
import { toast } from "sonner";
export const accountId = (id: string) =>
  /^\d+$/.test(id) ? `VX-${id.padStart(6, "0")}` : id;
export function AccountId({ id }: { id: string }) {
  const __t = useTranslator();
  const value = accountId(id);
  return (
    <button
      type="button"
      className="account-id"
      title={__t("Akkaunt ID nusxalash")}
      onClick={() =>
        navigator.clipboard
          .writeText(value)
          .then(() => toast.success(__t("ID nusxalandi.")))
          .catch(() => toast.error(__t("ID: ") + value))
      }
    >
      {value}
      <Copy size={12} />
    </button>
  );
}
