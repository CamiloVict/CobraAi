import { ContactChannel } from "@cobrai/db";
import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";

export class CreateContactDto {
  @IsUUID()
  debt_id!: string;

  @IsEnum(ContactChannel)
  channel!: ContactChannel;

  @IsOptional()
  @IsUUID()
  template_id?: string;

  @IsOptional()
  @IsISO8601()
  scheduled_at?: string;
}
