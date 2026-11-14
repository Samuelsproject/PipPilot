import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRound,
  X,
} from 'lucide-react';
import {
  useListAdminUsers,
  useTerminateAdminUserSessions,
  useUpdateAdminMembership,
} from '@workspace/api-client-react';
import type { AdminMember } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

type MembershipStatus = AdminMember['membershipStatus'];
type StatusFilter = 'all' | MembershipStatus;
type PendingAction = {
  user: AdminMember;
  kind: 'suspend' | 'expire' | 'terminate';
};

const STATUS_STYLES: Record<MembershipStatus, string> = {
  pending: 'border-[#E7A24B]/25 bg-[#E7A24B]/10 text-[#F0B65E]',
  active: 'border-[#2ABB83]/25 bg-[#2ABB83]/10 text-[#54D89D]',
  suspended: 'border-[#F08B57]/25 bg-[#F08B57]/10 text-[#F4A177]',
  expired: 'border-[#899AA5]/20 bg-[#899AA5]/10 text-[#AAB7C0]',
};

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All members', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Expired', value: 'expired' },
];

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { status?: number; statusCode?: number; response?: { status?: number } };
  return candidate.status ?? candidate.statusCode ?? candidate.response?.status;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const value = (data as { error?: unknown }).error;
      if (typeof value === 'string') return value;
    }
  }
  if (error && typeof error === 'object' && 'error' in error) {
    const value = (error as { error?: unknown }).error;
    if (typeof value === 'string') return value;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'The request could not be completed. Try again in a moment.';
}

