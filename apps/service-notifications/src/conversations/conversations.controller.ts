import { Controller, Get, Param } from "@nestjs/common";
import { successResponse } from "../common/utils/api.utils";
import {
  ReqContext,
  type RequestContext
} from "../common/decorators/request-context.decorator";
import { ConversationsService } from "./conversations.service";

@Controller("v1/conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get(":debtor_id")
  async getByDebtor(
    @ReqContext() ctx: RequestContext,
    @Param("debtor_id") debtorId: string
  ) {
    return successResponse(
      await this.conversationsService.getByDebtor(ctx.tenantId, debtorId)
    );
  }
}
