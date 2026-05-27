export type SuggestedChannel = "whatsapp" | "voice" | "email";

export type DebtorContactSnapshot = {
  email?: string | null;
  phones?: string[];
  whatsappOptIn?: boolean;
};

export function isChannelAvailableForDebtor(
  channel: string | null | undefined,
  debtor: DebtorContactSnapshot
): boolean {
  if (!channel) return false;
  const phones = (debtor.phones ?? []).filter(Boolean);
  const hasEmail = Boolean(debtor.email?.trim());
  switch (channel as SuggestedChannel) {
    case "whatsapp":
      return Boolean(debtor.whatsappOptIn) && phones.length > 0;
    case "voice":
      return phones.length > 0;
    case "email":
      return hasEmail;
    default:
      return false;
  }
}

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "Sin canal disponible";
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    voice: "Voz",
    email: "Email"
  };
  return labels[channel] ?? channel;
}
