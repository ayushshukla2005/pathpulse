import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import pino from "pino";
import { redactSensitiveData } from "./redactor";

export const structuredLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = (req.headers["x-request-id"] as string) || "unknown";

    res.on("finish", () => {
      const latencyMs = Date.now() - startTime;
      const sanitizedHeaders = redactSensitiveData(req.headers);
      const sanitizedQuery = redactSensitiveData(req.query);

      const logPayload = {
        requestId,
        method: req.method,
        route: req.originalUrl || req.url,
        statusCode: res.statusCode,
        latencyMs,
        ip: req.ip,
        headers: sanitizedHeaders,
        query: sanitizedQuery,
      };

      if (res.statusCode >= 500) {
        structuredLogger.error(logPayload, "HTTP request completed with server error");
      } else if (res.statusCode >= 400) {
        structuredLogger.warn(logPayload, "HTTP request completed with client error");
      } else {
        structuredLogger.info(logPayload, "HTTP request completed successfully");
      }
    });

    next();
  }
}
