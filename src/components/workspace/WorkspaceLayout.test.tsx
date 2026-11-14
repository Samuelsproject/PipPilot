import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ADMIN_NAV_ITEM, WORKSPACE_NAV_ITEMS, WorkspaceLayout } from "./WorkspaceLayout";
import type { WorkspaceRoute } from "../../types";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("../../context/AuthContext", () => ({ useAuth: useAuthMock }));

const expectedNavigation: Array<[string, WorkspaceRoute]> = [
  ["Dashboard", "/app"],
  ["Trading", "/app/trading"],
  ["Strategies", "/app/strategies"],
  ["News Intelligence", "/app/news"],
  ["Risk Management", "/app/risk"],
  ["MT5 Connections", "/app/mt5"],
  ["Signal History", "/app/signals"],
  ["Backtesting", "/app/backtesting"],
  ["Settings", "/app/settings"],
  ["Help and Support", "/app/support"],
];

function setAuth(designatedAdmin = false) {
  useAuthMock.mockReturnValue({
    user: { email: designatedAdmin ? "pippilotaiadmin@gmail.com" : "trader@example.test" },
    emailVerified: true,
    membershipStatus: "active",
    userRole: designatedAdmin ? "admin" : "trader",
    isApproved: true,
    isDesignatedAdmin: designatedAdmin,
    logout: vi.fn(),
  });
}

describe("workspace navigation preservation", () => {
  afterEach(() => cleanup());
  beforeEach(() => setAuth());

  it("keeps the ten original labels and routes in their original order", () => {
    expect(WORKSPACE_NAV_ITEMS.map(({ label, route }) => [label, route])).toEqual(
      expectedNavigation,
    );
  });

  it("renders every original desktop route without replacing its label", () => {
    const onNavigate = vi.fn();
    render(
      <WorkspaceLayout currentRoute="/app" onNavigate={onNavigate}>
        <div>workspace content</div>
      </WorkspaceLayout>,
    );

    for (const [label, route] of expectedNavigation) {
      const routeId =
        route === "/app" ? "dashboard" : route.replace("/app/", "");
      expect(screen.getByTestId(`nav-desktop-${routeId}`).textContent).toContain(label);
    }
  });

  it("preserves all ten routes and their paths in the mobile left drawer", () => {
    const onNavigate = vi.fn();
    render(
      <WorkspaceLayout currentRoute="/app" onNavigate={onNavigate}>
        <div>workspace content</div>
      </WorkspaceLayout>,
    );

    fireEvent.click(screen.getByTestId("button-open-left-drawer"));
    expect(screen.getByRole("dialog", { name: "Workspace left navigation" })).toBeTruthy();

    for (const [label, route] of expectedNavigation) {
      const routeId =
        route === "/app" ? "dashboard" : route.replace("/app/", "");
      expect(screen.getByTestId(`nav-mobile-${routeId}`).textContent).toContain(label);
    }

    fireEvent.click(screen.getByTestId("nav-mobile-backtesting"));
    expect(onNavigate).toHaveBeenCalledWith("/app/backtesting");
    expect(screen.queryByRole("dialog", { name: "Workspace left navigation" })).toBeNull();
  });

  it("adds the separate admin link only for the designated administrator", () => {
    expect(ADMIN_NAV_ITEM).toMatchObject({
      label: "Admin Panel",
      route: "/app/admin",
    });

    const onNavigate = vi.fn();
    const { rerender } = render(
      <WorkspaceLayout currentRoute="/app" onNavigate={onNavigate}>
        <div>workspace content</div>
      </WorkspaceLayout>,
    );
    expect(screen.queryByTestId("nav-desktop-admin")).toBeNull();

    setAuth(true);
    rerender(
      <WorkspaceLayout currentRoute="/app/admin" onNavigate={onNavigate}>
        <div>workspace content</div>
      </WorkspaceLayout>,
    );
    expect(screen.getByTestId("nav-desktop-admin").textContent).toContain("Admin Panel");
    expect(screen.getByTestId("nav-desktop-admin").getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByTestId("button-open-left-drawer"));
    expect(screen.getByTestId("nav-mobile-admin").textContent).toContain("Admin Panel");
  });
});
