import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly defaultExpirySeconds: number;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject("S3_CLIENT") customClient?: S3Client,
  ) {
    this.bucket = this.configService.get<string>("s3Bucket") || "pathpulse-evidence";
    this.defaultExpirySeconds = this.configService.get<number>("s3PresignedExpirySeconds") || 900;

    if (customClient) {
      this.s3Client = customClient;
    } else {
      const endpoint = this.configService.get<string>("s3Endpoint") || "http://localhost:9000";
      const region = this.configService.get<string>("s3Region") || "us-east-1";
      const accessKeyId = this.configService.get<string>("s3AccessKeyId") || "pathpulse_admin";
      const secretAccessKey =
        this.configService.get<string>("s3SecretAccessKey") || "pathpulse_secret_key";
      const forcePathStyle = this.configService.get<boolean>("s3ForcePathStyle") ?? true;

      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle,
      });
    }
  }

  async getPresignedPutUrl(
    objectKey: string,
    contentType: string,
    sizeBytes: number,
    expiresInSeconds?: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: sizeBytes,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds ?? this.defaultExpirySeconds,
    });
  }

  async getPresignedGetUrl(objectKey: string, expiresInSeconds?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds ?? this.defaultExpirySeconds,
    });
  }

  async headObject(
    objectKey: string,
  ): Promise<{ contentLength: number; contentType: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });
      const response = await this.s3Client.send(command);
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? "",
      };
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });
      await this.s3Client.send(command);
    } catch {
      return;
    }
  }
}
