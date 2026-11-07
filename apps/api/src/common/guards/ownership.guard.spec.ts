import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { BaseOwnershipGuard } from "./ownership.guard";

class SampleResourceGuard extends BaseOwnershipGuard {
  constructor(private readonly ownerId: string) {
    super();
  }

  getResource() {
    return { userId: this.ownerId };
  }
}

describe("OwnershipGuard Pattern", () => {
  function createMockContext(user?: { id: string; role: UserRole }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow the resource owner", async () => {
    const guard = new SampleResourceGuard("user-owner-1");
    const context = createMockContext({
      id: "user-owner-1",
      role: UserRole.USER,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should deny a non-owner user", async () => {
    const guard = new SampleResourceGuard("user-owner-1");
    const context = createMockContext({
      id: "other-user-2",
      role: UserRole.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("should allow a SUPER_ADMIN even if not the owner", async () => {
    const guard = new SampleResourceGuard("user-owner-1");
    const context = createMockContext({
      id: "admin-user",
      role: UserRole.SUPER_ADMIN,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should allow an ORGANIZATION_ADMIN even if not the owner", async () => {
    const guard = new SampleResourceGuard("user-owner-1");
    const context = createMockContext({
      id: "org-admin-user",
      role: UserRole.ORGANIZATION_ADMIN,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
