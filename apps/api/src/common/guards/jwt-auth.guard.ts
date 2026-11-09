import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import { AuthenticatedUser } from "../decorators/current-user.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const authHeader = request.headers.authorization;

    if (isPublic) {
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        try {
          const secret = this.configService.get<string>("jwtAccessSecret");
          const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
            secret,
          });
          request.user = {
            id: payload.sub,
            role: payload.role,
          };
        } catch {
          request.user = undefined;
        }
      }
      return true;
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication required");
    }

    const token = authHeader.substring(7).trim();

    try {
      const secret = this.configService.get<string>("jwtAccessSecret");
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret,
      });

      request.user = {
        id: payload.sub,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
