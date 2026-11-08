import { Injectable, NotFoundException } from "@nestjs/common";
import { MobilityProfile, UserPreference, UserRole } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

export interface CurrentUserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  preferences: UserPreference | null;
  organizationMemberships?: Array<{
    organizationId: string;
    role: UserRole;
    organizationName?: string;
    organizationSlug?: string;
  }>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string): Promise<CurrentUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        organization_memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const organizationMemberships = (user.organization_memberships ?? []).map((m) => ({
      organizationId: m.organization_id,
      role: m.role,
      organizationName: m.organization?.name,
      organizationSlug: m.organization?.slug,
    }));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      preferences: user.preferences,
      organizationMemberships,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreference> {
    const updateData: {
      mobility_profile?: MobilityProfile;
      avoid_stairs?: boolean;
      prefer_voice_guidance?: boolean;
      high_contrast?: boolean;
      text_scale?: number;
    } = {};

    if (dto.mobilityProfile !== undefined) {
      updateData.mobility_profile = dto.mobilityProfile;
    }
    if (dto.avoidStairs !== undefined) {
      updateData.avoid_stairs = dto.avoidStairs;
    }
    if (dto.preferVoiceGuidance !== undefined) {
      updateData.prefer_voice_guidance = dto.preferVoiceGuidance;
    }
    if (dto.highContrast !== undefined) {
      updateData.high_contrast = dto.highContrast;
    }
    if (dto.textScale !== undefined) {
      updateData.text_scale = dto.textScale;
    }

    return this.prisma.userPreference.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        mobility_profile: dto.mobilityProfile ?? MobilityProfile.CUSTOM,
        avoid_stairs: dto.avoidStairs ?? false,
        prefer_voice_guidance: dto.preferVoiceGuidance ?? false,
        high_contrast: dto.highContrast ?? false,
        text_scale: dto.textScale ?? 1.0,
      },
      update: updateData,
    });
  }
}
