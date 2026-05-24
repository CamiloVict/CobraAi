import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
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
  metadata?: Record<string, unknown>;
}

export class UpdateDebtDto {
  @IsOptional()
  @IsIn([
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
