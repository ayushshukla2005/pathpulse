import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { OrganizationOwnershipGuard } from "./organization-ownership.guard";

interface MockPrisma {
  venue: {
    findUnique: jest.Mock;
  };
  building: {
    findUnique: jest.Mock;
  };
  mapEdge: {
    findUnique: jest.Mock;
  };
  organizationMember: {
    findUnique: jest.Mock;
  };
}

describe("OrganizationOwnershipGuard", () => {
  let guard: OrganizationOwnershipGuard;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = {
      venue: {
        findUnique: jest.fn(),
      },
      building: {
        findUnique: jest.fn(),
      },
      mapEdge: {
        findUnique: jest.fn(),
      },
      organizationMember: {
        findUnique: jest.fn(),
      },
    };

    guard = new OrganizationOwnershipGuard(mockPrisma as unknown as PrismaService);
  });

  function createMockContext(
    user?: { id: string; role: UserRole },
    params: Record<string, string> = {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow a SUPER_ADMIN regardless of membership", async () => {
    const context = createMockContext(
      { id: "super-1", role: UserRole.SUPER_ADMIN },
      { orgId: "org-1" },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.organizationMember.findUnique).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException if user is not authenticated", async () => {
    const context = createMockContext(undefined, { orgId: "org-1" });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("should allow a verified organization member via orgId", async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: "mem-1",
      organization_id: "org-1",
      user_id: "user-1",
      role: UserRole.ORGANIZATION_ADMIN,
    });

    const context = createMockContext(
      { id: "user-1", role: UserRole.ORGANIZATION_ADMIN },
      { orgId: "org-1" },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledWith({
      where: {
        organization_id_user_id: {
          organization_id: "org-1",
          user_id: "user-1",
        },
      },
    });
  });

  it("should throw ForbiddenException if user is not a member of the organization", async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const context = createMockContext(
      { id: "user-1", role: UserRole.ORGANIZATION_ADMIN },
      { orgId: "org-1" },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("should resolve organization from venueId and allow member", async () => {
    mockPrisma.venue.findUnique.mockResolvedValue({
      organization_id: "org-resolved-from-venue",
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: "mem-1",
      organization_id: "org-resolved-from-venue",
      user_id: "user-1",
    });

    const context = createMockContext(
      { id: "user-1", role: UserRole.ORGANIZATION_ADMIN },
      { venueId: "venue-1" },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should resolve organization from buildingId and allow member", async () => {
    mockPrisma.building.findUnique.mockResolvedValue({
      venue: { organization_id: "org-resolved-from-building" },
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: "mem-1",
      organization_id: "org-resolved-from-building",
      user_id: "user-1",
    });

    const context = createMockContext(
      { id: "user-1", role: UserRole.ORGANIZATION_ADMIN },
      { buildingId: "building-1" },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should resolve organization from edgeId and allow member", async () => {
    mockPrisma.mapEdge.findUnique.mockResolvedValue({
      building: { venue: { organization_id: "org-resolved-from-edge" } },
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: "mem-1",
      organization_id: "org-resolved-from-edge",
      user_id: "user-1",
    });

    const context = createMockContext(
      { id: "user-1", role: UserRole.ORGANIZATION_ADMIN },
      { edgeId: "edge-1" },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException if target organization cannot be determined", async () => {
    const context = createMockContext({ id: "user-1", role: UserRole.ORGANIZATION_ADMIN }, {});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
