import { Module } from "@nestjs/common";
import { EmailAdapter } from "./email.adapter";
import { SmsAdapter } from "./sms.adapter";
import { VoiceAdapter } from "./voice.adapter";
import { WhatsAppAdapter } from "./whatsapp.adapter";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [KafkaModule],
  providers: [EmailAdapter, SmsAdapter, WhatsAppAdapter, VoiceAdapter],
  exports: [EmailAdapter, SmsAdapter, WhatsAppAdapter, VoiceAdapter]
})
export class AdaptersModule {}
