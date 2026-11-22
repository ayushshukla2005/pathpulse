import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { ApiKey } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export interface GeneratedApiKey {
  apiKey: ApiKey;
  secretKey: string;
}

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  static hashKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
  }

  async createApiKey(
    organizationId: string,
    scopes: string[] = ["FACILITY_STATUS_WRITE"],
  ): Promise<GeneratedApiKey> {
    const prefix = `pp_op_${crypto.randomBytes(4).toString("hex")}`;
    const secret = crypto.randomBytes(24).toString("base64url");
    const secretKey = `${prefix}.${secret}`;
    const keyHash = ApiKeyService.hashKey(secretKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        organizationId,
        keyPrefix: prefix,
        keyHash,
        scopes,
      },
    });

    return {
      apiKey,
      secretKey,
    };
  }

  async findByRawKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = ApiKeyService.hashKey(rawKey);
    return this.prisma.apiKey.findUnique({
      where: { keyHash },
    });
  }

  async recordKeyUsage(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async revokeApiKey(id: string): Promise<ApiKey> {
    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