function formatDate(value: string | Date | null): string {
  if (!value) return 'Never';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function initials(email: string | null): string {
  if (!email) return '—';
  return email.slice(0, 1).toUpperCase();
}

function StatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      data-testid={`status-membership-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.11em] ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function AdminMembersPage() {
  const { session, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const token = session?.access_token;
  const request = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token ?? ''}` } }),
    [token],
  );
  const adminQuery = useListAdminUsers({
    request,
    query: { enabled: Boolean(token), queryKey: ['/api/admin/users'] },
  });
  const updateMembership = useUpdateAdminMembership({ request });
  const terminateSessions = useTerminateAdminUserSessions({ request });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mutationDenied, setMutationDenied] = useState(false);

  const response = adminQuery.data;
  const users = response?.users ?? [];
  const queryDenied = [401, 403].includes(errorStatus(adminQuery.error) ?? 0);
  const denied = queryDenied || mutationDenied;
  const counts = useMemo(() => ({
    total: users.length,
    pending: users.filter((member) => member.membershipStatus === 'pending').length,
    active: users.filter((member) => member.membershipStatus === 'active').length,
    restricted: users.filter((member) => member.membershipStatus === 'suspended' || member.membershipStatus === 'expired').length,
  }), [users]);
  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return users.filter((member) => {
      const matchesSearch =
        !normalized ||
        (member.email ?? '').toLowerCase().includes(normalized) ||
        member.id.toLowerCase().includes(normalized);
      return matchesSearch && (statusFilter === 'all' || member.membershipStatus === statusFilter);
    });
  }, [users, search, statusFilter]);

  const refreshUsers = async () => {
    setFeedback(null);
    await adminQuery.refetch();
  };

  const runAction = async (action: PendingAction) => {
    setBusyUserId(action.user.id);
    setFeedback(null);
    try {
      if (action.kind === 'terminate') {
        const result = await terminateSessions.mutateAsync({ userId: action.user.id });
        if (!result.success) throw new Error('Sessions could not be terminated. Please retry.');
        setFeedback({ type: 'success', text: `Sessions terminated for ${action.user.email ?? 'this member'}.` });
      } else {
        const status: MembershipStatus = action.kind === 'suspend' ? 'suspended' : 'expired';
        const result = await updateMembership.mutateAsync({
          userId: action.user.id,
          data: { status },
        });
        setFeedback({
          type: 'success',
          text: `${action.user.email ?? 'Member'} is now ${result.user.membershipStatus}.${!result.sessionsTerminated ? ' Existing sessions were not forcibly terminated; Supabase requires the member’s own access token for that operation.' : ''}`,
        });
      }
      setPendingAction(null);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    } catch (error) {
      if ([401, 403].includes(errorStatus(error) ?? 0)) setMutationDenied(true);
      setFeedback({ type: 'error', text: errorMessage(error) });
    } finally {
      setBusyUserId(null);
    }
  };

  const setMembership = async (member: AdminMember, status: MembershipStatus) => {
    setBusyUserId(member.id);
    setFeedback(null);
    try {
      const result = await updateMembership.mutateAsync({ userId: member.id, data: { status } });
      setFeedback({
        type: 'success',
        text: `${member.email ?? 'Member'} is now ${result.user.membershipStatus}.${!result.sessionsTerminated && (status === 'suspended' || status === 'expired') ? ' Existing sessions were not forcibly terminated; Supabase requires the member’s own access token for that operation.' : ''}`,
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    } catch (error) {
      if ([401, 403].includes(errorStatus(error) ?? 0)) setMutationDenied(true);
      setFeedback({ type: 'error', text: errorMessage(error) });
    } finally {
      setBusyUserId(null);
    }
  };

  const confirmCopy = pendingAction
    ? pendingAction.kind === 'terminate'
      ? {
          title: 'Terminate active sessions?',
          description: `Supabase requires ${pendingAction.user.email ?? 'the member'}'s access token to terminate sessions. This workspace does not store other members' tokens, so this action may be unavailable.`,
          action: 'Terminate sessions',
          warning: true,
        }
      : pendingAction.kind === 'suspend'
        ? {
            title: 'Suspend this membership?',
            description: `${pendingAction.user.email ?? 'This member'} will be marked suspended. Existing access tokens may remain valid until refresh or expiry.`,
            action: 'Suspend member',
            warning: true,
          }
        : {
            title: 'Revoke workspace access?',
            description: `Set ${pendingAction.user.email ?? 'this member'} to expired. You can restore access at any time; existing access tokens may remain valid until refresh or expiry.`,
            action: 'Set to expired',
            warning: true,
          }
    : null;

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 animate-pulse" aria-label="Loading administrator workspace">
        <div className="h-8 w-56 rounded-lg bg-[#1A3035]" />
        <div className="h-32 rounded-2xl border border-[#20383D] bg-[#14272C]" />
        <div className="h-80 rounded-2xl border border-[#20383D] bg-[#14272C]" />
      </div>
    );
  }

  if (!user || !token || denied) {
    return (
      <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[#E05252]/25 bg-[#17282D] p-6 sm:p-9" data-testid="state-admin-access-denied">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E05252]/25 bg-[#E05252]/10 text-[#F07B73]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F07B73]">Restricted area</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#E8F2EE]">Administrator access required</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#A9BEB5]">
          {denied
            ? 'Your session does not have permission to manage memberships. No member data is being shown.'
            : 'Sign in with the designated administrator account to view and manage member access.'}
        </p>
        {denied && (
          <button type="button" onClick={() => { setMutationDenied(false); void refreshUsers(); }} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#365158] bg-[#1A3035] px-4 text-sm font-semibold text-[#E8F2EE] transition hover:border-[#2ABB83]/45" data-testid="button-retry-admin-access">
            <RefreshCw className="h-4 w-4" /> Retry access check
          </button>
        )}
      </section>
    );
  }

  if (adminQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 animate-pulse" aria-label="Loading members">
        <div className="h-8 w-56 rounded-lg bg-[#1A3035]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-2xl border border-[#20383D] bg-[#14272C]" />)}</div>
        <div className="h-80 rounded-2xl border border-[#20383D] bg-[#14272C]" />
      </div>
    );
  }

  if (adminQuery.isError) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#E05252]/25 bg-[#17282D] p-6 sm:p-9" data-testid="state-admin-load-error">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E05252]/10 text-[#F07B73]"><AlertTriangle className="h-5 w-5" /></div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F07B73]">Unable to load members</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#E8F2EE]">The directory is unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[#A9BEB5]">{errorMessage(adminQuery.error)}</p>
        <button type="button" onClick={() => void refreshUsers()} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#20845F] px-4 text-sm font-bold text-[#E8F2EE] transition hover:bg-[#26966C]" data-testid="button-retry-admin-users"><RefreshCw className="h-4 w-4" /> Try again</button>
      </section>
    );
  }

  const admin = response?.admin;

  return (
    <div className="mx-auto max-w-6xl pb-12 text-[#E8F2EE]">
      <div className="mb-7 flex flex-col gap-5 border-b border-[#243B40] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7F9992]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#42C88D]" /> Control room <span className="text-[#435C61]">/</span> Access management
          </div>
          <h1 className="purple-glow-text text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-tight tracking-[-0.045em]">Member access</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#A9BEB5]">Review membership, protect account access, and keep the trading workspace undisturbed.</p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-2xl border border-[#294247] bg-[#14272C] px-3.5 py-3 sm:self-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#9560E8]/25 bg-[#9560E8]/10 text-sm font-semibold text-[#D2B7FF]">{initials(admin?.email ?? user.email ?? null)}</div>
          <div className="min-w-0">
            <p className="max-w-[210px] truncate text-xs font-semibold text-[#E8F2EE]" data-testid="text-admin-identity">{admin?.email ?? user.email ?? 'Administrator'}</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#B99BEA]"><ShieldCheck className="h-3 w-3" /> {admin?.role ?? 'admin'} · designated owner</p>
          </div>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Membership overview">
        <Metric label="Directory" value={counts.total} note="registered members" icon={<UserRound className="h-4 w-4" />} color="text-[#62B7FF]" />
        <Metric label="Awaiting review" value={counts.pending} note="pending approval" icon={<Clock3 className="h-4 w-4" />} color="text-[#F0B65E]" />
        <Metric label="Active access" value={counts.active} note="workspace enabled" icon={<Activity className="h-4 w-4" />} color="text-[#54D89D]" />
        <Metric label="Restricted" value={counts.restricted} note="suspended or expired" icon={<ShieldOff className="h-4 w-4" />} color="text-[#AAB7C0]" />
      </section>

      {feedback && (
        <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-[#2ABB83]/25 bg-[#2ABB83]/[0.08] text-[#77DFAE]' : 'border-[#E05252]/30 bg-[#E05252]/[0.08] text-[#F08C84]'}`} role="status" data-testid={`message-admin-${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">{feedback.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setFeedback(null)} className="rounded p-1 opacity-70 transition hover:opacity-100" data-testid="button-dismiss-admin-message"><X className="h-4 w-4" /></button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#294247] bg-[#14272C] shadow-[0_22px_70px_-52px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col gap-4 border-b border-[#294247] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide">User directory</h2>
            <p className="mt-1 text-xs text-[#849C96]">Membership state is server-managed. Existing Supabase access tokens may retain old claims until refresh or expiry.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:min-w-[230px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78908A]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or user ID" aria-label="Search users" className="h-10 w-full rounded-xl border border-[#314B50] bg-[#102126] pl-9 pr-3 text-xs text-[#E8F2EE] outline-none transition placeholder:text-[#718781] focus:border-[#2ABB83]/60 focus:ring-2 focus:ring-[#2ABB83]/10" data-testid="input-search-admin-users" />
            </label>
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78908A]" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter membership status" className="h-10 w-full appearance-none rounded-xl border border-[#314B50] bg-[#102126] py-0 pl-9 pr-9 text-xs text-[#DDE9E4] outline-none transition focus:border-[#2ABB83]/60 sm:min-w-[160px]" data-testid="select-membership-filter">
                {FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78908A]" />
            </label>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-16 text-center" data-testid="state-admin-empty">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#294247] bg-[#102126] text-[#70A697]"><UserRound className="h-5 w-5" /></div>
            <h3 className="mt-4 text-sm font-semibold">No members in the directory</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8EA49D]">New registered accounts will appear here when they are available for review.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-14 text-center" data-testid="state-admin-no-results">
            <Search className="mx-auto h-5 w-5 text-[#78908A]" />
            <h3 className="mt-3 text-sm font-semibold">No matching members</h3>
            <p className="mt-1 text-xs text-[#8EA49D]">Try a different search or membership filter.</p>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-4 text-xs font-semibold text-[#65D9A3] hover:text-[#A4F0CA]" data-testid="button-clear-admin-filters">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-[#102126]/70">
                  <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#78908A]">
                    <th className="px-5 py-3 font-medium">Member</th><th className="px-4 py-3 font-medium">Verification</th><th className="px-4 py-3 font-medium">Membership</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium">Last sign-in</th><th className="px-5 py-3 text-right font-medium">Access actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#294247]/70">
                  {filteredUsers.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-[#1A3035]/55" data-testid={`row-admin-member-${member.id}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#315158] bg-[#1A3035] text-sm font-semibold text-[#8AB6A4]">{initials(member.email)}</div>
                          <div className="min-w-0"><p className="max-w-[210px] truncate text-xs font-semibold text-[#E1EBE7]" data-testid={`text-member-email-${member.id}`}>{member.email ?? 'Email unavailable'}</p><p className="mt-1 font-mono text-[9px] text-[#718781]">{member.role} · {member.id.slice(0, 8)}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 text-[11px] ${member.emailVerified ? 'text-[#6BD7A6]' : 'text-[#E9AC5C]'}`}>{member.emailVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}{member.emailVerified ? 'Verified' : 'Unverified'}</span></td>
                      <td className="px-4 py-4"><StatusBadge status={member.membershipStatus} /></td>
                      <td className="px-4 py-4 text-xs text-[#A9BEB5]">{formatDate(member.createdAt)}</td>
                      <td className="px-4 py-4 text-xs text-[#A9BEB5]">{formatDate(member.lastSignInAt)}</td>
                      <td className="px-5 py-4"><div className="flex justify-end">{renderActions(member, busyUserId === member.id, setMembership, setPendingAction)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#294247]/70 md:hidden">
              {filteredUsers.map((member) => (
                <article key={member.id} className="space-y-4 px-4 py-4" data-testid={`card-admin-member-${member.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#315158] bg-[#1A3035] text-sm font-semibold text-[#8AB6A4]">{initials(member.email)}</div>
                      <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#E1EBE7]">{member.email ?? 'Email unavailable'}</p><p className="mt-1 truncate font-mono text-[9px] text-[#718781]">{member.role} · {member.id.slice(0, 8)}</p></div>
                    </div>
                    <StatusBadge status={member.membershipStatus} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#294247]/70 bg-[#102126]/45 p-3">
                    <div><p className="font-mono text-[9px] uppercase tracking-wider text-[#718781]">Email</p><p className={`mt-1 text-[11px] ${member.emailVerified ? 'text-[#6BD7A6]' : 'text-[#E9AC5C]'}`}>{member.emailVerified ? 'Verified' : 'Unverified'}</p></div>
                    <div><p className="font-mono text-[9px] uppercase tracking-wider text-[#718781]">Joined</p><p className="mt-1 text-[11px] text-[#A9BEB5]">{formatDate(member.createdAt)}</p></div>
                    <div className="col-span-2"><p className="font-mono text-[9px] uppercase tracking-wider text-[#718781]">Last sign-in</p><p className="mt-1 text-[11px] text-[#A9BEB5]">{formatDate(member.lastSignInAt)}</p></div>
                  </div>
                  {renderActions(member, busyUserId === member.id, setMembership, setPendingAction)}
                </article>
              ))}
            </div>
          </>
        )}
        <div className="flex items-center justify-between border-t border-[#294247] bg-[#102126]/40 px-4 py-3 text-[10px] text-[#78908A] sm:px-5">
          <span>{filteredUsers.length} of {users.length} members</span>
          <button type="button" onClick={() => void refreshUsers()} disabled={adminQuery.isFetching} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[#A9BEB5] transition hover:bg-[#1A3035] hover:text-[#E8F2EE] disabled:opacity-50" data-testid="button-refresh-admin-users"><RefreshCw className={`h-3.5 w-3.5 ${adminQuery.isFetching ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </section>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#294247]/80 bg-[#14272C]/70 px-4 py-3 text-[11px] leading-5 text-[#829992]">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7CA99A]" />
        <p>Membership controls are isolated from trading settings. Suspending or expiring access does not alter account data; session termination signs the member out immediately.</p>
      </div>

      {pendingAction && confirmCopy && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#081316]/75 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingAction(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-admin-title" className="w-full max-w-md rounded-2xl border border-[#3A5155] bg-[#172B30] p-5 shadow-2xl sm:p-6" data-testid="dialog-confirm-admin-action">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${confirmCopy.warning ? 'bg-[#E69A36]/10 text-[#EAB05F]' : 'bg-[#2ABB83]/10 text-[#54D89D]'}`}><AlertTriangle className="h-5 w-5" /></div>
            <h2 id="confirm-admin-title" className="text-lg font-semibold tracking-tight">{confirmCopy.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#A9BEB5]">{confirmCopy.description}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingAction(null)} className="min-h-11 rounded-xl border border-[#365158] px-4 text-sm font-semibold text-[#B8C9C2] transition hover:bg-[#20383D]" data-testid="button-cancel-admin-action">Keep as is</button>
              <button type="button" onClick={() => void runAction(pendingAction)} disabled={busyUserId === pendingAction.user.id} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:opacity-50 ${confirmCopy.warning ? 'bg-[#9C5939] text-[#FFF0E7] hover:bg-[#B36A47]' : 'bg-[#20845F] text-[#E8F2EE] hover:bg-[#26966C]'}`} data-testid="button-confirm-admin-action">
                {busyUserId === pendingAction.user.id && <RefreshCw className="h-4 w-4 animate-spin" />}{confirmCopy.action}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, note, icon, color }: { label: string; value: number; note: string; icon: ReactNode; color: string }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#294247] bg-[#14272C] p-4 sm:p-5">
      <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-current/15 bg-current/[0.07] ${color}`}>{icon}</div>
      <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#819891]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className={`font-mono text-[1.65rem] leading-none tracking-[-0.06em] ${color}`} data-testid={`metric-admin-${label.toLowerCase().replaceAll(' ', '-')}`}>{value.toLocaleString()}</span>
        <span className="pb-0.5 text-right text-[9px] leading-4 text-[#718781]">{note}</span>
      </div>
    </article>
  );
}

function renderActions(
  member: AdminMember,
  busy: boolean,
  setMembership: (member: AdminMember, status: MembershipStatus) => Promise<void>,
  setPendingAction: (action: PendingAction) => void,
) {
  const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition disabled:cursor-wait disabled:opacity-50';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {member.membershipStatus === 'pending' && (
        <button type="button" onClick={() => void setMembership(member, 'active')} disabled={busy} className={`${buttonClass} border-[#2ABB83]/30 bg-[#2ABB83]/10 text-[#67D7A5] hover:bg-[#2ABB83]/20`} data-testid={`button-approve-member-${member.id}`}>
          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
        </button>
      )}
      {member.membershipStatus === 'active' && (
        <>
          <button type="button" onClick={() => setPendingAction({ user: member, kind: 'suspend' })} disabled={busy} className={`${buttonClass} border-[#E69A36]/25 bg-[#E69A36]/[0.07] text-[#EAB05F] hover:bg-[#E69A36]/15`} data-testid={`button-suspend-member-${member.id}`}>Suspend</button>
          <button type="button" onClick={() => setPendingAction({ user: member, kind: 'expire' })} disabled={busy} className={`${buttonClass} border-[#E05252]/25 bg-[#E05252]/[0.06] text-[#EF8A80] hover:bg-[#E05252]/15`} data-testid={`button-revoke-member-${member.id}`}>Revoke</button>
        </>
      )}
      {(member.membershipStatus === 'suspended' || member.membershipStatus === 'expired') && (
        <button type="button" onClick={() => void setMembership(member, 'active')} disabled={busy} className={`${buttonClass} border-[#2ABB83]/30 bg-[#2ABB83]/10 text-[#67D7A5] hover:bg-[#2ABB83]/20`} data-testid={`button-restore-member-${member.id}`}>
          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Restore
        </button>
      )}
      <button type="button" onClick={() => setPendingAction({ user: member, kind: 'terminate' })} disabled={busy} className={`${buttonClass} border-[#365158] bg-[#102126]/60 text-[#A9BEB5] hover:border-[#7B9890] hover:text-[#E8F2EE]`} data-testid={`button-terminate-sessions-${member.id}`}>
        <LockKeyhole className="h-3.5 w-3.5" /> Sessions
      </button>
    </div>
  );
}
