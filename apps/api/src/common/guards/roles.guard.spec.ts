import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function createMockContext(user?: { id: string; role: UserRole }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow access when no roles are required (default-deny handles auth only)", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: "user-1", role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should bypass any role check for SUPER_ADMIN", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ORGANIZATION_ADMIN]);
    const context = createMockContext({
      id: "admin-1",
      role: UserRole.SUPER_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user role matches required role", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MODERATOR]);
    const context = createMockContext({
      id: "mod-1",
      role: UserRole.MODERATOR,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException when user lacks the required role", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MODERATOR]);
    const context = createMockContext({ id: "user-1", role: UserRole.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
