import { IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class CreatePaymentLinkDto {
  @IsUUID()
  debt_id!: string;

  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  expires_in_hours?: number;
}

export class RefundPaymentDto {
  @IsOptional()
  @Min(0.01)
  amount?: number;
}
