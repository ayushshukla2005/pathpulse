import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../decorators/current-user.decorator";

export interface OwnableResource {
  userId: string;
}

@Injectable()
export abstract class BaseOwnershipGuard implements CanActivate {
  abstract getResource(
    context: ExecutionContext,
  ): Promise<OwnableResource | null> | OwnableResource | null;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication required for ownership check");
    }

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZATION_ADMIN) {
      return true;
    }

    const resource = await this.getResource(context);
    if (!resource) {
      throw new ForbiddenException("Resource not found or inaccessible");
    }

    if (resource.userId !== user.id) {
      throw new ForbiddenException("You do not own this resource");
    }

    return true;
  }
}
