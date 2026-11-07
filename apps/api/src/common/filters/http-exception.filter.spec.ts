import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { GlobalExceptionFilter } from "./http-exception.filter";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it("should format an HttpException into the consistent error shape", () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({
          url: "/api/v1/test",
          headers: { "x-request-id": "test-uuid-1234" },
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException("Resource not found", HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: "Http Exception",
        message: "Resource not found",
        path: "/api/v1/test",
        requestId: "test-uuid-1234",
      }),
    );
  });

  it("should handle unexpected internal errors without leaking details", () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({
          url: "/api/v1/crash",
          headers: {},
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new Error("Database connection password=leaked");

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: "Internal Server Error",
        message: "An unexpected internal error occurred",
        path: "/api/v1/crash",
        requestId: "unknown",
      }),
    );
  });
});
