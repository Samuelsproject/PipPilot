import { afterEach, describe, expect, it } from "vitest";
import { AUTH_PAGE_TITLES, resolveRouteFromLocation, WORKSPACE_ROUTES } from "./App";

const expectedRoutes = [
  "/app",
  "/app/trading",
  "/app/strategies",
  "/app/news",
  "/app/risk",
  "/app/mt5",
  "/app/signals",
  "/app/backtesting",
  "/app/settings",
  "/app/support",
  "/app/admin",
] as const;

describe("workspace route handling", () => {
  afterEach(() => window.history.replaceState({}, "", "/"));

  it("preserves the original ten routes and registers /app/admin separately", () => {
    expect(WORKSPACE_ROUTES).toEqual(expectedRoutes);
  });

  it("sets branded browser titles for every authentication route", () => {
    expect(AUTH_PAGE_TITLES).toEqual({
      "/login": "Sign in to PipPilotAi",
      "/register": "Create your PipPilotAi account",
      "/verify-email": "Verify your PipPilotAi account",
      "/forgot-password": "Reset your PipPilotAi password",
      "/reset-password": "Reset your PipPilotAi password",
    });
  });

  it.each(expectedRoutes)("resolves %s to its existing route", (route) => {
    window.history.replaceState({}, "", route);
    expect(resolveRouteFromLocation()).toBe(route);
  });

  it("recognizes Supabase recovery callbacks in query strings and fragments", () => {
    window.history.replaceState({}, "", "/?type=recovery&code=one-time-code");
    expect(resolveRouteFromLocation()).toBe("/reset-password");

    window.history.replaceState({}, "", "/#access_token=placeholder&type=recovery");
    expect(resolveRouteFromLocation()).toBe("/reset-password");
  });

  it("recognizes Supabase email-confirmation callbacks without replacing workspace routes", () => {
    window.history.replaceState({}, "", "/?type=signup&code=one-time-code");
    expect(resolveRouteFromLocation()).toBe("/verify-email");

    window.history.replaceState({}, "", "/app/trading");
    expect(resolveRouteFromLocation()).toBe("/app/trading");
  });
});
