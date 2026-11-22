import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiKey } from "@prisma/client";
import { Request } from "express";
import { ApiKeyService } from "../api-key.service";

export interface RequestWithApiKey extends Request {
  apiKey?: ApiKey;
}

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("API key required in Authorization header");
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException("API key required in Authorization header");
    }

    const apiKey = await this.apiKeyService.findByRawKey(token);
    if (!apiKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    if (apiKey.revokedAt !== null) {
      throw new UnauthorizedException("API key has been revoked");
    }

    if (!apiKey.scopes.includes("FACILITY_STATUS_WRITE")) {
      throw new ForbiddenException("API key lacks FACILITY_STATUS_WRITE scope");
    }

    await this.apiKeyService.recordKeyUsage(apiKey.id);
    request.apiKey = apiKey;

    return true;
  }
}
