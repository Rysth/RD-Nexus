import { navigateAfterAuth } from "../navigation";
import type { User } from "../../types/auth";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

describe("Navigation Functions", () => {
  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    username: "testuser",
    fullName: "Test User",
    roles: ["admin"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navigateAfterAuth", () => {
    it("should navigate to home for admin users", () => {
      const { router } = require("expo-router");

      navigateAfterAuth(mockUser);

      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("should navigate to home for manager users", () => {
      const { router } = require("expo-router");
      const managerUser = { ...mockUser, roles: ["manager"] };

      navigateAfterAuth(managerUser);

      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("should navigate to home for operator users", () => {
      const { router } = require("expo-router");
      const operatorUser = { ...mockUser, roles: ["operator"] };

      navigateAfterAuth(operatorUser);

      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("should navigate to home for regular users", () => {
      const { router } = require("expo-router");
      const regularUser = { ...mockUser, roles: ["user"] };

      navigateAfterAuth(regularUser);

      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("should handle navigation errors gracefully", () => {
      const { router } = require("expo-router");
      router.replace.mockImplementation(() => {
        throw new Error("Navigation error");
      });

      // Should not throw
      expect(() => navigateAfterAuth(mockUser)).not.toThrow();

      // Should fallback to home
      expect(router.replace).toHaveBeenCalledWith("/");
    });
  });
});
