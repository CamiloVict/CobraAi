import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { successResponse } from "../common/utils/api.utils";
import {
  ReqContext,
  type RequestContext
} from "../common/decorators/request-context.decorator";
import { ImportService } from "./import.service";

@Controller("v1/portfolios/:portfolioId/import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async importFile(
    @ReqContext() ctx: RequestContext,
    @Param("portfolioId") portfolioId: string,
    @UploadedFile() file?: { buffer: Buffer; originalname: string }
  ) {
    if (!file) {
      throw new BadRequestException("Archivo requerido en campo 'file'");
    }
    const job = await this.importService.enqueueImport({
      tenantId: ctx.tenantId,
      portfolioId,
      buffer: file.buffer,
      filename: file.originalname
    });
    return successResponse({
      job_id: job.job_id,
      status: job.status,
      estimated_rows: job.estimated_rows
    });
  }

  @Get("active")
  async getActive(@Param("portfolioId") portfolioId: string) {
    const job = await this.importService.getActiveJobForPortfolio(portfolioId);
    if (!job) {
      throw new NotFoundException("Sin importación activa para este portafolio");
    }
    return successResponse(job);
  }

  @Get(":jobId")
  async getProgress(
    @Param("portfolioId") portfolioId: string,
    @Param("jobId") jobId: string
  ) {
    const job = await this.importService.resolveJob(portfolioId, jobId);
    if (!job || job.portfolio_id !== portfolioId) {
      throw new NotFoundException("Job de importación no encontrado");
    }
    return successResponse(job);
  }
}
