import {
  handleOtpError,
  shouldClearOtpInput,
  canRetryOperation,
} from "../otpErrorHandler";

describe("OTP Error Handler", () => {
  describe("handleOtpError", () => {
    it("should handle network errors correctly", () => {
      const networkError = { response: null };
      const result = handleOtpError(networkError, { showToast: false });

      expect(result.type).toBe("network");
      expect(result.canRetry).toBe(true);
      expect(result.shouldClearInput).toBe(false);
      expect(result.message).toContain("conexión");
    });

    it("should handle validation errors correctly", () => {
      const validationError = {
        response: {
          status: 422,
          data: { error: "Código inválido" },
        },
      };
      const result = handleOtpError(validationError, { showToast: false });

      expect(result.type).toBe("validation");
      expect(result.canRetry).toBe(true);
      expect(result.shouldClearInput).toBe(true);
      expect(result.message).toBe("Código inválido");
    });

    it("should handle server errors correctly", () => {
      const serverError = { response: { status: 500 } };
      const result = handleOtpError(serverError, { showToast: false });

      expect(result.type).toBe("server");
      expect(result.canRetry).toBe(true);
      expect(result.shouldClearInput).toBe(false);
    });

    it("should handle rate limiting correctly", () => {
      const rateLimitError = { response: { status: 429 } };
      const result = handleOtpError(rateLimitError, { showToast: false });

      expect(result.type).toBe("rate_limit");
      expect(result.canRetry).toBe(false);
      expect(result.shouldClearInput).toBe(false);
    });
  });

  describe("shouldClearOtpInput", () => {
    it("should return true for validation errors", () => {
      const error = { response: { status: 422 } };
      expect(shouldClearOtpInput(error)).toBe(true);
    });

    it("should return false for network errors", () => {
      const error = { response: null };
      expect(shouldClearOtpInput(error)).toBe(false);
    });

    it("should return false for server errors", () => {
      const error = { response: { status: 500 } };
      expect(shouldClearOtpInput(error)).toBe(false);
    });
  });

  describe("canRetryOperation", () => {
    it("should allow retry for network errors", () => {
      const error = { response: null };
      expect(canRetryOperation(error)).toBe(true);
    });

    it("should allow retry for server errors", () => {
      const error = { response: { status: 500 } };
      expect(canRetryOperation(error)).toBe(true);
    });

    it("should not allow retry for rate limiting", () => {
      const error = { response: { status: 429 } };
      expect(canRetryOperation(error)).toBe(false);
    });

    it("should not allow retry for auth errors during verify", () => {
      const error = { response: { status: 401 } };
      expect(canRetryOperation(error, "verify")).toBe(false);
    });
  });
});
