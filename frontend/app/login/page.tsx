'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  authenticateUser,
  encodeLocalSessionToken,
  defaultDemoUsers,
  getDefaultRouteForSession,
  getOrganizations,
  getUserDirectory,
  getRoleLabels,
  storeSessionSnapshot,
  storeSessionToken,
  type AuthSession,
} from '@/lib/auth';
import { apiUrl } from '@/lib/api';
import { TmsBrandLogo } from '@/components/tms-brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, AlertCircle, ShieldCheck, Route, Warehouse, Radar } from 'lucide-react';

export default function LoginPage() {
  const [organization, setOrganization] = useState('Pro');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const router = useRouter();
  const demoUsers = getUserDirectory().length > 0 ? getUserDirectory() : defaultDemoUsers;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tryLocalFallbackLogin = () => {
      const fallbackSession = authenticateUser(organization, userId, password)
      if (fallbackSession) {
        storeSessionToken(encodeLocalSessionToken(fallbackSession))
        router.replace(getDefaultRouteForSession(fallbackSession))
        return true
      }

      return false
    }

    if (!organization.trim()) {
      setError('Please enter organization name.');
      setLoading(false);
      return;
    }

    const selectedOrganization = getOrganizations().find(
      (item) => item.name.toLowerCase() === organization.trim().toLowerCase()
    )

    if (selectedOrganization?.isBlocked) {
      setError('This organization is blocked. Please contact the super admin.')
      setLoading(false)
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 3000)

      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organization, userId, password }),
        signal: controller.signal,
      })
      window.clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status >= 500 && tryLocalFallbackLogin()) {
          return
        }

        let message = 'Unable to sign in right now.'
        try {
          const data = (await response.json()) as { error?: string }
          if (response.status === 401) {
            message = data.error || 'Invalid organization, User ID, or Password.'
          } else {
            message = data.error || `Login failed with status ${response.status}.`
          }
        } catch {
          message = response.status === 401
            ? 'Invalid organization, User ID, or Password.'
            : `Login failed with status ${response.status}.`
        }
        setError(message);
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { token: string; session: AuthSession }
      storeSessionSnapshot(data.token, data.session)
      storeSessionToken(data.token)
      router.replace(getDefaultRouteForSession(data.session))
    } catch {
      if (tryLocalFallbackLogin()) {
        return
      }

      setError('Cannot reach the backend service. Make sure the FastAPI server is running on port 8001.')
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/login-hero.jpg"
        alt="Logistics fleet background"
        fill
        priority
        className="object-cover object-center brightness-110 saturate-110"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,26,0.78)_0%,rgba(8,15,26,0.52)_48%,rgba(8,15,26,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_24%)]" />
      <div className="relative z-10 flex min-h-screen items-stretch">
        <section className="hidden w-full max-w-[44rem] flex-col justify-between px-8 py-10 lg:flex xl:px-12">
          <div className="max-w-lg space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
              <Truck className="h-4 w-4 text-sky-300" />
              EXO PG Control Tower
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-200/80">Transport Management System</p>
              <h1 className="max-w-xl text-[2.65rem] font-semibold leading-tight text-white xl:text-5xl">
                Move planning, dispatch, tracking, and gate operations from one screen.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-slate-200/82 xl:text-base">
                Built for logistics teams to manage incoming ERP orders, vehicle movement, trip execution, and billing without jumping between disconnected tools.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-3 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-md">
              <Route className="mb-3 h-5 w-5 text-sky-300" />
              <h2 className="text-sm font-semibold text-white">Order Landing</h2>
              <p className="mt-2 text-xs leading-5 text-slate-200/80">
                Pull customer orders from external systems and move them directly into planning.
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-md">
              <Warehouse className="mb-3 h-5 w-5 text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">Fleet Visibility</h2>
              <p className="mt-2 text-xs leading-5 text-slate-200/80">
                Keep vehicles, drivers, maintenance, and gate pass activity aligned in one workflow.
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-md">
              <Radar className="mb-3 h-5 w-5 text-amber-300" />
              <h2 className="text-sm font-semibold text-white">Live Execution</h2>
              <p className="mt-2 text-xs leading-5 text-slate-200/80">
                Track trips, dispatch status, and exceptions with a clear operational dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-end px-4 py-4 sm:px-5 lg:px-7 xl:px-10">
          <div className="w-full max-w-[22rem] rounded-[1.35rem] border border-white/15 bg-white/88 p-3.5 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.34)] backdrop-blur-xl sm:max-w-[24rem] sm:p-4">
            <div className="space-y-2">
              <div className="inline-flex">
                <TmsBrandLogo compact />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Secure Access</p>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-[1.45rem]">Sign in to your TMS workspace</h2>
                <p className="text-xs leading-5 text-slate-600 sm:text-sm">
                  Use your organization, user ID, and password to continue into the operations dashboard.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-slate-700">Organization</Label>
                <Input
                  id="organization"
                  placeholder="Enter your organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  className="h-9 rounded-lg border-slate-200 bg-white/90 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId" className="text-slate-700">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="h-9 rounded-lg border-slate-200 bg-white/90 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <a href="#" className="text-xs font-semibold text-sky-700 transition-colors hover:text-sky-600">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 rounded-lg border-slate-200 bg-white/90 focus-visible:ring-sky-500"
                />
              </div>

              <Button
                type="submit"
                className="h-9 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4 rounded-[1rem] border border-sky-100 bg-sky-50/80 p-3">
              <button
                type="button"
                onClick={() => setShowDemoAccess((current) => !current)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-sky-700" />
                  Demo access
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  {showDemoAccess ? 'Hide' : 'Show'}
                </span>
              </button>

              {showDemoAccess ? (
                <div className="mt-3 space-y-2">
                  {demoUsers.map((user) => (
                    <button
                      key={`${user.organization}-${user.userId}`}
                      type="button"
                      onClick={() => {
                        setOrganization(user.organization);
                        setUserId(user.userId);
                        setPassword(user.password);
                        setError('');
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-sky-100 bg-white px-3 py-2 text-left transition-colors hover:bg-sky-50"
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{getRoleLabels(user.roles)}</span>
                        <span className="block text-xs text-slate-500">
                          Org: {user.organization} | ID: {user.userId} | Password: {user.password}
                        </span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Use</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-center text-xs text-slate-500 sm:text-sm">
              Don&apos;t have an account?{' '}
              <a href="#" className="font-semibold text-sky-700 transition-colors hover:text-sky-600">
                Contact Admin
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
