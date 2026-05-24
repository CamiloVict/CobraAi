import { Injectable } from "@nestjs/common";
import type { ContactChannel } from "@cobrai/db";

export type WaterfallStep = {
  channel: ContactChannel;
  waitHours: number;
};

export const DEFAULT_WATERFALL: WaterfallStep[] = [
  { channel: "whatsapp", waitHours: 4 },
  { channel: "voice", waitHours: 24 },
  { channel: "email", waitHours: 48 },
  { channel: "sms", waitHours: 72 }
];

@Injectable()
export class WaterfallService {
  getSteps(): WaterfallStep[] {
    return DEFAULT_WATERFALL;
  }

  nextChannel(
    current: ContactChannel | null,
    available: ContactChannel[]
  ): ContactChannel | null {
    const steps = this.getSteps().filter((s) => available.includes(s.channel));
    if (!current) {
      return steps[0]?.channel ?? null;
    }
    const index = steps.findIndex((s) => s.channel === current);
    return steps[index + 1]?.channel ?? null;
  }

  waitHoursFor(channel: ContactChannel): number {
    return (
      this.getSteps().find((s) => s.channel === channel)?.waitHours ?? 24
    );
  }
}
