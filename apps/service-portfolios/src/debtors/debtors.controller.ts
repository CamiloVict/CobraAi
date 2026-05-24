import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { successResponse } from "../common/utils/api.utils";
import {
  ReqContext,
  type RequestContext
} from "../common/decorators/request-context.decorator";
import { UpdateDebtorDto } from "../debts/dto/debt.dto";
import { DebtorsService } from "./debtors.service";

@Controller("v1/debtors")
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Get(":id")
  async findOne(@ReqContext() ctx: RequestContext, @Param("id") id: string) {
    return successResponse(await this.debtorsService.findOne(ctx.tenantId, id));
  }

  @Patch(":id")
  async update(
    @ReqContext() ctx: RequestContext,
    @Param("id") id: string,
    @Body() dto: UpdateDebtorDto
  ) {
    return successResponse(
      await this.debtorsService.update(ctx.tenantId, id, dto)
    );
  }
}
