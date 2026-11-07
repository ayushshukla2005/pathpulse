import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  let service: RedisService;
  let mockConfigService: { get: jest.Mock };

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue("redis://localhost:6379"),
    };
    service = new RedisService(mockConfigService as unknown as ConfigService);
  });

  it("should return null and false gracefully when redis client is not connected", async () => {
    const getResult = await service.get("test-key");
    expect(getResult).toBeNull();

    const setResult = await service.set("test-key", { value: 123 }, 60);
    expect(setResult).toBe(false);

    const delResult = await service.del("test-key");
    expect(delResult).toBe(false);

    const patternResult = await service.deleteByPattern("test:*");
    expect(patternResult).toBe(0);

    const healthy = await service.isHealthy();
    expect(healthy).toBe(false);
  });
});
