import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const apiKey = req.apiKey as { id?: string } | undefined;
    if (apiKey?.id) {
      return `apikey:${apiKey.id}`;
    }
    const user = req.user as { id?: string } | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    const ips = req.ips as string[] | undefined;
    if (ips && ips.length > 0) {
      return ips[0]!;
    }
    return (req.ip as string) || "127.0.0.1";
  }
}
