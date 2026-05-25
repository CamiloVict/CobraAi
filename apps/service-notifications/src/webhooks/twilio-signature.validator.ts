import twilio from "twilio";

/**
 * Verifica la firma X-Twilio-Signature de un webhook entrante.
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function validateTwilioSignature(
  authToken: string,
  webhookUrl: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken || !webhookUrl || !signature) return false;
  return twilio.validateRequest(authToken, signature, webhookUrl, params);
}
