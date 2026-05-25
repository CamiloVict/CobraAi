import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmailAdapter } from "./email.adapter";
import { SmsAdapter } from "./sms.adapter";
import { TwilioWhatsAppAdapter } from "./twilio-whatsapp.adapter";
import { VapiVoiceAdapter } from "./vapi-voice.adapter";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [KafkaModule, ConfigModule],
  providers: [EmailAdapter, SmsAdapter, TwilioWhatsAppAdapter, VapiVoiceAdapter],
  exports: [EmailAdapter, SmsAdapter, TwilioWhatsAppAdapter, VapiVoiceAdapter]
})
export class AdaptersModule {}
