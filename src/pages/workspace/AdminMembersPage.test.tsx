import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMembersPage } from "./AdminMembersPage";

const {
  useAuthMock,
  useInitializeAdminMock,
  useListAdminUsersMock,
  useTerminateAdminUserSessionsMock,
  useUpdateAdminMembershipMock,
  initializeMutation,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useInitializeAdminMock: vi.fn(),
  useListAdminUsersMock: vi.fn(),
  useTerminateAdminUserSessionsMock: vi.fn(),
  useUpdateAdminMembershipMock: vi.fn(),
  initializeMutation: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({ useAuth: useAuthMock }));
vi.mock("@workspace/api-client-react", () => ({
  useInitializeAdmin: useInitializeAdminMock,
  useListAdminUsers: useListAdminUsersMock,
  useTerminateAdminUserSessions: useTerminateAdminUserSessionsMock,
  useUpdateAdminMembership: useUpdateAdminMembershipMock,
}));

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminMembersPage />
    </QueryClientProvider>,
  );
}

describe("administrator initialization UI", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useAuthMock.mockReturnValue({
      session: { access_token: "test-admin-token" },
      user: { id: "admin-user-id", email: "pippilotaiadmin@gmail.com" },
      isLoading: false,
      isDesignatedAdmin: true,
    });
    useListAdminUsersMock.mockReturnValue({
      data: undefined,
      error: { status: 403 },
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    });
    initializeMutation.mockResolvedValue({
      role: "admin",
      membershipStatus: "active",
    });
    useInitializeAdminMock.mockReturnValue({
      mutateAsync: initializeMutation,
      isPending: false,
    });
    useTerminateAdminUserSessionsMock.mockReturnValue({ mutateAsync: vi.fn() });
    useUpdateAdminMembershipMock.mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("does not initialize automatically and waits for an explicit button click", async () => {
    renderAdminPage();

    expect(screen.getByTestId("state-admin-initialization-required")).toBeTruthy();
    expect(initializeMutation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("button-initialize-admin"));
    await waitFor(() => expect(initializeMutation).toHaveBeenCalledTimes(1));
  });

  it("does not show the initialization action to ordinary users", () => {
    useAuthMock.mockReturnValue({
      session: { access_token: "ordinary-user-token" },
      user: { id: "ordinary-user-id", email: "trader@example.test" },
      isLoading: false,
      isDesignatedAdmin: false,
    });

    renderAdminPage();

    expect(screen.getByTestId("state-admin-access-denied")).toBeTruthy();
    expect(screen.queryByTestId("button-initialize-admin")).toBeNull();
    expect(initializeMutation).not.toHaveBeenCalled();
  });
});
