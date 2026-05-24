import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { successResponse } from "../common/utils/api.utils";
import {
  ReqContext,
  type RequestContext
} from "../common/decorators/request-context.decorator";
import {
  BulkCreateDebtsDto,
  CreateDebtDto,
  UpdateDebtDto
} from "./dto/debt.dto";
import { DebtsService } from "./debts.service";

@Controller("v1/debts")
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  async list(
    @ReqContext() ctx: RequestContext,
    @Query() query: Record<string, unknown>
  ) {
    const result = await this.debtsService.list(ctx.tenantId, query);
    return successResponse({
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit)
      }
    });
  }

  @Post()
  async create(@ReqContext() ctx: RequestContext, @Body() dto: CreateDebtDto) {
    return successResponse(await this.debtsService.create(ctx.tenantId, dto));
  }

  @Post("bulk")
  async bulk(
    @ReqContext() ctx: RequestContext,
    @Body() dto: BulkCreateDebtsDto
  ) {
    return successResponse(
      await this.debtsService.bulkCreate(ctx.tenantId, dto)
    );
  }

  @Get(":id")
  async findOne(@ReqContext() ctx: RequestContext, @Param("id") id: string) {
    const debt = await this.debtsService.findOne(ctx.tenantId, id);
    const timeline = await this.debtsService.timeline(ctx.tenantId, id);
    return successResponse({ ...debt, timeline_preview: timeline.slice(0, 5) });
  }

  @Get(":id/timeline")
  async timeline(
    @ReqContext() ctx: RequestContext,
    @Param("id") id: string
  ) {
    return successResponse(
      await this.debtsService.timeline(ctx.tenantId, id)
    );
  }

  @Patch(":id")
  async update(
    @ReqContext() ctx: RequestContext,
    @Param("id") id: string,
    @Body() dto: UpdateDebtDto
  ) {
    return successResponse(
      await this.debtsService.update(ctx.tenantId, id, dto)
    );
  }

  @Post(":id/resegment")
  async resegment(
    @ReqContext() ctx: RequestContext,
    @Param("id") id: string
  ) {
    return successResponse(
      await this.debtsService.resegment(ctx.tenantId, id)
    );
  }
}
