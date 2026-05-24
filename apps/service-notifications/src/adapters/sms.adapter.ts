import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import type { SMSPort, SendSMSInput, SendSMSResult } from "@cobrai/ports";
import { truncateSms } from "../common/utils/api.utils";

@Injectable()
export class SmsAdapter implements SMSPort {
  private readonly logger = new Logger(SmsAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async sendSMS(input: SendSMSInput): Promise<SendSMSResult> {
    const accountSid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN");
    const from = this.config.get<string>("TWILIO_FROM_NUMBER");
    const body = truncateSms(input.body);

    if (!accountSid || !authToken || !from) {
      this.logger.warn(`Twilio sandbox: SMS simulado a ${input.to}`);
      return { message_id: randomUUID(), status: "sent" };
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({
      To: input.to,
      From: from,
      Body: body
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`Twilio error ${response.status}: ${detail}`);
      return { message_id: randomUUID(), status: "failed" };
    }

    const data = (await response.json()) as { sid?: string };
    return { message_id: data.sid ?? randomUUID(), status: "sent" };
  }
}
