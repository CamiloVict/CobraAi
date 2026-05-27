import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

export class CreateDebtorInlineDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  external_ref?: string;

  @IsOptional()
  @IsIn(["person", "company"])
  debtor_type?: "person" | "company";

  @IsOptional()
  @IsString()
  debtor_tax_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @IsOptional()
  @IsEmail()
  debtor_email?: string;

  @IsOptional()
  whatsapp_opt_in?: boolean;
}

export class CreateDebtDto {
  @IsString()
  portfolio_id!: string;

  @ValidateNested()
  @Type(() => CreateDebtorInlineDto)
  debtor!: CreateDebtorInlineDto;

  @IsOptional()
  @IsString()
  external_ref?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsDateString()
  due_date!: string;

  @IsOptional()
  @IsDateString()
  scheduled_collection_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  payment_terms_days?: number;

  @IsOptional()
  @IsDateString()
  invoice_date?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateDebtDto {
  @IsOptional()
  @IsIn([
    "future",
    "upcoming",
    "new",
    "analyzing",
    "active",
    "contacted",
    "promised",
    "plan",
    "disputed",
    "legal_risk",
    "legal",
    "paid_partial",
    "paid_full",
    "written_off"
  ])
  status?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount_outstanding?: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class BulkDebtItemDto {
  @ValidateNested()
  @Type(() => CreateDebtDto)
  debt!: CreateDebtDto;
}

export class BulkCreateDebtsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateDebtDto)
  items!: CreateDebtDto[];
}

export class UpdateDebtorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== "")
  @IsEmail()
  email?: string;

  @IsOptional()
  whatsapp_opt_in?: boolean;

  @IsOptional()
  @MaxLength(500)
  address_city?: string;

  @IsOptional()
  @MaxLength(3)
  address_country?: string;
}
