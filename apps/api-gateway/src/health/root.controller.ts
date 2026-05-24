import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Public } from "../common/decorators/public.decorator";

@Controller()
export class RootController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  index(): {
    service: string;
    message: string;
    web: string;
    health: string;
    api: string;
  } {
    const web = this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3001";

    return {
      service: "cobrai-api-gateway",
      message: "Este es el API Gateway. La app web corre en otro puerto.",
      web,
      health: "/health",
      api: "/api/v1"
    };
  }
}
