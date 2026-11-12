From: <Saved by Blink>
Snapshot-Content-Location: https://ais-dev-ezkohsnyhrfy73mxhkax3w-355330551877.europe-west3.run.app/pippilot-workspace-navigation.patch?utm_source=chatgpt.com
Subject: 
Date: Thu, 12 Nov 2026 20:02:08 GMT
MIME-Version: 1.0
Content-Type: multipart/related;
	type="text/html";
	boundary="----MultipartBoundary--A4d08sTGbR7JITrLHWRaBfc8gPZmoF7jGlCh82tXiD----"


------MultipartBoundary--A4d08sTGbR7JITrLHWRaBfc8gPZmoF7jGlCh82tXiD----
Content-Type: text/html
Content-ID: <frame-52140469E97B99AE539C1EC036805135@mhtml.blink>
Content-Transfer-Encoding: binary
Content-Location: https://ais-dev-ezkohsnyhrfy73mxhkax3w-355330551877.europe-west3.run.app/pippilot-workspace-navigation.patch?utm_source=chatgpt.com

<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head><body>diff --git a/src/App.tsx b/src/App.tsx
index 3aa98b8..e93078c 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -4,8 +4,8 @@
  */
 
 import React, { useState, useEffect } from 'react';
-import { NavigationRoute } from './types';
-import { AuthProvider, useAuth } from './context/AuthContext';
+import { NavigationRoute, WorkspaceRoute } from './types';
+import { AuthProvider } from './context/AuthContext';
 import { Navbar } from './components/Navbar';
 import { Hero } from './components/Hero';
 import { Features } from './components/Features';
@@ -23,28 +23,56 @@ import { VerifyEmailPage } from './pages/VerifyEmailPage';
 import { SupabaseConfigBanner } from './components/SupabaseConfigBanner';
 import { ContactModal, PrivacyModal, TermsModal } from './components/Modals';
 
-function AppContent() {
-  const { isConfigured, user } = useAuth();
+const WORKSPACE_ROUTES: WorkspaceRoute[] = [
+  '/app',
+  '/app/trading',
+  '/app/strategies',
+  '/app/news',
+  '/app/risk',
+  '/app/mt5',
+  '/app/signals',
+  '/app/backtesting',
+  '/app/settings',
+  '/app/support',
+];
+
+function isWorkspaceRoute(route: NavigationRoute): route is WorkspaceRoute {
+  return route === '/app' || route.startsWith('/app/');
+}
 
-  const [currentRoute, setCurrentRoute] = useState<navigationroute>(() =&gt; {
-    const path = window.location.pathname;
-    const hash = window.location.hash;
+function resolveRouteFromLocation(): NavigationRoute {
+  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
+  const hash = window.location.hash;
 
-    // Detect Supabase recovery link callback in hash
-    if (hash.includes('type=recovery') || path === '/reset-password') {
-      return '/reset-password';
-    }
-    // Detect email confirmation signup callback in hash
-    if (hash.includes('type=signup') || path === '/verify-email') {
-      return '/verify-email';
+  // Detect Supabase recovery link callback in hash
+  if (hash.includes('type=recovery') || rawPath === '/reset-password') {
+    return '/reset-password';
+  }
+  // Detect email confirmation signup callback in hash
+  if (hash.includes('type=signup') || rawPath === '/verify-email') {
+    return '/verify-email';
+  }
+
+  for (const wsRoute of WORKSPACE_ROUTES) {
+    if (rawPath === wsRoute || hash === `#${wsRoute}`) {
+      return wsRoute;
     }
-    if (path === '/app' || hash === '#/app') return '/app';
-    if (path === '/register' || hash === '#/register') return '/register';
-    if (path === '/login' || hash === '#/login') return '/login';
-    if (path === '/forgot-password' || hash === '#/forgot-password') return '/forgot-password';
+  }
+  if (rawPath.startsWith('/app/')) {
+    return '/app';
+  }
 
-    return '/';
-  });
+  if (rawPath === '/register' || hash === '#/register') return '/register';
+  if (rawPath === '/login' || hash === '#/login') return '/login';
+  if (rawPath === '/forgot-password' || hash === '#/forgot-password') return '/forgot-password';
+
+  return '/';
+}
+
+function AppContent() {
+  const [currentRoute, setCurrentRoute] = useState<navigationroute>(() =&gt;
+    resolveRouteFromLocation()
+  );
 
   const [contactOpen, setContactOpen] = useState(false);
   const [privacyOpen, setPrivacyOpen] = useState(false);
@@ -53,24 +81,7 @@ function AppContent() {
   // Sync with browser popstate and URL hash changes
   useEffect(() =&gt; {
     const handlePopState = () =&gt; {
-      const path = window.location.pathname;
-      const hash = window.location.hash;
-
-      if (hash.includes('type=recovery') || path === '/reset-password') {
-        setCurrentRoute('/reset-password');
-      } else if (hash.includes('type=signup') || path === '/verify-email') {
-        setCurrentRoute('/verify-email');
-      } else if (path === '/app' || hash === '#/app') {
-        setCurrentRoute('/app');
-      } else if (path === '/register' || hash === '#/register') {
-        setCurrentRoute('/register');
-      } else if (path === '/login' || hash === '#/login') {
-        setCurrentRoute('/login');
-      } else if (path === '/forgot-password' || hash === '#/forgot-password') {
-        setCurrentRoute('/forgot-password');
-      } else {
-        setCurrentRoute('/');
-      }
+      setCurrentRoute(resolveRouteFromLocation());
     };
 
     // Custom event dispatched from AuthContext when Supabase fires PASSWORD_RECOVERY
@@ -164,11 +175,14 @@ function AppContent() {
     );
   }
 
-  if (currentRoute === '/app') {
+  if (isWorkspaceRoute(currentRoute)) {
     return (
       &lt;&gt;
         <supabaseconfigbanner>
-        <dashboardpreviewpage>
+        <dashboardpreviewpage +="" currentroute="{currentRoute}">
       
     );
   }
diff --git a/src/components/DashboardPreviewPage.tsx b/src/components/DashboardPreviewPage.tsx
index 26968b1..ab05316 100644
--- a/src/components/DashboardPreviewPage.tsx
+++ b/src/components/DashboardPreviewPage.tsx
@@ -1,597 +1,113 @@
-import React, { useState } from 'react';
-import { 
-  ArrowLeft, 
-  Activity, 
-  TrendingUp, 
-  TrendingDown, 
-  AlertTriangle, 
-  CheckCircle2, 
-  XCircle, 
-  Sliders, 
-  Layers, 
-  Calendar, 
-  Cpu, 
-  Workflow, 
-  ShieldAlert, 
-  Clock, 
-  Zap, 
-  Check, 
-  AlertCircle,
-  User,
-  LogOut,
-  LogIn,
-  KeyRound
-} from 'lucide-react';
-import { NavigationRoute } from '../types';
+import React from 'react';
+import { RefreshCw } from 'lucide-react';
+import { NavigationRoute, WorkspaceRoute } from '../types';
 import { useAuth } from '../context/AuthContext';
+import {
+  WORKSPACE_NAV_ITEMS,
+  WorkspaceLayout,
+} from './workspace/WorkspaceLayout';
+import {
+  PendingApprovalGuard,
+  WorkspaceAccessGate,
+} from './workspace/WorkspaceAccessGate';
+import { WorkspaceDashboardPage } from '../pages/workspace/WorkspaceDashboardPage';
+import { TradingPage } from '../pages/workspace/TradingPage';
+import { StrategiesPage } from '../pages/workspace/StrategiesPage';
+import { NewsIntelligencePage } from '../pages/workspace/NewsIntelligencePage';
+import { RiskManagementPage } from '../pages/workspace/RiskManagementPage';
+import { Mt5ConnectionsPage } from '../pages/workspace/Mt5ConnectionsPage';
+import { SignalHistoryPage } from '../pages/workspace/SignalHistoryPage';
+import { BacktestingPage } from '../pages/workspace/BacktestingPage';
+import { SettingsPage } from '../pages/workspace/SettingsPage';
+import { HelpSupportPage } from '../pages/workspace/HelpSupportPage';
 
 interface DashboardPreviewPageProps {
+  currentRoute?: WorkspaceRoute;
   onNavigate: (route: NavigationRoute) =&gt; void;
 }
 
-export const DashboardPreviewPage: React.FC<dashboardpreviewpageprops> = ({ onNavigate }) =&gt; {
-  const { user, emailVerified, membershipStatus, logout } = useAuth();
-
-  const [selectedAsset, setSelectedAsset] = useState&lt;'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'US30'&gt;('XAU/USD');
-  const [timeframe, setTimeframe] = useState&lt;'M5' | 'M15' | 'H1' | 'H4' | 'D1'&gt;('M15');
-  const [approvalStatus, setApprovalStatus] = useState&lt;'PENDING' | 'APPROVED' | 'REJECTED' | 'MT5_VALIDATED'&gt;('PENDING');
-  const [showNoTradeDemo, setShowNoTradeDemo] = useState(false);
-
-  // Risk parameters in the preview
-  const [accountBalance, setAccountBalance] = useState(25000);
-  const [riskPercent, setRiskPercent] = useState(1.0);
-  const [stopLossPips, setStopLossPips] = useState(30);
-
-  const riskAmount = (accountBalance * riskPercent) / 100;
-  const calculatedLotSize = +(riskAmount / (stopLossPips * 10)).toFixed(2);
-
-  const assetDetails = {
-    'XAU/USD': { name: 'Gold Spot / USD', price: '2,648.40', change: '+0.64%', bias: 'Bullish SMC' },
-    'EUR/USD': { name: 'Euro / US Dollar', price: '1.0842', change: '-0.12%', bias: 'Neutral ICT' },
-    'GBP/USD': { name: 'British Pound / USD', price: '1.2985', change: '+0.28%', bias: 'Bullish BOS' },
-    'US30': { name: 'Dow Jones Index', price: '43,890.10', change: '+0.45%', bias: 'Bullish Expansion' }
-  }[selectedAsset];
-
-  const handleSignOut = async () =&gt; {
-    await logout();
-    onNavigate('/');
-  };
-
-  return (
-    <div classname="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
-      {/* Top Banner Notice: Authentication &amp; Membership Separation Banner */}
-      <div classname="bg-[#152B30] border-b border-[#1A363E] px-4 py-2.5">
-        <div classname="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
-          {user ? (
-            <div classname="flex flex-wrap items-center gap-x-3 gap-y-1">
-              <span classname="font-mono text-[#E8F2EE] font-semibold flex items-center gap-1.5">
-                <user classname="w-3.5 h-3.5 text-[#16A36A]">
-                {user.email}
-              </user></span>
-              <span classname="{`px-2" py-0.5="" rounded="" text-[10px]="" font-mono="" font-bold="" ${="" -="" emailverified="" ?="" 'bg-[#16a36a]="" 20="" text-[#16a36a]'="" :="" 'bg-[#e69a36]="" text-[#e69a36]'="" }`}="">
-                {emailVerified ? 'Email Verified ✓' : 'Email Unverified �&nbsp;️'}
-              </span>
-              <span classname="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#9560E8]/20 text-[#E8F2EE] border border-[#9560E8]/30">
-                Membership: Pending Admin Approval (Step 3)
-              </span>
-              <span classname="text-[11px] text-[#A9BEB5] hidden lg:inline">
-                • Verified email confirms identity; live trading execution requires cohort admin approval.
-              </span>
-            </div>
-          ) : (
-            <div classname="flex items-center gap-2 text-[#E69A36]">
-              <alertcircle classname="w-4 h-4 shrink-0">
-              <span>
-                <strong>Preview Mode:</strong> Demonstrating terminal interface. Sign in with Supabase to test persistent authenticated session state.
-              </span>
-            </alertcircle></div>
-          )}
-
-          <div classname="flex items-center gap-3 self-end md:self-auto shrink-0">
-            {user ? (
-              <button -="" classname="text-xs font-bold text-[#E05252] hover:underline flex items-center gap-1">
-                <logout classname="w-3.5 h-3.5">
-                <span>Sign Out</span>
-              </logout></button>
-            ) : (
-              <button -="" ==""> onNavigate('/login')}
-                className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
-              &gt;
-                <login classname="w-3.5 h-3.5">
-                <span>Sign In</span>
-              </login></button>
-            )}
-            <span classname="text-[#1A363E]">|</span>
-            <button -="" ==""> onNavigate('/')}
-              className="flex items-center gap-1.5 text-xs font-bold text-[#16A36A] hover:text-[#E8F2EE] transition-colors"
-            &gt;
-              <arrowleft classname="w-3.5 h-3.5">
-              <span>Public Homepage</span>
-            </arrowleft></button>
-          </div>
+export const DashboardPreviewPage: React.FC<dashboardpreviewpageprops> = ({
+  currentRoute = '/app',
+  onNavigate,
+}) =&gt; {
+  const { user, isLoading, emailVerified, isApproved } = useAuth();
+
+  if (isLoading) {
+    return (
+      <div classname="min-h-screen bg-[#101B20] text-[#E8F2EE] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
+        <div classname="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#152B30] border border-[#1A363E] text-xs font-mono text-[#A9BEB5]">
+          <refreshcw classname="w-4 h-4 text-[#16A36A] animate-spin">
+          <span>Verifying workspace session...</span>
         </refreshcw></div>
       </div>
+    );
+  }
+
+  // Unauthenticated visitors must not access protected workspace routes
+  if (!user) {
+    return (
+      <workspaceaccessgate +="" mode="unauthenticated" attemptedroute="{currentRoute}">
+    );
+  }
+
+  // Unverified accounts must verify email before entering workspace
+  if (!emailVerified) {
+    return (
+      <workspaceaccessgate +="" mode="unverified" attemptedroute="{currentRoute}">
+    );
+  }
+
+  const activeNav =
+    WORKSPACE_NAV_ITEMS.find((item) =&gt; item.route === currentRoute) ??
+    WORKSPACE_NAV_ITEMS[0];
+
+  const renderWorkspacePage = () =&gt; {
+    // Pending users must not gain premium/protected trading access
+    if (activeNav.requiresApproval &amp;&amp; !isApproved) {
+      return (
+        <pendingapprovalguard +="" featurename="{activeNav.label}">
+      );
+    }
+
+    switch (currentRoute) {
+      case '/app/trading':
+        return <tradingpage>;
+      case '/app/strategies':
+        return <strategiespage>;
+      case '/app/news':
+        return <newsintelligencepage>;
+      case '/app/risk':
+        return <riskmanagementpage>;
+      case '/app/mt5':
+        return <mt5connectionspage>;
+      case '/app/signals':
+        return <signalhistorypage>;
+      case '/app/backtesting':
+        return <backtestingpage>;
+      case '/app/settings':
+        return <settingspage>;
+      case '/app/support':
+        return <helpsupportpage>;
+      case '/app':
+      default:
+        return <workspacedashboardpage>;
+    }
+  };
 
-      {/* Main Dashboard Navigation Header */}
-      <header classname="bg-[#152B30]/95 border-b border-[#1A363E] px-4 sm:px-6 py-3 sticky top-0 z-30 backdrop-blur-md">
-        <div classname="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
-          <div classname="flex items-center gap-3">
-            <button -="" ==""> onNavigate('/')}
-              className="p-1.5 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
-              title="Return to Home"
-            &gt;
-              <arrowleft classname="w-4 h-4">
-            </arrowleft></button>
-            <div classname="flex flex-col">
-              <span classname="font-extrabold text-base tracking-tight text-[#E8F2EE] flex items-center gap-1">
-                PipPilot<span classname="text-[#16A36A]">Ai</span>
-                <span classname="text-[10px] font-mono px-2 py-0.5 rounded bg-[#168BFF]/15 text-[#168BFF] border border-[#168BFF]/30 ml-2">
-                  DASHBOARD PREVIEW
-                </span>
-              </span>
-              <span classname="text-[10px] font-mono text-[#A9BEB5]">
-                Semi-Automated Intelligence Terminal
-              </span>
-            </div>
-          </div>
-
-          {/* Asset Switcher Bar */}
-          <div classname="flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
-            {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((asset) =&gt; (
-              <button -="" key="{asset}" ==""> {
-                  setSelectedAsset(asset);
-                  setApprovalStatus('PENDING');
-                }}
-                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
-                  selectedAsset === asset
-                    ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
-                    : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
-                }`}
-              &gt;
-                {asset}
-              </button>
-            ))}
-          </div>
-
-          {/* Timeframe Selector */}
-          <div classname="hidden sm:flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]">
-            {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) =&gt; (
-              <button -="" key="{tf}" ==""> setTimeframe(tf)}
-                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
-                  timeframe === tf
-                    ? 'bg-[#168BFF] text-[#E8F2EE]'
-                    : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
-                }`}
-              &gt;
-                {tf}
-              </button>
-            ))}
-          </div>
-
-          {/* User Auth Action or Request Access */}
-          {user ? (
-            <div classname="flex items-center gap-2">
-              <div classname="px-3 py-1.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs font-mono text-[#16A36A]">
-                Authenticated
-              </div>
-              <button -="" classname="px-3 py-1.5 rounded-xl bg-[#E05252]/10 hover:bg-[#E05252]/20 border border-[#E05252]/30 text-[#E05252] text-xs font-bold transition-colors">
-                Sign Out
-              </button>
-            </div>
-          ) : (
-            <button -="" ==""> onNavigate('/register')}
-              className="px-3.5 py-1.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold shadow-sm shadow-[#16A36A]/20 transition-all"
-            &gt;
-              Register / Sign In
-            </button>
-          )}
-        </div>
-      </header>
-
-      {/* Dashboard Body Grid */}
-      <main classname="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
-        {/* Left Column: Chart and Technical Confluence Overlays (7 cols) */}
-        <div classname="lg:col-span-7 space-y-5">
-          {/* Active Asset Info Strip */}
-          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
-            <div>
-              <div classname="flex items-center gap-2">
-                <h2 classname="text-lg font-bold font-mono text-[#E8F2EE]">{selectedAsset}</h2>
-                <span classname="text-xs font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] border border-[#16A36A]/30 font-semibold">
-                  {assetDetails.bias}
-                </span>
-                <span classname="text-xs font-mono text-[#A9BEB5]">{timeframe}</span>
-              </div>
-              <p classname="text-xs text-[#A9BEB5] font-mono mt-0.5">{assetDetails.name}</p>
-            </div>
-            <div classname="text-right">
-              <span classname="text-xl font-bold font-mono text-[#E8F2EE]">{assetDetails.price}</span>
-              <p classname="text-xs font-mono text-[#16A36A]">{assetDetails.change} Session</p>
-            </div>
-          </div>
-
-          {/* Interactive Chart Canvas */}
-          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 purple-glow-box space-y-3">
-            <div classname="flex items-center justify-between text-xs font-mono text-[#A9BEB5]">
-              <span classname="flex items-center gap-1.5">
-                <activity classname="w-3.5 h-3.5 text-[#168BFF]">
-                Structural Confluence View
-              </activity></span>
-              <div classname="flex items-center gap-2">
-                <span classname="w-2 h-2 rounded-full bg-[#16A36A]">
-                <span>Live Feed Emulated</span>
-              </span></div>
-            </div>
-
-            {/* SVG Visual Candlestick &amp; Concept Overlay */}
-            <div classname="relative h-64 sm:h-72 w-full bg-[#101B20] rounded-xl border border-[#1A363E] p-3 flex flex-col justify-between overflow-hidden">
-              {/* Overlays legend tags */}
-              <div classname="z-10 flex flex-wrap gap-2 text-[10px] font-mono">
-                <span classname="bg-[#9560E8]/20 border border-[#9560E8]/40 text-[#E8F2EE] px-2 py-0.5 rounded">
-                  Fair Value Gap (H1)
-                </span>
-                <span classname="bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] px-2 py-0.5 rounded">
-                  Liquidity Sweep Range
-                </span>
-                <span classname="bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] px-2 py-0.5 rounded">
-                  Bullish Order Block
-                </span>
-              </div>
-
-              {/* Chart SVG */}
-              <svg classname="w-full h-full relative z-0" viewBox="0 0 600 220" preserveAspectRatio="none">
-                <defs>
-                  <linearGradient id="chartFvg" x1="0" y1="0" x2="1" y2="0">
-                    <stop offset="0%" stopcolor="#9560E8" stopopacity="0.3"></stop>
-                    <stop offset="100%" stopcolor="#9560E8" stopopacity="0.05"></stop>
-                  </linearGradient>
-                </defs>
-
-                {/* Horizontal reference grid */}
-                <line x1="0" y1="50" x2="600" y2="50" stroke="#1A363E" strokewidth="1" strokedasharray="4 4"></line>
-                <line x1="0" y1="110" x2="600" y2="110" stroke="#1A363E" strokewidth="1" strokedasharray="4 4"></line>
-                <line x1="0" y1="170" x2="600" y2="170" stroke="#1A363E" strokewidth="1" strokedasharray="4 4"></line>
-
-                {/* Fair Value Gap Zone */}
-                <rect x="250" y="70" width="180" height="50" fill="url(#chartFvg)" stroke="#9560E8" strokewidth="1" strokedasharray="2 2"></rect>
-                <text x="255" y="65" fill="#9560E8" fontsize="10" fontfamily="monospace">ICT Fair Value Gap</text>
-
-                {/* Liquidity level */}
-                <line x1="20" y1="160" x2="580" y2="160" stroke="#E69A36" strokewidth="1" strokedasharray="3 3"></line>
-                <text x="30" y="155" fill="#E69A36" fontsize="9" fontfamily="monospace">Asian Session Low Swept</text>
-
-                {/* Candlestick sequence */}
-                {/* 1 */}
-                <line x1="50" y1="80" x2="50" y2="140" stroke="#E05252" strokewidth="1.5"></line>
-                <rect x="44" y="90" width="12" height="35" fill="#E05252" rx="1"></rect>
-                {/* 2 */}
-                <line x1="90" y1="110" x2="90" y2="175" stroke="#E05252" strokewidth="1.5"></line>
-                <rect x="84" y="120" width="12" height="42" fill="#E05252" rx="1"></rect>
-                {/* 3 sweep candle */}
-                <line x1="130" y1="105" x2="130" y2="185" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="124" y="110" width="12" height="30" fill="#16A36A" rx="1"></rect>
-                {/* 4 strong displacement */}
-                <line x1="180" y1="75" x2="180" y2="145" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="174" y="80" width="12" height="50" fill="#16A36A" rx="1"></rect>
-                {/* 5 */}
-                <line x1="230" y1="65" x2="230" y2="115" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="224" y="70" width="12" height="30" fill="#16A36A" rx="1"></rect>
-                {/* 6 pullback into FVG */}
-                <line x1="280" y1="85" x2="280" y2="125" stroke="#E05252" strokewidth="1.5"></line>
-                <rect x="274" y="90" width="12" height="25" fill="#E05252" rx="1"></rect>
-                {/* 7 bounce */}
-                <line x1="330" y1="60" x2="330" y2="110" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="324" y="65" width="12" height="35" fill="#16A36A" rx="1"></rect>
-                {/* 8 continuation */}
-                <line x1="380" y1="40" x2="380" y2="90" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="374" y="45" width="12" height="35" fill="#16A36A" rx="1"></rect>
-                {/* 9 pause */}
-                <line x1="430" y1="35" x2="430" y2="75" stroke="#E69A36" strokewidth="1.5"></line>
-                <rect x="424" y="40" width="12" height="20" fill="#E69A36" rx="1"></rect>
-                {/* 10 present */}
-                <line x1="480" y1="20" x2="480" y2="65" stroke="#16A36A" strokewidth="1.5"></line>
-                <rect x="474" y="25" width="12" height="30" fill="#16A36A" rx="1"></rect>
-
-                {/* Target projection */}
-                <line x1="486" y1="30" x2="570" y2="15" stroke="#168BFF" strokewidth="2" strokedasharray="3 3"></line>
-                <circle cx="570" cy="15" r="3" fill="#168BFF"></circle>
-              </svg>
-
-              <div classname="z-10 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]">
-                <span>CRT High: 2,654.00 | Low: 2,638.50</span>
-                <span classname="text-[#16A36A]">Market Regime: Trend Expansion</span>
-              </div>
-            </div>
-          </div>
-
-          {/* Economic News Calendar Bar */}
-          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 space-y-3">
-            <div classname="flex items-center justify-between text-xs font-mono">
-              <span classname="font-bold text-[#E8F2EE] flex items-center gap-1.5">
-                <calendar classname="w-4 h-4 text-[#168BFF]">
-                Scheduled Macro Catalysts
-              </calendar></span>
-              <span classname="text-[#A9BEB5]">Core 4 Tracking</span>
-            </div>
-
-            <div classname="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
-              <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                <span classname="text-[#E05252] font-bold block text-[10px]">CPI INFLATION</span>
-                <span classname="text-[#E8F2EE] font-bold">Wed 12:30</span>
-                <span classname="text-[10px] text-[#A9BEB5] block mt-0.5">Gold / DXY</span>
-              </div>
-              <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                <span classname="text-[#168BFF] font-bold block text-[10px]">PPI WHOLESALE</span>
-                <span classname="text-[#E8F2EE] font-bold">Thu 12:30</span>
-                <span classname="text-[10px] text-[#A9BEB5] block mt-0.5">Currencies</span>
-              </div>
-              <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                <span classname="text-[#E05252] font-bold block text-[10px]">NFP PAYROLLS</span>
-                <span classname="text-[#E8F2EE] font-bold">Fri 12:30</span>
-                <span classname="text-[10px] text-[#A9BEB5] block mt-0.5">High Impact</span>
-              </div>
-              <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                <span classname="text-[#9560E8] font-bold block text-[10px]">FOMC POLICY</span>
-                <span classname="text-[#E8F2EE] font-bold">Cycle Decision</span>
-                <span classname="text-[10px] text-[#A9BEB5] block mt-0.5">Market Wide</span>
-              </div>
-            </div>
-          </div>
-        </div>
-
-        {/* Right Column: AI Setup Action Card &amp; Risk Management (5 cols) */}
-        <div classname="lg:col-span-5 space-y-5">
-          {/* Mode switch: Setup vs Choppiness Demo */}
-          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-2 flex gap-2">
-            <button -="" ==""> {
-                setShowNoTradeDemo(false);
-                setApprovalStatus('PENDING');
-              }}
-              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
-                !showNoTradeDemo
-                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
-                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
-              }`}
-            &gt;
-              <cpu classname="w-3.5 h-3.5">
-              <span>Valid Setup Demo</span>
-            </cpu></button>
-            <button -="" ==""> setShowNoTradeDemo(true)}
-              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
-                showNoTradeDemo
-                  ? 'bg-[#E69A36] text-[#101B20] shadow-sm'
-                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
-              }`}
-            &gt;
-              <alerttriangle classname="w-3.5 h-3.5">
-              <span>'NO TRADE' Demo</span>
-            </alerttriangle></button>
-          </div>
-
-          {!showNoTradeDemo ? (
-            /* AI Setup Card with Semi-Automated Approval Simulator */
-            <div classname="bg-[#152B30] border border-[#16A36A]/40 rounded-2xl p-5 purple-glow-box space-y-4">
-              <div classname="flex items-center justify-between border-b border-[#1A363E] pb-3">
-                <span classname="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/40 uppercase">
-                  Pending Trader Review
-                </span>
-                <span classname="text-xs font-mono text-[#A9BEB5]">Signal #842</span>
-              </div>
-
-              <div>
-                <div classname="flex items-center justify-between">
-                  <h3 classname="text-base font-bold text-[#E8F2EE]">
-                    {selectedAsset} Bullish Opportunity
-                  </h3>
-                  <span classname="text-xs font-mono text-[#168BFF] font-bold">R:R 1 : 2.8</span>
-                </div>
-                <p classname="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
-                  Confluence detected: H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.
-                </p>
-              </div>
-
-              {/* Order Parameters */}
-              <div classname="grid grid-cols-3 gap-2 font-mono text-center">
-                <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                  <span classname="text-[10px] text-[#A9BEB5] block">Entry Level</span>
-                  <span classname="text-xs font-bold text-[#E8F2EE]">2,644.20</span>
-                </div>
-                <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                  <span classname="text-[10px] text-[#E05252] block">Stop Loss</span>
-                  <span classname="text-xs font-bold text-[#E8F2EE]">2,639.80</span>
-                </div>
-                <div classname="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]">
-                  <span classname="text-[10px] text-[#16A36A] block">Take Profit</span>
-                  <span classname="text-xs font-bold text-[#E8F2EE]">2,656.50</span>
-                </div>
-              </div>
-
-              {/* Human Approval Action State */}
-              <div classname="space-y-3 pt-2">
-                <div classname="text-xs font-mono text-[#A9BEB5] flex items-center justify-between">
-                  <span>Semi-Automated Workflow:</span>
-                  <span classname="font-bold text-[#E8F2EE]">Step 3: Trader Review</span>
-                </div>
-
-                {approvalStatus === 'PENDING' &amp;&amp; (
-                  <div classname="flex gap-2">
-                    <button -="" ==""> setApprovalStatus('APPROVED')}
-                      className="flex-1 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#16A36A]/20 transition-all"
-                    &gt;
-                      <check classname="w-4 h-4">
-                      <span>Approve Setup</span>
-                    </check></button>
-                    <button -="" ==""> setApprovalStatus('REJECTED')}
-                      className="flex-1 py-2.5 rounded-xl bg-[#101B20] hover:bg-[#1A363E] text-[#E05252] border border-[#E05252]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
-                    &gt;
-                      <xcircle classname="w-4 h-4">
-                      <span>Reject Setup</span>
-                    </xcircle></button>
-                  </div>
-                )}
-
-                {approvalStatus === 'APPROVED' &amp;&amp; (
-                  <div classname="space-y-2.5">
-                    <div classname="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#E8F2EE] space-y-1">
-                      <p classname="font-bold text-[#16A36A] flex items-center gap-1.5">
-                        <checkcircle2 classname="w-4 h-4">
-                        Trader Approval Granted
-                      </checkcircle2></p>
-                      <p classname="text-[11px] text-[#A9BEB5]">
-                        Setup is now passed to the planned MT5 execution component for independent validation.
-                      </p>
-                    </div>
-                    <button -="" ==""> setApprovalStatus('MT5_VALIDATED')}
-                      className="w-full py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#168BFF]/25 transition-all"
-                    &gt;
-                      <workflow classname="w-4 h-4">
-                      <span>Simulate MT5 Independent Validation</span>
-                    </workflow></button>
-                  </div>
-                )}
-
-                {approvalStatus === 'MT5_VALIDATED' &amp;&amp; (
-                  <div classname="p-3.5 rounded-xl bg-[#168BFF]/15 border border-[#168BFF]/40 text-xs space-y-2">
-                    <div classname="flex items-center justify-between text-[#168BFF] font-bold">
-                      <span classname="flex items-center gap-1.5">
-                        <checkcircle2 classname="w-4 h-4">
-                        MT5 Client Validated (Simulation)
-                      </checkcircle2></span>
-                      <span classname="text-[10px] font-mono">Spread: 1.2 pips OK</span>
-                    </div>
-                    <p classname="text-[11px] text-[#A9BEB5]">
-                      Broker connection verified. Lot sizing matches local risk limits. (In future production release, order will transmit directly to your MT5 terminal).
-                    </p>
-                    <button -="" ==""> setApprovalStatus('PENDING')}
-                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
-                    &gt;
-                      Reset Demo
-                    </button>
-                  </div>
-                )}
-
-                {approvalStatus === 'REJECTED' &amp;&amp; (
-                  <div classname="p-3 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] space-y-2">
-                    <p classname="font-bold text-[#E05252] flex items-center gap-1.5">
-                      <xcircle classname="w-4 h-4"> Setup Declined by Trader
-                    </xcircle></p>
-                    <p classname="text-[11px] text-[#A9BEB5]">
-                      Execution canceled. No instruction transmitted to MT5. Your capital remains untouched.
-                    </p>
-                    <button -="" ==""> setApprovalStatus('PENDING')}
-                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
-                    &gt;
-                      Reset Demo
-                    </button>
-                  </div>
-                )}
-              </div>
-            </div>
-          ) : (
-            /* 'NO TRADE' Protection Demo Card */
-            <div classname="bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 purple-glow-box space-y-4">
-              <div classname="flex items-center justify-between border-b border-[#1A363E] pb-3">
-                <span classname="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/40 uppercase flex items-center gap-1">
-                  <alerttriangle classname="w-3.5 h-3.5"> NO TRADE SIGNAL
-                </alerttriangle></span>
-                <span classname="text-xs font-mono text-[#E69A36]">Protection Active</span>
-              </div>
-
-              <div>
-                <h3 classname="text-base font-bold text-[#E8F2EE]">Capital Preservation Filter</h3>
-                <p classname="text-xs text-[#A9BEB5] mt-1 leading-relaxed">
-                  Market conditions currently fail our institutional confluence requirement. The engine prevents impulsive trade entry when probability is low.
-                </p>
-              </div>
-
-              <div classname="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-2 text-xs font-mono">
-                <div classname="flex justify-between">
-                  <span classname="text-[#A9BEB5]">Choppiness Index</span>
-                  <span classname="text-[#E69A36] font-bold">64.2 / 100 (High Noise)</span>
-                </div>
-                <div classname="flex justify-between">
-                  <span classname="text-[#A9BEB5]">Orderflow Alignment</span>
-                  <span classname="text-[#E05252] font-bold">Conflicted (M15 vs H4)</span>
-                </div>
-                <div classname="flex justify-between">
-                  <span classname="text-[#A9BEB5]">Economic Proximity</span>
-                  <span classname="text-[#E8F2EE]">FOMC within 2 hours</span>
-                </div>
-              </div>
-
-              <div classname="p-3 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/30 text-xs text-[#A9BEB5]">
-                <strong classname="text-[#E8F2EE] block mb-1">Why NO TRADE is a feature:</strong>
-                Amateur systems produce continuous trades to keep users engaged. PipPilotAi protects capital by rejecting substandard setups.
-              </div>
-            </div>
-          )}
-
-          {/* Integrated Risk Calculator */}
-          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
-            <div classname="flex items-center justify-between border-b border-[#1A363E] pb-3">
-              <span classname="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
-                <sliders classname="w-4 h-4 text-[#16A36A]">
-                Live Risk Calculator
-              </sliders></span>
-              <span classname="text-xs font-mono text-[#16A36A] font-bold">
-                {calculatedLotSize} Lots
-              </span>
-            </div>
-
-            <div classname="space-y-3 font-mono text-xs">
-              <div>
-                <div classname="flex justify-between mb-1">
-                  <span classname="text-[#A9BEB5]">Account Size</span>
-                  <span classname="text-[#E8F2EE] font-bold">${accountBalance.toLocaleString()}</span>
-                </div>
-                <input -="" type="range" min="{5000}" max="{100000}" step="{5000}" value="{accountBalance}" ==""> setAccountBalance(Number(e.target.value))}
-                  className="w-full accent-[#16A36A]"
-                /&gt;
-              </div>
-
-              <div classname="grid grid-cols-2 gap-2 text-center pt-1">
-                <div classname="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
-                  <span classname="text-[10px] text-[#A9BEB5] block">Risk Percent</span>
-                  <span classname="text-xs font-bold text-[#168BFF]">{riskPercent}%</span>
-                </div>
-                <div classname="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]">
-                  <span classname="text-[10px] text-[#A9BEB5] block">Risk ($)</span>
-                  <span classname="text-xs font-bold text-[#E05252]">${riskAmount.toFixed(0)}</span>
-                </div>
-              </div>
-            </div>
-          </div>
-        </div>
-      </main>
-    </workspacedashboardpage></helpsupportpage></settingspage></backtestingpage></signalhistorypage></mt5connectionspage></riskmanagementpage></newsintelligencepage></strategiespage></tradingpage></pendingapprovalguard></workspaceaccessgate></workspaceaccessgate></dashboardpreviewpageprops></div>
+  return (
+    <workspacelayout currentroute="{currentRoute}">
+      {renderWorkspacePage()}
+    </workspacelayout>
   );
 };
diff --git a/src/components/workspace/WorkspaceAccessGate.tsx b/src/components/workspace/WorkspaceAccessGate.tsx
new file mode 100644
index 0000000..be71ea5
--- /dev/null
+++ b/src/components/workspace/WorkspaceAccessGate.tsx
@@ -0,0 +1,235 @@
+import React from 'react';
+import {
+  Compass,
+  Lock,
+  LogIn,
+  UserPlus,
+  ArrowLeft,
+  ShieldAlert,
+  Clock,
+  MailCheck,
+  HelpCircle,
+  LogOut,
+  ShieldCheck,
+} from 'lucide-react';
+import { NavigationRoute } from '../../types';
+import { useAuth } from '../../context/AuthContext';
+
+interface WorkspaceAccessGateProps {
+  mode: 'unauthenticated' | 'unverified';
+  attemptedRoute: NavigationRoute;
+  onNavigate: (route: NavigationRoute) =&gt; void;
+}
+
+export const WorkspaceAccessGate: React.FC<workspaceaccessgateprops> = ({
+  mode,
+  attemptedRoute,
+  onNavigate,
+}) =&gt; {
+  const { user, logout, isConfigured } = useAuth();
+
+  const handleSignOut = async () =&gt; {
+    await logout();
+    onNavigate('/');
+  };
+
+  return (
+    <div classname="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-grid-pattern">
+      {/* Top Bar */}
+      <header classname="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#152B30] bg-[#101B20]/90">
+        <button +="" ==""> onNavigate('/')}
+          className="flex items-center gap-2.5 group text-left focus:outline-none"
+        &gt;
+          <div classname="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
+            <div classname="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
+              <compass classname="w-4 h-4 text-[#16A36A]">
+            </compass></div>
+          </div>
+          <span classname="font-extrabold text-base tracking-tight text-[#E8F2EE]">
+            PipPilot<span classname="text-[#16A36A]">Ai</span>
+          </span>
+        </button>
+
+        <button +="" ==""> onNavigate('/')}
+          className="flex items-center gap-1.5 text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
+        &gt;
+          <arrowleft classname="w-3.5 h-3.5">
+          <span>Public Homepage</span>
+        </arrowleft></button>
+      </header>
+
+      {/* Main Guard Card */}
+      <main classname="flex-1 flex items-center justify-center p-4 sm:p-8">
+        <div classname="max-w-lg w-full bg-[#152B30] border border-[#16A36A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl purple-glow-box space-y-6 relative overflow-hidden">
+          <div classname="absolute top-0 right-0 w-56 h-56 bg-[#168BFF]/10 blur-[80px] rounded-full pointer-events-none">
+          <div classname="absolute bottom-0 left-0 w-56 h-56 bg-[#9560E8]/10 blur-[80px] rounded-full pointer-events-none">
+
+          <div classname="relative z-10 space-y-5 text-center">
+            <div +="" classname="{`w-14" h-14="" rounded-2xl="" flex="" items-center="" justify-center="" mx-auto="" border="" ${="" mode="==" 'unauthenticated'="" ?="" 'bg-[#168bff]="" 15="" border-[#168bff]="" 40="" text-[#168bff]'="" :="" 'bg-[#e69a36]="" border-[#e69a36]="" text-[#e69a36]'="" }`}="">
+              {mode === 'unauthenticated' ? (
+                <lock classname="w-7 h-7">
+              ) : (
+                <mailcheck classname="w-7 h-7">
+              )}
+            </mailcheck></lock></div>
+
+            <div classname="space-y-2">
+              <span classname="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#101B20] border border-[#1A363E] text-[#168BFF]">
+                Protected Workspace · {attemptedRoute}
+              </span>
+              <h1 classname="text-2xl font-extrabold text-[#E8F2EE] purple-glow-text">
+                {mode === 'unauthenticated'
+                  ? 'Authentication Required'
+                  : 'Email Verification Required'}
+              </h1>
+              <p classname="text-xs sm:text-sm text-[#A9BEB5] leading-relaxed">
+                {mode === 'unauthenticated'
+                  ? 'The PipPilotAi trading workspace is restricted to authenticated members. Please sign in or request platform access to continue.'
+                  : `Your account (${user?.email}) has not verified its email address yet. Verify your email before entering the workspace.`}
+              </p>
+            </div>
+
+            {!isConfigured &amp;&amp; mode === 'unauthenticated' &amp;&amp; (
+              <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#E69A36]/40 text-left text-xs text-[#A9BEB5] flex items-start gap-2.5">
+                <shieldalert classname="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5">
+                <span>
+                  Supabase environment credentials are not configured in this environment, so authenticated sessions cannot be created until{' '}
+                  <code classname="font-mono text-[#E8F2EE]">VITE_SUPABASE_URL</code> and{' '}
+                  <code classname="font-mono text-[#E8F2EE]">VITE_SUPABASE_ANON_KEY</code> are provided.
+                </span>
+              </shieldalert></div>
+            )}
+
+            <div classname="space-y-2.5 pt-1">
+              {mode === 'unauthenticated' ? (
+                &lt;&gt;
+                  <button +="" ==""> onNavigate('/login')}
+                    className="w-full py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-lg shadow-[#16A36A]/25 transition-all flex items-center justify-center gap-2"
+                  &gt;
+                    <login classname="w-4 h-4">
+                    <span>Sign In to Workspace</span>
+                  </login></button>
+                  <button +="" ==""> onNavigate('/register')}
+                    className="w-full py-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-[#E8F2EE] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
+                  &gt;
+                    <userplus classname="w-4 h-4 text-[#168BFF]">
+                    <span>Get Access / Register</span>
+                  </userplus></button>
+                
+              ) : (
+                &lt;&gt;
+                  <button +="" ==""> onNavigate('/verify-email')}
+                    className="w-full py-3.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] font-bold text-sm transition-all flex items-center justify-center gap-2"
+                  &gt;
+                    <mailcheck classname="w-4 h-4">
+                    <span>Verify Email Address</span>
+                  </mailcheck></button>
+                  <button +="" classname="w-full py-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#E05252]/30 text-[#E05252] font-semibold text-xs transition-colors flex items-center justify-center gap-2">
+                    <logout classname="w-4 h-4">
+                    <span>Sign Out</span>
+                  </logout></button>
+                
+              )}
+
+              <button +="" ==""> onNavigate('/')}
+                className="w-full py-2.5 text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors flex items-center justify-center gap-1.5"
+              &gt;
+                <arrowleft classname="w-3.5 h-3.5">
+                <span>Return to Public Marketing Page</span>
+              </arrowleft></button>
+            </div>
+          </div>
+        </div>
+      </div></div></main>
+    </div>
+  );
+};
+
+interface PendingApprovalGuardProps {
+  featureName: string;
+  onNavigate: (route: NavigationRoute) =&gt; void;
+}
+
+export const PendingApprovalGuard: React.FC<pendingapprovalguardprops> = ({
+  featureName,
+  onNavigate,
+}) =&gt; {
+  const { user, userRole } = useAuth();
+
+  return (
+    <div classname="max-w-2xl mx-auto py-8 px-2">
+      <div classname="bg-[#152B30] border border-[#9560E8]/40 rounded-2xl p-6 sm:p-8 purple-glow-box space-y-5">
+        <div classname="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-4">
+          <span classname="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#E69A36]/15 text-[#E69A36] border border-[#E69A36]/30">
+            <clock classname="w-3.5 h-3.5">
+            MEMBERSHIP PENDING APPROVAL
+          </clock></span>
+          <span classname="text-[11px] font-mono text-[#A9BEB5]">
+            Role: <strong classname="text-[#E8F2EE] uppercase">{userRole}</strong>
+          </span>
+        </div>
+
+        <div classname="space-y-2">
+          <h2 classname="text-xl sm:text-2xl font-extrabold text-[#E8F2EE] purple-glow-text">
+            {featureName} Requires Approved Membership
+          </h2>
+          <p classname="text-xs sm:text-sm text-[#A9BEB5] leading-relaxed">
+            Your email (<span classname="font-mono text-[#E8F2EE]">{user?.email}</span>) is verified, confirming identity (Onboarding Step 2). Protected trading modules are unlocked only after administrator cohort approval (Onboarding Step 3).
+          </p>
+        </div>
+
+        <div classname="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#16A36A] font-bold flex items-center gap-1.5">
+              <shieldcheck classname="w-4 h-4">
+              Identity Verified
+            </shieldcheck></span>
+            <p classname="text-[11px] text-[#A9BEB5]">
+              Supabase authentication and email verification are active for your profile.
+            </p>
+          </div>
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#9560E8] font-bold flex items-center gap-1.5">
+              <lock classname="w-4 h-4">
+              Access Separation Enforced
+            </lock></span>
+            <p classname="text-[11px] text-[#A9BEB5]">
+              Pending trader accounts cannot access protected trading, strategy, or execution features.
+            </p>
+          </div>
+        </div>
+
+        <div classname="flex flex-col sm:flex-row gap-3 pt-2">
+          <button +="" ==""> onNavigate('/app')}
+            className="flex-1 py-3 px-4 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors flex items-center justify-center gap-2"
+          &gt;
+            <span>Return to Dashboard Overview</span>
+          </button>
+          <button +="" ==""> onNavigate('/app/support')}
+            className="flex-1 py-3 px-4 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-[#E8F2EE] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
+          &gt;
+            <helpcircle classname="w-4 h-4 text-[#168BFF]">
+            <span>Help and Support</span>
+          </helpcircle></button>
+        </div>
+      </div>
+    </div>
+  );
+};
diff --git a/src/components/workspace/WorkspaceLayout.tsx b/src/components/workspace/WorkspaceLayout.tsx
new file mode 100644
index 0000000..d708eb8
--- /dev/null
+++ b/src/components/workspace/WorkspaceLayout.tsx
@@ -0,0 +1,445 @@
+import React, { useEffect, useRef, useState } from 'react';
+import {
+  Activity,
+  ArrowLeft,
+  ChevronLeft,
+  ChevronRight,
+  Clock3,
+  Compass,
+  FlaskConical,
+  HelpCircle,
+  LayoutDashboard,
+  Lock,
+  LogOut,
+  Menu,
+  Newspaper,
+  Plug,
+  Settings,
+  Shield,
+  Sparkles,
+  User,
+  X,
+  type LucideIcon,
+} from 'lucide-react';
+import { NavigationRoute, WorkspaceRoute } from '../../types';
+import { useAuth } from '../../context/AuthContext';
+
+export interface WorkspaceNavItem {
+  label: string;
+  route: WorkspaceRoute;
+  icon: LucideIcon;
+  requiresApproval: boolean;
+}
+
+export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
+  { label: 'Dashboard', route: '/app', icon: LayoutDashboard, requiresApproval: false },
+  { label: 'Trading', route: '/app/trading', icon: Activity, requiresApproval: true },
+  { label: 'Strategies', route: '/app/strategies', icon: Sparkles, requiresApproval: true },
+  { label: 'News Intelligence', route: '/app/news', icon: Newspaper, requiresApproval: true },
+  { label: 'Risk Management', route: '/app/risk', icon: Shield, requiresApproval: true },
+  { label: 'MT5 Connections', route: '/app/mt5', icon: Plug, requiresApproval: true },
+  { label: 'Signal History', route: '/app/signals', icon: Clock3, requiresApproval: true },
+  { label: 'Backtesting', route: '/app/backtesting', icon: FlaskConical, requiresApproval: true },
+  { label: 'Settings', route: '/app/settings', icon: Settings, requiresApproval: false },
+  { label: 'Help and Support', route: '/app/support', icon: HelpCircle, requiresApproval: false },
+];
+
+interface WorkspaceLayoutProps {
+  currentRoute: WorkspaceRoute;
+  onNavigate: (route: NavigationRoute) =&gt; void;
+  children: React.ReactNode;
+}
+
+export const WorkspaceLayout: React.FC<workspacelayoutprops> = ({
+  currentRoute,
+  onNavigate,
+  children,
+}) =&gt; {
+  const { user, emailVerified, membershipStatus, userRole, isApproved, logout } = useAuth();
+  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
+  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
+  const closeButtonRef = useRef<htmlbuttonelement>(null);
+  const menuButtonRef = useRef<htmlbuttonelement>(null);
+
+  const activeItem =
+    WORKSPACE_NAV_ITEMS.find((item) =&gt; item.route === currentRoute) ?? WORKSPACE_NAV_ITEMS[0];
+
+  const handleSignOut = async () =&gt; {
+    setMobileDrawerOpen(false);
+    await logout();
+    onNavigate('/');
+  };
+
+  const handleSelectNav = (route: WorkspaceRoute) =&gt; {
+    setMobileDrawerOpen(false);
+    onNavigate(route);
+  };
+
+  // Close mobile drawer on Escape and lock body scroll while open
+  useEffect(() =&gt; {
+    if (!mobileDrawerOpen) return;
+    const prevOverflow = document.body.style.overflow;
+    document.body.style.overflow = 'hidden';
+
+    const onKeyDown = (e: KeyboardEvent) =&gt; {
+      if (e.key === 'Escape') {
+        setMobileDrawerOpen(false);
+      }
+    };
+    window.addEventListener('keydown', onKeyDown);
+    window.requestAnimationFrame(() =&gt; closeButtonRef.current?.focus());
+
+    return () =&gt; {
+      document.body.style.overflow = prevOverflow;
+      window.removeEventListener('keydown', onKeyDown);
+      window.requestAnimationFrame(() =&gt; menuButtonRef.current?.focus());
+    };
+  }, [mobileDrawerOpen]);
+
+  const renderNavItem = (item: WorkspaceNavItem, compact: boolean, isMobile: boolean) =&gt; {
+    const Icon = item.icon;
+    const isActive = currentRoute === item.route;
+    const isLocked = item.requiresApproval &amp;&amp; !isApproved;
+
+    return (
+      <button +="" key="{`${isMobile" ?="" 'mobile'="" :="" 'desktop'}-${item.route}`}="" type="button" ==""> handleSelectNav(item.route)}
+        aria-current={isActive ? 'page' : undefined}
+        title={compact ? item.label : undefined}
+        data-testid={`nav-${isMobile ? 'mobile' : 'desktop'}-${item.route.replace('/app/', '').replace('/app', 'dashboard')}`}
+        className={`w-full flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-xs font-semibold transition-all text-left border ${
+          isActive
+            ? 'bg-[#16A36A]/15 text-[#16A36A] border-[#16A36A]/35 shadow-sm'
+            : 'border-transparent text-[#A9BEB5] hover:bg-[#101B20]/70 hover:text-[#E8F2EE]'
+        } ${compact ? 'justify-center px-2' : ''}`}
+      &gt;
+        <icon +="" classname="{`w-4" h-4="" shrink-0="" ${isactive="" ?="" 'text-[#16a36a]'="" :="" 'text-[#a9beb5]'}`}="" aria-hidden="true">
+        {!compact &amp;&amp; (
+          &lt;&gt;
+            <span classname="truncate flex-1">{item.label}</span>
+            {isLocked &amp;&amp; (
+              <lock +="" classname="w-3.5 h-3.5 text-[#E69A36] shrink-0" aria-label="Approval required">
+            )}
+            {isActive &amp;&amp; !isLocked &amp;&amp; (
+              <span classname="w-1.5 h-1.5 rounded-full bg-[#16A36A] shrink-0">
+            )}
+          
+        )}
+      </span></lock></icon></button>
+    );
+  };
+
+  return (
+    <div classname="min-h-screen bg-[#101B20] text-[#E8F2EE] flex font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
+      {/* Persistent Collapsible Left Sidebar (Desktop lg+) */}
+      <aside +="" aria-label="Workspace navigation" classname="{`hidden" lg:flex="" flex-col="" fixed="" inset-y-0="" left-0="" z-30="" bg-[#152b30]="" border-r="" border-[#1a363e]="" transition-all="" duration-200="" ${="" sidebarcollapsed="" ?="" 'w-[76px]'="" :="" 'w-64'="" }`}="">
+        {/* Brand Header + Collapse Toggle */}
+        <div classname="h-16 px-4 border-b border-[#1A363E] flex items-center justify-between gap-2">
+          <button +="" type="button" ==""> handleSelectNav('/app')}
+            className="flex items-center gap-2.5 text-left focus:outline-none min-w-0"
+            aria-label="PipPilotAi Dashboard"
+          &gt;
+            <div classname="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px] shrink-0">
+              <div classname="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
+                <compass classname="w-4 h-4 text-[#16A36A]">
+              </compass></div>
+            </div>
+            {!sidebarCollapsed &amp;&amp; (
+              <div classname="flex flex-col min-w-0">
+                <span classname="font-extrabold text-base tracking-tight text-[#E8F2EE] truncate">
+                  PipPilot<span classname="text-[#16A36A]">Ai</span>
+                </span>
+                <span classname="text-[9px] font-mono text-[#A9BEB5] uppercase tracking-wider truncate">
+                  Workspace
+                </span>
+              </div>
+            )}
+          </button>
+
+          <button +="" type="button" ==""> setSidebarCollapsed((prev) =&gt; !prev)}
+            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
+            data-testid="button-collapse-sidebar"
+            className="p-1.5 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors shrink-0"
+          &gt;
+            {sidebarCollapsed ? (
+              <chevronright classname="w-4 h-4">
+            ) : (
+              <chevronleft classname="w-4 h-4">
+            )}
+          </chevronleft></chevronright></button>
+        </div>
+
+        {/* 10 Navigation Items */}
+        <nav classname="flex-1 overflow-y-auto px-3 py-4 space-y-1">
+          {!sidebarCollapsed &amp;&amp; (
+            <p classname="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#A9BEB5]/70">
+              Platform Modules
+            </p>
+          )}
+          {WORKSPACE_NAV_ITEMS.map((item) =&gt; renderNavItem(item, sidebarCollapsed, false))}
+        </nav>
+
+        {/* Sidebar Footer Status */}
+        <div classname="p-3 border-t border-[#1A363E] space-y-2">
+          {!sidebarCollapsed &amp;&amp; (
+            <div classname="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5 text-[11px]">
+              <div classname="flex items-center justify-between font-mono">
+                <span classname="text-[#A9BEB5]">Access</span>
+                <span +="" classname="{`font-bold" ${="" isapproved="" ?="" 'text-[#16a36a]'="" :="" 'text-[#e69a36]'="" }`}="">
+                  {isApproved ? 'APPROVED' : 'PENDING'}
+                </span>
+              </div>
+              <div classname="flex items-center justify-between font-mono">
+                <span classname="text-[#A9BEB5]">MT5 Bridge</span>
+                <span classname="text-[#E69A36] font-semibold">In Dev</span>
+              </div>
+            </div>
+          )}
+
+          <button +="" type="button" ==""> onNavigate('/')}
+            title="Public Homepage"
+            className={`w-full flex items-center gap-2.5 rounded-xl px-3 min-h-[40px] text-xs font-semibold text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#101B20] transition-colors ${
+              sidebarCollapsed ? 'justify-center px-2' : ''
+            }`}
+          &gt;
+            <arrowleft classname="w-4 h-4 shrink-0 text-[#16A36A]">
+            {!sidebarCollapsed &amp;&amp; <span>Public Homepage</span>}
+          </arrowleft></button>
+        </div>
+      </aside>
+
+      {/* Main Content Wrapper */}
+      <div +="" classname="{`flex-1" flex="" flex-col="" min-w-0="" transition-all="" duration-200="" ${="" sidebarcollapsed="" ?="" 'lg:pl-[76px]'="" :="" 'lg:pl-64'="" }`}="">
+        {/* Top Authentication &amp; Membership Strip */}
+        <div classname="bg-[#152B30] border-b border-[#1A363E] px-3 sm:px-6 py-2">
+          <div classname="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
+            <div classname="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
+              <span classname="font-mono text-[#E8F2EE] font-semibold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
+                <user classname="w-3.5 h-3.5 text-[#16A36A] shrink-0">
+                <span classname="truncate">{user?.email}</span>
+              </user></span>
+              <span +="" classname="{`px-2" py-0.5="" rounded="" text-[10px]="" font-mono="" font-bold="" ${="" emailverified="" ?="" 'bg-[#16a36a]="" 20="" text-[#16a36a]'="" :="" 'bg-[#e69a36]="" text-[#e69a36]'="" }`}="">
+                {emailVerified ? 'Verified' : 'Unverified'}
+              </span>
+              <span +="" classname="{`px-2" py-0.5="" rounded="" text-[10px]="" font-mono="" font-bold="" border="" ${="" isapproved="" ?="" 'bg-[#16a36a]="" 15="" text-[#16a36a]="" border-[#16a36a]="" 35'="" :="" 'bg-[#9560e8]="" 20="" text-[#e8f2ee]="" border-[#9560e8]="" }`}="">
+                {membershipStatus === 'active'
+                  ? 'Membership: Active'
+                  : 'Membership: Pending Admin Approval'}
+              </span>
+              <span classname="px-2 py-0.5 rounded text-[10px] font-mono bg-[#101B20] border border-[#1A363E] text-[#168BFF] uppercase">
+                {userRole}
+              </span>
+            </div>
+
+            <div classname="flex items-center gap-3 shrink-0">
+              <button +="" type="button" ==""> onNavigate('/')}
+                className="text-xs font-bold text-[#16A36A] hover:text-[#E8F2EE] transition-colors hidden sm:flex items-center gap-1"
+              &gt;
+                <arrowleft classname="w-3.5 h-3.5">
+                <span>Public Homepage</span>
+              </arrowleft></button>
+              <button +="" type="button" classname="text-xs font-bold text-[#E05252] hover:underline flex items-center gap-1">
+                <logout classname="w-3.5 h-3.5">
+                <span>Sign Out</span>
+              </logout></button>
+            </div>
+          </div>
+        </div>
+
+        {/* Sticky Top Navigation Header */}
+        <header classname="bg-[#152B30]/95 border-b border-[#1A363E] px-3 sm:px-6 py-3 sticky top-0 z-20 backdrop-blur-md">
+          <div classname="max-w-7xl mx-auto flex items-center justify-between gap-3">
+            {/* Left Side: Mobile Menu Button + Section Title */}
+            <div classname="flex items-center gap-3 min-w-0">
+              <button +="" ref="{menuButtonRef}" type="button" ==""> setMobileDrawerOpen(true)}
+                aria-label="Open left navigation menu"
+                aria-haspopup="dialog"
+                aria-controls="workspace-mobile-drawer"
+                aria-expanded={mobileDrawerOpen}
+                data-testid="button-open-left-drawer"
+                className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] hover:border-[#16A36A]/50 transition-colors shrink-0"
+              &gt;
+                <menu classname="w-5 h-5">
+              </menu></button>
+
+              <div classname="flex items-center gap-2.5 lg:hidden shrink-0">
+                <div classname="w-7 h-7 rounded-lg bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
+                  <div classname="w-full h-full bg-[#101B20] rounded-[6px] flex items-center justify-center">
+                    <compass classname="w-3.5 h-3.5 text-[#16A36A]">
+                  </compass></div>
+                </div>
+              </div>
+
+              <div classname="min-w-0">
+                <div classname="flex items-center gap-2">
+                  <h1 classname="text-sm sm:text-base font-extrabold text-[#E8F2EE] purple-glow-text truncate">
+                    {activeItem.label}
+                  </h1>
+                  <span classname="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#168BFF]/15 text-[#168BFF] border border-[#168BFF]/30">
+                    {activeItem.route}
+                  </span>
+                </div>
+                <p classname="text-[10px] font-mono text-[#A9BEB5] truncate">
+                  PipPilotAi Semi-Automated Intelligence Terminal
+                </p>
+              </div>
+            </div>
+
+            {/* Right Side Quick Status */}
+            <div classname="flex items-center gap-2 shrink-0">
+              <span classname="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101B20] border border-[#1A363E] text-[11px] font-mono text-[#A9BEB5]">
+                <span classname="w-1.5 h-1.5 rounded-full bg-[#E69A36]">
+                MT5: Disconnected
+              </span>
+              <button +="" type="button" ==""> onNavigate('/app/trading')}
+                className="px-3 py-2 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors hidden sm:inline-flex items-center gap-1.5"
+              &gt;
+                <activity classname="w-3.5 h-3.5">
+                <span>Trading</span>
+              </activity></button>
+            </span></div>
+          </div>
+        </header>
+
+        {/* Main Routed Workspace Content */}
+        <main classname="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
+          {children}
+        </main>
+      </div>
+
+      {/* Mobile Left-Side Navigation Drawer */}
+      {mobileDrawerOpen &amp;&amp; (
+        <div classname="fixed inset-0 z-50 lg:hidden" role="presentation">
+          {/* Backdrop */}
+          <button +="" type="button" aria-label="Close navigation drawer" ==""> setMobileDrawerOpen(false)}
+            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
+          /&gt;
+
+          {/* Left Slide-In Panel */}
+          <aside +="" id="workspace-mobile-drawer" role="dialog" aria-modal="true" aria-label="Workspace left navigation" classname="absolute inset-y-0 left-0 w-[min(296px,85vw)] bg-[#152B30] border-r border-[#1A363E] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
+            {/* Drawer Header */}
+            <div classname="px-4 py-3.5 border-b border-[#1A363E] bg-[#101B20]/80 flex items-center justify-between gap-2">
+              </div></aside></button><button +="" type="button" ==""> handleSelectNav('/app')}
+                className="flex items-center gap-2.5 text-left"
+              &gt;
+                <div classname="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px]">
+                  <div classname="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
+                    <compass classname="w-4 h-4 text-[#16A36A]">
+                  </compass></div>
+                </div>
+                <div classname="flex flex-col">
+                  <span classname="font-extrabold text-base tracking-tight text-[#E8F2EE]">
+                    PipPilot<span classname="text-[#16A36A]">Ai</span>
+                  </span>
+                  <span classname="text-[9px] font-mono text-[#A9BEB5] uppercase tracking-wider">
+                    Workspace Menu
+                  </span>
+                </div>
+              </button>
+
+              <button +="" ref="{closeButtonRef}" type="button" ==""> setMobileDrawerOpen(false)}
+                aria-label="Close navigation menu"
+                data-testid="button-close-left-drawer"
+                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#A9BEB5] hover:text-[#E8F2EE] hover:bg-[#1A363E] transition-colors"
+              &gt;
+                <x classname="w-5 h-5">
+              </x></button>
+            </div>
+
+            {/* Navigation Items */}
+            <nav classname="flex-1 overflow-y-auto px-3 py-3 space-y-1">
+              {WORKSPACE_NAV_ITEMS.map((item) =&gt; renderNavItem(item, false, true))}
+            </nav>
+
+            {/* Drawer Footer */}
+            <div classname="p-3 border-t border-[#1A363E] bg-[#101B20]/60 space-y-2">
+              <button +="" type="button" ==""> {
+                  setMobileDrawerOpen(false);
+                  onNavigate('/');
+                }}
+                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs font-semibold text-[#E8F2EE] hover:border-[#16A36A]/50 transition-colors"
+              &gt;
+                <arrowleft classname="w-4 h-4 text-[#16A36A]">
+                <span>Public Homepage</span>
+              </arrowleft></button>
+              <button +="" type="button" classname="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#E05252]/10 border border-[#E05252]/30 text-xs font-bold text-[#E05252] transition-colors">
+                <logout classname="w-4 h-4">
+                <span>Sign Out</span>
+              </logout></button>
+            </div>
+          
+        </div>
+      )}
+    </htmlbuttonelement></htmlbuttonelement></workspacelayoutprops></pendingapprovalguardprops></workspaceaccessgateprops></div>
+  );
+};
diff --git a/src/context/AuthContext.tsx b/src/context/AuthContext.tsx
index 8aeb40e..1062cc9 100644
--- a/src/context/AuthContext.tsx
+++ b/src/context/AuthContext.tsx
@@ -10,7 +10,7 @@ import {
   resendVerificationEmail,
   AuthResponse 
 } from '../services/auth';
-import { MembershipApprovalStatus } from '../types';
+import { MembershipApprovalStatus, UserRole } from '../types';
 
 interface AuthContextType {
   user: User | null;
@@ -19,6 +19,9 @@ interface AuthContextType {
   isConfigured: boolean;
   emailVerified: boolean;
   membershipStatus: MembershipApprovalStatus;
+  userRole: UserRole;
+  isApproved: boolean;
+  isAdmin: boolean;
   login: (email: string, password: string) =&gt; Promise<authresponse<{ user:="" user;="" session:="" session="" }="">&gt;;
   register: (email: string, password: string) =&gt; Promise<authresponse<{ user:="" user="" |="" null;="" session:="" session="" null="" }="">&gt;;
   logout: () =&gt; Promise<void>;
@@ -35,17 +38,25 @@ export const AuthProvider: React.FC&lt;{ children: React.ReactNode }&gt; = ({ children
   const [session, setSession] = useState<session |="" null="">(null);
   const [isLoading, setIsLoading] = useState<boolean>(true);
 
-  // Requirement 7: Membership access separation!
-  // In Stage 4, all verified accounts are 'pending_approval' by administrator.
-  // Email verification is separate from administrator membership approval.
+  // Membership access separation:
+  // Email verification confirms identity; administrator approval is stored in server-controlled app_metadata.
+  // Pending users must not gain premium trading access; admin role remains separate from ordinary users.
   const emailVerified = Boolean(user &amp;&amp; user.email_confirmed_at);
+  const userRole: UserRole = useMemo(() =&gt; {
+    if (user?.app_metadata?.role === 'admin') return 'admin';
+    return 'trader';
+  }, [user]);
+
   const membershipStatus: MembershipApprovalStatus = useMemo(() =&gt; {
     if (!user) return 'none';
-    // When user email is verified, membership status enters 'pending_approval'
-    // In future stages, administrator will grant 'active' status upon external verification.
-    return emailVerified ? 'pending_approval' : 'none';
+    if (!emailVerified) return 'none';
+    if (user.app_metadata?.membership_status === 'active') return 'active';
+    return 'pending_approval';
   }, [user, emailVerified]);
 
+  const isApproved = membershipStatus === 'active';
+  const isAdmin = userRole === 'admin';
+
   const refreshSession = async () =&gt; {
     if (!isSupabaseConfigured) {
       setIsLoading(false);
@@ -126,6 +137,9 @@ export const AuthProvider: React.FC&lt;{ children: React.ReactNode }&gt; = ({ children
     isConfigured: isSupabaseConfigured,
     emailVerified,
     membershipStatus,
+    userRole,
+    isApproved,
+    isAdmin,
     login,
     register,
     logout,
diff --git a/src/data/workspaceData.ts b/src/data/workspaceData.ts
new file mode 100644
index 0000000..4329f6d
--- /dev/null
+++ b/src/data/workspaceData.ts
@@ -0,0 +1,398 @@
+import { EconomicEvent, TradingSignal } from '../types';
+
+export const MAX_SHARED_SIGNALS = 10;
+
+export type AssetSymbol = 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'US30';
+export type TimeframeOption = 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
+
+export interface AssetOverview {
+  symbol: AssetSymbol;
+  name: string;
+  price: string;
+  change: string;
+  positive: boolean;
+  bias: string;
+  crtHigh: string;
+  crtLow: string;
+  regime: string;
+  entry: string;
+  stopLoss: string;
+  takeProfit: string;
+  riskReward: string;
+  confluenceNote: string;
+}
+
+export const SAMPLE_WATCHLIST: AssetOverview[] = [
+  {
+    symbol: 'XAU/USD',
+    name: 'Gold Spot / USD',
+    price: '2,648.40',
+    change: '+0.64%',
+    positive: true,
+    bias: 'Bullish SMC',
+    crtHigh: '2,654.00',
+    crtLow: '2,638.50',
+    regime: 'Trend Expansion',
+    entry: '2,644.20',
+    stopLoss: '2,639.80',
+    takeProfit: '2,656.50',
+    riskReward: '1 : 2.8',
+    confluenceNote:
+      'H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.',
+  },
+  {
+    symbol: 'EUR/USD',
+    name: 'Euro / US Dollar',
+    price: '1.0842',
+    change: '-0.12%',
+    positive: false,
+    bias: 'Neutral ICT',
+    crtHigh: '1.0875',
+    crtLow: '1.0810',
+    regime: 'Pre-Catalyst Range',
+    entry: '1.0835',
+    stopLoss: '1.0812',
+    takeProfit: '1.0890',
+    riskReward: '1 : 2.4',
+    confluenceNote:
+      'Asian range sweep tested; awaiting New York open displacement confirmation.',
+  },
+  {
+    symbol: 'GBP/USD',
+    name: 'British Pound / USD',
+    price: '1.2985',
+    change: '+0.28%',
+    positive: true,
+    bias: 'Bullish BOS',
+    crtHigh: '1.3018',
+    crtLow: '1.2940',
+    regime: 'Session Reclaim',
+    entry: '1.2968',
+    stopLoss: '1.2944',
+    takeProfit: '1.3030',
+    riskReward: '1 : 2.6',
+    confluenceNote:
+      'London Break of Structure confirmed above prior day midpoint equilibrium.',
+  },
+  {
+    symbol: 'US30',
+    name: 'Dow Jones Index',
+    price: '43,890.10',
+    change: '+0.45%',
+    positive: true,
+    bias: 'Bullish Expansion',
+    crtHigh: '44,020.00',
+    crtLow: '43,650.00',
+    regime: 'NY Open Momentum',
+    entry: '43,810.00',
+    stopLoss: '43,690.00',
+    takeProfit: '44,110.00',
+    riskReward: '1 : 2.5',
+    confluenceNote:
+      'New York kill-zone FVG mitigation aligned with H4 bullish orderflow.',
+  },
+];
+
+export const CORE_ECONOMIC_EVENTS: EconomicEvent[] = [
+  {
+    id: 'eco-cpi',
+    name: 'Consumer Price Index (CPI YoY)',
+    tag: 'CPI',
+    impact: 'Critical',
+    date: 'Wednesday 12:30 GMT',
+    previous: '3.1%',
+    forecast: '2.9%',
+    affectedAssets: ['XAU/USD', 'EUR/USD', 'US30'],
+    biasNote:
+      'Higher-than-expected inflation typically strengthens USD; gold may test discount liquidity levels.',
+  },
+  {
+    id: 'eco-ppi',
+    name: 'Producer Price Index (PPI MoM)',
+    tag: 'PPI',
+    impact: 'High',
+    date: 'Thursday 12:30 GMT',
+    previous: '0.2%',
+    forecast: '0.1%',
+    affectedAssets: ['USD Pairs', 'Treasuries'],
+    biasNote:
+      'Leading indicator for wholesale price pressure and upstream inflation trajectory.',
+  },
+  {
+    id: 'eco-nfp',
+    name: 'Non-Farm Payrolls (NFP) &amp; Unemployment',
+    tag: 'NFP',
+    impact: 'Critical',
+    date: 'First Friday 12:30 GMT',
+    previous: '185K',
+    forecast: '170K',
+    affectedAssets: ['DXY', 'GBP/USD', 'US30'],
+    biasNote:
+      'Extreme volatility window. Platform pre-event protection activates 30 minutes prior.',
+  },
+  {
+    id: 'eco-fomc',
+    name: 'FOMC Rate Decision &amp; Press Conference',
+    tag: 'FOMC',
+    impact: 'Critical',
+    date: 'Federal Reserve Cycle',
+    previous: '5.25%',
+    forecast: '5.00%',
+    affectedAssets: ['All Major FX', 'Indices', 'Gold'],
+    biasNote:
+      'Macro policy guidance shifts institutional liquidity parameters across higher timeframes.',
+  },
+];
+
+// Preserves the maximum of 10 shared platform signals
+const RAW_SHARED_SIGNALS: TradingSignal[] = [
+  {
+    id: 'SIG-842',
+    pair: 'XAU/USD',
+    direction: 'BUY',
+    timeframe: 'H1 / M15',
+    strategy: 'SMC Order Block',
+    entryPrice: 2644.2,
+    stopLoss: 2639.8,
+    takeProfit: 2656.5,
+    riskReward: '1 : 2.8',
+    confidence: 89,
+    status: 'PENDING_APPROVAL',
+    outcome: 'PENDING',
+    timestamp: 'Today 09:45 GMT',
+    analysisReasoning:
+      'H1 Bullish Order Block + 15m Fair Value Gap fill following London sell-side liquidity purge.',
+  },
+  {
+    id: 'SIG-841',
+    pair: 'XAU/USD',
+    direction: 'BUY',
+    timeframe: 'H1 / M15',
+    strategy: 'SMC Order Block',
+    entryPrice: 2638.5,
+    stopLoss: 2632.0,
+    takeProfit: 2654.5,
+    riskReward: '1 : 2.46',
+    confidence: 88,
+    status: 'EXECUTED',
+    outcome: 'TP_HIT',
+    timestamp: 'Yesterday 09:15 GMT',
+    analysisReasoning:
+      'London session liquidity sweep below 2635, retested H1 bullish order block with clean displacement.',
+  },
+  {
+    id: 'SIG-840',
+    pair: 'EUR/USD',
+    direction: 'NO_TRADE',
+    timeframe: 'M15',
+    strategy: 'Market Choppiness Filter',
+    confidence: 94,
+    status: 'DISMISSED',
+    outcome: 'PROTECTED',
+    timestamp: 'Yesterday 14:00 GMT',
+    analysisReasoning:
+      'Choppiness Index &gt; 62.0 inside tight consolidation ahead of ECB rate remarks. Capital preserved.',
+  },
+  {
+    id: 'SIG-839',
+    pair: 'US30',
+    direction: 'SELL',
+    timeframe: 'M5 / M15',
+    strategy: 'ICT Silver Bullet',
+    entryPrice: 43920,
+    stopLoss: 44010,
+    takeProfit: 43680,
+    riskReward: '1 : 2.67',
+    confidence: 85,
+    status: 'EXECUTED',
+    outcome: 'TP_HIT',
+    timestamp: '2 Days Ago 15:30 GMT',
+    analysisReasoning:
+      'New York open fair value gap rejection after creating equal highs liquidity inducement.',
+  },
+  {
+    id: 'SIG-838',
+    pair: 'GBP/USD',
+    direction: 'BUY',
+    timeframe: 'H1 / M15',
+    strategy: 'CRT Range Expansion',
+    entryPrice: 1.2945,
+    stopLoss: 1.2920,
+    takeProfit: 1.3005,
+    riskReward: '1 : 2.40',
+    confidence: 84,
+    status: 'APPROVED',
+    outcome: 'BREAKEVEN',
+    timestamp: '3 Days Ago 08:40 GMT',
+    analysisReasoning:
+      'CRT initial balance sweep followed by clean M15 displacement reclaim above session open.',
+  },
+  {
+    id: 'SIG-837',
+    pair: 'EUR/USD',
+    direction: 'SELL',
+    timeframe: 'H4 / H1',
+    strategy: 'SMC Order Block',
+    entryPrice: 1.0892,
+    stopLoss: 1.0915,
+    takeProfit: 1.0835,
+    riskReward: '1 : 2.48',
+    confidence: 82,
+    status: 'EXECUTED',
+    outcome: 'SL_HIT',
+    timestamp: '4 Days Ago 13:10 GMT',
+    analysisReasoning:
+      'H4 bearish breaker retest invalidated during sudden US Treasury yield reversal.',
+  },
+  {
+    id: 'SIG-836',
+    pair: 'GBP/USD',
+    direction: 'NO_TRADE',
+    timeframe: 'M15',
+    strategy: 'Market Choppiness Filter',
+    confidence: 91,
+    status: 'DISMISSED',
+    outcome: 'PROTECTED',
+    timestamp: '5 Days Ago 11:20 GMT',
+    analysisReasoning:
+      'Conflicted M15 vs H4 orderflow and widened broker spread ahead of US PPI print.',
+  },
+  {
+    id: 'SIG-835',
+    pair: 'XAU/USD',
+    direction: 'SELL',
+    timeframe: 'M15',
+    strategy: 'ICT Silver Bullet',
+    entryPrice: 2661.0,
+    stopLoss: 2666.5,
+    takeProfit: 2647.0,
+    riskReward: '1 : 2.55',
+    confidence: 87,
+    status: 'REJECTED',
+    outcome: 'PROTECTED',
+    timestamp: '6 Days Ago 15:15 GMT',
+    analysisReasoning:
+      'Trader declined setup due to personal exposure limit prior to London Fix.',
+  },
+  {
+    id: 'SIG-834',
+    pair: 'US30',
+    direction: 'BUY',
+    timeframe: 'H1 / M15',
+    strategy: 'CRT Range Expansion',
+    entryPrice: 43540,
+    stopLoss: 43420,
+    takeProfit: 43840,
+    riskReward: '1 : 2.50',
+    confidence: 86,
+    status: 'EXECUTED',
+    outcome: 'TP_HIT',
+    timestamp: '1 Week Ago 14:45 GMT',
+    analysisReasoning:
+      'Swept prior day low liquidity with bullish CRT range expansion into New York afternoon.',
+  },
+  {
+    id: 'SIG-833',
+    pair: 'EUR/USD',
+    direction: 'BUY',
+    timeframe: 'H1',
+    strategy: 'SMC Order Block',
+    entryPrice: 1.0795,
+    stopLoss: 1.0772,
+    takeProfit: 1.0852,
+    riskReward: '1 : 2.48',
+    confidence: 83,
+    status: 'EXECUTED',
+    outcome: 'TP_HIT',
+    timestamp: '1 Week Ago 08:15 GMT',
+    analysisReasoning:
+      'Daily demand discount alignment with London session CHoCH confirmation.',
+  },
+];
+
+export const SHARED_PLATFORM_SIGNALS: TradingSignal[] = RAW_SHARED_SIGNALS.slice(
+  0,
+  MAX_SHARED_SIGNALS
+);
+
+export const STRATEGY_MODULES = [
+  {
+    id: 'smc',
+    code: 'SMC',
+    name: 'Smart Money Concepts',
+    accent: '#16A36A',
+    cadence: 'Intraday &amp; Swing',
+    summary:
+      'Tracks institutional Order Blocks (OB), Break of Structure (BOS), and Change of Character (CHoCH) across H4, H1, and M15.',
+    rules: [
+      'Higher-timeframe (D1/H4) market structure defines directional bias',
+      'BOS confirms continuation; CHoCH flags structural shift after liquidity raid',
+      'Mitigation entry inside unmitigated Order Block with strict invalidation',
+    ],
+  },
+  {
+    id: 'ict',
+    code: 'ICT',
+    name: 'ICT Concepts &amp; Silver Bullet',
+    accent: '#168BFF',
+    cadence: 'Intraday Kill Zones',
+    summary:
+      'Evaluates Fair Value Gaps (FVG), London/New York Kill Zones, liquidity pool purges, and Premium/Discount equilibrium.',
+    rules: [
+      'Requires clean buy-side or sell-side liquidity sweep prior to displacement',
+      'Targets FVG rebalance inside high-volume London (07:00–10:00) or NY (13:30–16:00) windows',
+      'Enforces discount buys and premium shorts relative to dealing range',
+    ],
+  },
+  {
+    id: 'crt',
+    code: 'CRT',
+    name: 'Candle Range Theory',
+    accent: '#9560E8',
+    cadence: 'Swing &amp; Session Expansion',
+    summary:
+      'Models higher-timeframe candle range boundaries, initial balance false breaks, and directional expansion continuations.',
+    rules: [
+      'Identifies prior session/day high-low range manipulation (turtle soup)',
+      'Confirms body close back inside range before targeting opposing range extreme',
+      'Pairs H4 range framing with M15 execution refinement',
+    ],
+  },
+  {
+    id: 'indicators',
+    code: 'IND',
+    name: 'Quantitative Indicators &amp; Filters',
+    accent: '#E69A36',
+    cadence: 'Cross-Regime Guardrail',
+    summary:
+      'Supplements price-action structure with Choppiness Index, ATR volatility compression thresholds, and RSI divergence checks.',
+    rules: [
+      'Choppiness Index &gt; 60.0 flags sideways noise and blocks low-edge entries',
+      'ATR threshold guards against dead liquidity and excessive spread ratios',
+      'Minimum 1:2.0 Risk-to-Reward required before setup publication',
+    ],
+  },
+];
+
+export const FAQ_ITEMS = [
+  {
+    q: 'Why does PipPilotAi require administrator approval after email verification?',
+    a: 'Email verification confirms identity ownership (Step 2). Membership access (Step 3) is manually reviewed and activated by administrators to control cohort capacity and maintain execution quality.',
+  },
+  {
+    q: 'Does PipPilotAi automatically place live trades without my permission?',
+    a: 'No. PipPilotAi uses a semi-automated 4-step workflow: Analysis -&gt; Setup Proposal -&gt; Human Trader Review -&gt; Independent MT5 Validation. Nothing is transmitted unless you explicitly approve it.',
+  },
+  {
+    q: 'What does a NO TRADE signal mean?',
+    a: 'When market choppiness is high, multi-timeframe structure conflicts, or a critical news catalyst (CPI, PPI, NFP, FOMC) is imminent, the Capital Shield issues a NO TRADE status to protect your account from low-probability noise.',
+  },
+  {
+    q: 'Is MetaTrader 5 (MT5) execution live right now?',
+    a: 'Not yet. The MT5 execution bridge is currently in active development and not connected to live broker terminals. All signals, prices, and validation steps in the workspace are currently illustrative previews.',
+  },
+  {
+    q: 'Why is Signal History capped at 10 shared platform signals?',
+    a: 'PipPilotAi prioritizes high-confluence selectivity over signal spam and preserves a clean, auditable rolling feed of up to 10 shared platform signals for transparent review.',
+  },
+];
diff --git a/src/pages/workspace/BacktestingPage.tsx b/src/pages/workspace/BacktestingPage.tsx
new file mode 100644
index 0000000..1473843
--- /dev/null
+++ b/src/pages/workspace/BacktestingPage.tsx
@@ -0,0 +1,213 @@
+import React, { useState } from 'react';
+import { AlertCircle, FlaskConical, Play, ShieldAlert } from 'lucide-react';
+import { AssetSymbol, TimeframeOption } from '../../data/workspaceData';
+
+export const BacktestingPage: React.FC = () =&gt; {
+  const [strategy, setStrategy] = useState&lt;'SMC' | 'ICT' | 'CRT'&gt;('SMC');
+  const [asset, setAsset] = useState<assetsymbol>('XAU/USD');
+  const [timeframe, setTimeframe] = useState<timeframeoption>('M15');
+  const [initialCapital, setInitialCapital] = useState(10000);
+  const [riskPerTrade, setRiskPerTrade] = useState(1.0);
+  const [dateWindow, setDateWindow] = useState&lt;'30D' | '90D' | '180D'&gt;('90D');
+  const [runAttempted, setRunAttempted] = useState(false);
+
+  const handleRunAttempt = (e: React.FormEvent) =&gt; {
+    e.preventDefault();
+    setRunAttempted(true);
+  };
+
+  return (
+    <div classname="space-y-6">
+      {/* Honesty / Separation Banner */}
+      <div classname="p-4 sm:p-5 rounded-2xl bg-[#152B30] border border-[#9560E8]/40 purple-glow-box flex items-start gap-3">
+        <shieldalert classname="w-5 h-5 text-[#9560E8] shrink-0 mt-0.5">
+        <div classname="space-y-1 text-xs">
+          <h2 classname="text-sm font-bold text-[#E8F2EE]">
+            Historical Backtesting Engine — Actual vs Demonstration Separation
+          </h2>
+          <p classname="text-[#A9BEB5] leading-relaxed">
+            No historical market-tick database or backtest execution engine is connected yet. Actual backtest runs return an unexecuted state until verified historical data feeds are integrated. No performance statistics, win rates, or equity curves are fabricated here.
+          </p>
+        </div>
+      </shieldalert></div>
+
+      <div classname="grid grid-cols-1 lg:grid-cols-12 gap-6">
+        {/* Left: Strategy Test Parameters */}
+        <form +="" classname="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
+          <div classname="flex items-center justify-between border-b border-[#1A363E] pb-3">
+            <span classname="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5">
+              <flaskconical classname="w-4 h-4 text-[#16A36A]">
+              Backtest Configuration
+            </flaskconical></span>
+            <span classname="text-[10px] font-mono text-[#E69A36]">Offline Engine</span>
+          </div>
+
+          <div classname="space-y-3 text-xs font-mono">
+            <div>
+              <label classname="block text-[#A9BEB5] mb-1.5">Strategy Framework</label>
+              <div classname="grid grid-cols-3 gap-2">
+                {(['SMC', 'ICT', 'CRT'] as const).map((s) =&gt; (
+                  <button +="" key="{s}" type="button" ==""> setStrategy(s)}
+                    className={`py-2 rounded-xl border font-bold transition-colors ${
+                      strategy === s
+                        ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
+                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
+                    }`}
+                  &gt;
+                    {s}
+                  </button>
+                ))}
+              </div>
+            </div>
+
+            <div>
+              <label classname="block text-[#A9BEB5] mb-1.5">Instrument</label>
+              <div classname="grid grid-cols-2 sm:grid-cols-4 gap-2">
+                {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((pair) =&gt; (
+                  <button +="" key="{pair}" type="button" ==""> setAsset(pair)}
+                    className={`py-2 rounded-xl border font-bold transition-colors ${
+                      asset === pair
+                        ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE]'
+                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
+                    }`}
+                  &gt;
+                    {pair}
+                  </button>
+                ))}
+              </div>
+            </div>
+
+            <div classname="grid grid-cols-2 gap-3">
+              <div>
+                <label classname="block text-[#A9BEB5] mb-1.5">Timeframe</label>
+                <select +="" value="{timeframe}" ==""> setTimeframe(e.target.value as TimeframeOption)}
+                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#168BFF]"
+                &gt;
+                  {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) =&gt; (
+                    <option key="{tf}" value="{tf}">
+                      {tf}
+                    </option>
+                  ))}
+                </select>
+              </div>
+              <div>
+                <label classname="block text-[#A9BEB5] mb-1.5">Lookback Window</label>
+                <select +="" value="{dateWindow}" ==""> setDateWindow(e.target.value as '30D' | '90D' | '180D')}
+                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#168BFF]"
+                &gt;
+                  <option value="30D">Last 30 Days</option>
+                  <option value="90D">Last 90 Days</option>
+                  <option value="180D">Last 180 Days</option>
+                </select>
+              </div>
+            </div>
+
+            <div classname="grid grid-cols-2 gap-3">
+              <div>
+                <label classname="block text-[#A9BEB5] mb-1.5">Initial Capital ($)</label>
+                <input +="" type="number" min="{1000}" step="{500}" value="{initialCapital}" ==""> setInitialCapital(Number(e.target.value) || 1000)}
+                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
+                /&gt;
+              </div>
+              <div>
+                <label classname="block text-[#A9BEB5] mb-1.5">Risk / Trade (%)</label>
+                <input +="" type="number" min="{0.25}" max="{3}" step="{0.25}" value="{riskPerTrade}" ==""> setRiskPerTrade(Number(e.target.value) || 1)}
+                  className="w-full px-3 py-2 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
+                /&gt;
+              </div>
+            </div>
+          </div>
+
+          <button +="" type="submit" classname="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 transition-colors">
+            <play classname="w-4 h-4">
+            <span>Check Backtest Engine Status</span>
+          </play></button>
+        </form>
+
+        {/* Right: Actual Results Area (Zero Fabricated Metrics) */}
+        <div classname="lg:col-span-7 space-y-4">
+          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
+            <div classname="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3">
+              <h3 classname="text-sm font-bold text-[#E8F2EE]">
+                Actual Backtest Results
+              </h3>
+              <span classname="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#101B20] border border-[#1A363E] text-[#E69A36]">
+                NOT EXECUTED · NO HISTORICAL FEED
+              </span>
+            </div>
+
+            {runAttempted &amp;&amp; (
+              <div classname="p-3.5 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/40 text-xs text-[#E8F2EE] flex items-start gap-2.5">
+                <alertcircle classname="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5">
+                <span>
+                  Backtest requested for <strong classname="font-mono">{strategy} · {asset} ({timeframe}, {dateWindow})</strong>. Historical candle storage and backtest worker are not yet connected, so no result metrics were generated.
+                </span>
+              </alertcircle></div>
+            )}
+
+            {/* Empty unfabricated metrics */}
+            <div classname="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
+              <div classname="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
+                <span classname="text-[10px] text-[#A9BEB5] block">Total Trades</span>
+                <span classname="text-base font-bold text-[#A9BEB5]">—</span>
+              </div>
+              <div classname="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
+                <span classname="text-[10px] text-[#A9BEB5] block">Win Rate</span>
+                <span classname="text-base font-bold text-[#168BFF]">—</span>
+              </div>
+              <div classname="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
+                <span classname="text-[10px] text-[#A9BEB5] block">Net Return</span>
+                <span classname="text-base font-bold text-[#168BFF]">—</span>
+              </div>
+              <div classname="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]">
+                <span classname="text-[10px] text-[#A9BEB5] block">Max Drawdown</span>
+                <span classname="text-base font-bold text-[#A9BEB5]">—</span>
+              </div>
+            </div>
+
+            <div classname="p-6 rounded-xl bg-[#101B20] border border-dashed border-[#1A363E] text-center space-y-1.5">
+              <p classname="text-xs font-semibold text-[#E8F2EE]">
+                No Actual Backtest Data Available
+              </p>
+              <p classname="text-[11px] text-[#A9BEB5] max-w-md mx-auto">
+                Real backtest output will appear here once historical OHLCV data ingestion and strategy replay are implemented and verified.
+              </p>
+            </div>
+          </div>
+
+          <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 text-xs text-[#A9BEB5]">
+            <strong classname="text-[#E8F2EE]">Demonstration vs Verified Data Policy:</strong>{' '}
+            Sample scenarios shown elsewhere in the workspace are strictly labeled as illustrative previews and are never presented as historical backtest performance.
+          </div>
+        </div>
+      </div>
+    </div>
+  );
+};
diff --git a/src/pages/workspace/HelpSupportPage.tsx b/src/pages/workspace/HelpSupportPage.tsx
new file mode 100644
index 0000000..6384cc4
--- /dev/null
+++ b/src/pages/workspace/HelpSupportPage.tsx
@@ -0,0 +1,188 @@
+import React, { useState } from 'react';
+import {
+  BookOpen,
+  CheckCircle2,
+  ChevronDown,
+  ChevronUp,
+  HelpCircle,
+  Mail,
+  Send,
+} from 'lucide-react';
+import { FAQ_ITEMS } from '../../data/workspaceData';
+import { useAuth } from '../../context/AuthContext';
+
+export const HelpSupportPage: React.FC = () =&gt; {
+  const { user } = useAuth();
+  const [openFaq, setOpenFaq] = useState<number |="" null="">(0);
+  const [subject, setSubject] = useState('');
+  const [message, setMessage] = useState('');
+  const [submitted, setSubmitted] = useState(false);
+
+  const handleSubmit = (e: React.FormEvent) =&gt; {
+    e.preventDefault();
+    if (!message.trim()) return;
+    setSubmitted(true);
+  };
+
+  return (
+    <div classname="space-y-6">
+      {/* Platform Guidance */}
+      <div classname="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4">
+        <div classname="flex items-center gap-2">
+          <bookopen classname="w-4 h-4 text-[#16A36A]">
+          <h2 classname="text-base sm:text-lg font-extrabold text-[#E8F2EE] purple-glow-text">
+            Platform Guidance &amp; Semi-Automated Workflow
+          </h2>
+        </bookopen></div>
+
+        <div classname="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#168BFF] font-bold block">01. Multi-Timeframe Scan</span>
+            <p classname="text-[#A9BEB5]">
+              Market structure is evaluated across D1, H4, H1, and M15 using SMC, ICT, and CRT rules.
+            </p>
+          </div>
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#9560E8] font-bold block">02. Capital Shield Check</span>
+            <p classname="text-[#A9BEB5]">
+              Choppiness and CPI/PPI/NFP/FOMC proximity filter out low-probability setups as NO TRADE.
+            </p>
+          </div>
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#16A36A] font-bold block">03. Human Review</span>
+            <p classname="text-[#A9BEB5]">
+              Every valid setup enters Trader Review where you retain final Approve or Reject control.
+            </p>
+          </div>
+          <div classname="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1">
+            <span classname="font-mono text-[#E69A36] font-bold block">04. Planned MT5 Bridge</span>
+            <p classname="text-[#A9BEB5]">
+              Independent spread and risk checks run before order transmission (currently in development).
+            </p>
+          </div>
+        </div>
+      </div>
+
+      <div classname="grid grid-cols-1 lg:grid-cols-12 gap-6">
+        {/* FAQs */}
+        <div classname="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3">
+          <h3 classname="text-sm font-bold text-[#E8F2EE] flex items-center gap-2 border-b border-[#1A363E] pb-3">
+            <helpcircle classname="w-4 h-4 text-[#168BFF]">
+            <span>Frequently Asked Questions</span>
+          </helpcircle></h3>
+
+          <div classname="space-y-2.5">
+            {FAQ_ITEMS.map((item, idx) =&gt; {
+              const isOpen = openFaq === idx;
+              return (
+                <div +="" key="{item.q}" classname="rounded-xl bg-[#101B20] border border-[#1A363E] overflow-hidden">
+                  <button +="" type="button" ==""> setOpenFaq(isOpen ? null : idx)}
+                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-semibold text-[#E8F2EE]"
+                    aria-expanded={isOpen}
+                  &gt;
+                    <span>{item.q}</span>
+                    {isOpen ? (
+                      <chevronup classname="w-4 h-4 text-[#16A36A] shrink-0">
+                    ) : (
+                      <chevrondown classname="w-4 h-4 text-[#A9BEB5] shrink-0">
+                    )}
+                  </chevrondown></chevronup></button>
+                  {isOpen &amp;&amp; (
+                    <div classname="px-4 pb-3.5 pt-1 text-xs text-[#A9BEB5] leading-relaxed border-t border-[#1A363E]/60">
+                      {item.a}
+                    </div>
+                  )}
+                </div>
+              );
+            })}
+          </div>
+        </div>
+
+        {/* Contact / Support Interface */}
+        <div classname="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4">
+          <h3 classname="text-sm font-bold text-[#E8F2EE] flex items-center gap-2 border-b border-[#1A363E] pb-3">
+            <mail classname="w-4 h-4 text-[#16A36A]">
+            <span>Contact / Support Desk</span>
+          </mail></h3>
+
+          {submitted ? (
+            <div classname="py-6 text-center space-y-3">
+              <div classname="w-12 h-12 rounded-full bg-[#16A36A]/20 text-[#16A36A] flex items-center justify-center mx-auto">
+                <checkcircle2 classname="w-6 h-6">
+              </checkcircle2></div>
+              <h4 classname="text-sm font-bold text-[#E8F2EE]">Support Note Prepared</h4>
+              <p classname="text-xs text-[#A9BEB5]">
+                Your inquiry for <span classname="font-mono text-[#E8F2EE]">{user?.email}</span> has been recorded locally in this preview.
+              </p>
+              <button +="" type="button" ==""> {
+                  setSubmitted(false);
+                  setSubject('');
+                  setMessage('');
+                }}
+                className="px-4 py-2 rounded-xl bg-[#16A36A] text-[#E8F2EE] text-xs font-bold"
+              &gt;
+                Send Another Inquiry
+              </button>
+            </div>
+          ) : (
+            <form classname="space-y-3.5 text-xs">
+              <div>
+                <label classname="block font-semibold text-[#E8F2EE] mb-1">
+                  Account Email
+                </label>
+                <input +="" type="text" readonly="" value="{user?.email" ??="" ''}="" classname="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20]/70 border border-[#1A363E] text-[#A9BEB5] font-mono">
+              </div>
+
+              <div>
+                <label classname="block font-semibold text-[#E8F2EE] mb-1">
+                  Topic / Subject
+                </label>
+                <input +="" type="text" value="{subject}" ==""> setSubject(e.target.value)}
+                  placeholder="e.g. Membership Approval / Risk Settings"
+                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
+                /&gt;
+              </div>
+
+              <div>
+                <label classname="block font-semibold text-[#E8F2EE] mb-1">
+                  Message *
+                </label>
+                <textarea +="" required="" rows="{4}" value="{message}" ==""> setMessage(e.target.value)}
+                  placeholder="Describe how the PipPilotAi team can assist..."
+                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A] resize-none"
+                /&gt;
+              &lt;/div&gt;
+
+              &lt;button
+                type="submit"
+                className="w-full py-3 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold flex items-center justify-center gap-2 transition-colors"
+              &gt;
+                &lt;Send className="w-4 h-4" /&gt;
+                &lt;span&gt;Submit Support Request&lt;/span&gt;
+              &lt;/button&gt;
+            &lt;/form&gt;
+          )}
+        &lt;/div&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/Mt5ConnectionsPage.tsx b/src/pages/workspace/Mt5ConnectionsPage.tsx
new file mode 100644
index 0000000..a8d6c9f
--- /dev/null
+++ b/src/pages/workspace/Mt5ConnectionsPage.tsx
@@ -0,0 +1,167 @@
+import React, { useState } from 'react';
+import { AlertTriangle, Plug, ServerOff, ShieldCheck, Workflow } from 'lucide-react';
+
+export const Mt5ConnectionsPage: React.FC = () =&gt; {
+  const [accountMode, setAccountMode] = useState&lt;'DEMO' | 'LIVE'&gt;('DEMO');
+  const [brokerServer, setBrokerServer] = useState('');
+  const [accountLogin, setAccountLogin] = useState('');
+  const [savedPreviewNotice, setSavedPreviewNotice] = useState(false);
+
+  const handleSaveConfigPreview = (e: React.FormEvent) =&gt; {
+    e.preventDefault();
+    setSavedPreviewNotice(true);
+  };
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      {/* Explicit Development Notice Banner */}
+      &lt;div className="p-4 sm:p-5 rounded-2xl bg-[#152B30] border border-[#E69A36]/45 flex items-start gap-3"&gt;
+        &lt;AlertTriangle className="w-5 h-5 text-[#E69A36] shrink-0 mt-0.5" /&gt;
+        &lt;div className="space-y-1 text-xs"&gt;
+          &lt;h2 className="text-sm font-bold text-[#E8F2EE]"&gt;
+            MT5 Integration In Development — Not Connected
+          &lt;/h2&gt;
+          &lt;p className="text-[#A9BEB5] leading-relaxed"&gt;
+            Actual MetaTrader 5 terminal connectivity and local execution bridge validation are currently under development and have not been implemented or tested yet. No broker credentials are transmitted or stored on a live execution server from this interface.
+          &lt;/p&gt;
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
+        {/* Left: Connection &amp; Execution Bridge Status */}
+        &lt;div className="lg:col-span-5 space-y-4"&gt;
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+            &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+              &lt;span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5"&gt;
+                &lt;Plug className="w-4 h-4 text-[#168BFF]" /&gt;
+                Bridge &amp; Terminal Status
+              &lt;/span&gt;
+              &lt;span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E69A36]/20 text-[#E69A36]"&gt;
+                DISCONNECTED
+              &lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;div className="space-y-2.5 text-xs font-mono"&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;MT5 Terminal Link&lt;/span&gt;
+                &lt;span className="text-[#E05252] font-bold flex items-center gap-1"&gt;
+                  &lt;ServerOff className="w-3.5 h-3.5" /&gt; Offline
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Execution Bridge&lt;/span&gt;
+                &lt;span className="text-[#E69A36] font-bold"&gt;In Development&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Selected Mode&lt;/span&gt;
+                &lt;span
+                  className={`font-bold ${
+                    accountMode === 'DEMO' ? 'text-[#168BFF]' : 'text-[#16A36A]'
+                  }`}
+                &gt;
+                  {accountMode} MODE
+                &lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+            &lt;h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5"&gt;
+              &lt;Workflow className="w-4 h-4 text-[#16A36A]" /&gt;
+              Planned 4-Step Execution Guardrail
+            &lt;/h3&gt;
+            &lt;p className="text-xs text-[#A9BEB5] leading-relaxed"&gt;
+              Once built, the MT5 bridge will verify broker spread, slippage tolerance, and local risk caps independently after you explicitly approve a signal.
+            &lt;/p&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Right: Account Connection Interface Preview */}
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 sm:p-6 space-y-5"&gt;
+          &lt;div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3"&gt;
+            &lt;div&gt;
+              &lt;h3 className="text-base font-bold text-[#E8F2EE]"&gt;
+                Account Connection Interface (Preview)
+              &lt;/h3&gt;
+              &lt;p className="text-xs text-[#A9BEB5]"&gt;
+                Demo/Live mode selection and planned terminal pairing layout
+              &lt;/p&gt;
+            &lt;/div&gt;
+
+            &lt;div className="flex bg-[#101B20] p-1 rounded-xl border border-[#1A363E]"&gt;
+              {(['DEMO', 'LIVE'] as const).map((mode) =&gt; (
+                &lt;button
+                  key={mode}
+                  type="button"
+                  onClick={() =&gt; setAccountMode(mode)}
+                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
+                    accountMode === mode
+                      ? mode === 'DEMO'
+                        ? 'bg-[#168BFF] text-[#E8F2EE]'
+                        : 'bg-[#16A36A] text-[#E8F2EE]'
+                      : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+                  }`}
+                &gt;
+                  {mode}
+                &lt;/button&gt;
+              ))}
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          &lt;form onSubmit={handleSaveConfigPreview} className="space-y-4"&gt;
+            &lt;div&gt;
+              &lt;label className="block text-xs font-semibold text-[#E8F2EE] mb-1.5"&gt;
+                Broker Server Name
+              &lt;/label&gt;
+              &lt;input
+                type="text"
+                value={brokerServer}
+                onChange={(e) =&gt; {
+                  setBrokerServer(e.target.value);
+                  setSavedPreviewNotice(false);
+                }}
+                placeholder="e.g. BrokerName-Demo01"
+                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm font-mono focus:outline-none focus:border-[#168BFF]"
+              /&gt;
+            &lt;/div&gt;
+
+            &lt;div&gt;
+              &lt;label className="block text-xs font-semibold text-[#E8F2EE] mb-1.5"&gt;
+                MT5 Account Login ID
+              &lt;/label&gt;
+              &lt;input
+                type="text"
+                value={accountLogin}
+                onChange={(e) =&gt; {
+                  setAccountLogin(e.target.value);
+                  setSavedPreviewNotice(false);
+                }}
+                placeholder="e.g. 50129482"
+                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] text-sm font-mono focus:outline-none focus:border-[#168BFF]"
+              /&gt;
+            &lt;/div&gt;
+
+            {savedPreviewNotice &amp;&amp; (
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#168BFF]/40 text-xs text-[#168BFF]"&gt;
+                Interface preview noted ({accountMode} mode). No live MT5 connection was attempted because the execution bridge is still under development.
+              &lt;/div&gt;
+            )}
+
+            &lt;div className="flex flex-wrap items-center justify-between gap-3 pt-1"&gt;
+              &lt;span className="text-[11px] text-[#A9BEB5] flex items-center gap-1.5"&gt;
+                &lt;ShieldCheck className="w-4 h-4 text-[#16A36A]" /&gt;
+                No passwords transmitted in preview stage
+              &lt;/span&gt;
+              &lt;button
+                type="submit"
+                className="px-5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors"
+              &gt;
+                Validate Interface Layout
+              &lt;/button&gt;
+            &lt;/div&gt;
+          &lt;/form&gt;
+        &lt;/div&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/NewsIntelligencePage.tsx b/src/pages/workspace/NewsIntelligencePage.tsx
new file mode 100644
index 0000000..ab88d99
--- /dev/null
+++ b/src/pages/workspace/NewsIntelligencePage.tsx
@@ -0,0 +1,134 @@
+import React, { useState } from 'react';
+import { AlertTriangle, Calendar, Globe } from 'lucide-react';
+import { CORE_ECONOMIC_EVENTS } from '../../data/workspaceData';
+
+export const NewsIntelligencePage: React.FC = () =&gt; {
+  const [selectedTag, setSelectedTag] = useState&lt;'CPI' | 'PPI' | 'NFP' | 'FOMC'&gt;('CPI');
+  const activeEvent =
+    CORE_ECONOMIC_EVENTS.find((evt) =&gt; evt.tag === selectedTag) ?? CORE_ECONOMIC_EVENTS[0];
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+        &lt;div className="flex flex-wrap items-center justify-between gap-3"&gt;
+          &lt;div&gt;
+            &lt;span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF]"&gt;
+              Macro Catalyst Tracking
+            &lt;/span&gt;
+            &lt;h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text"&gt;
+              Economic News Intelligence (CPI, PPI, NFP, FOMC)
+            &lt;/h2&gt;
+          &lt;/div&gt;
+          &lt;span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#101B20] border border-[#1A363E] text-[#E69A36]"&gt;
+            Sample Calendar · Not Live Feed
+          &lt;/span&gt;
+        &lt;/div&gt;
+
+        &lt;div className="flex flex-wrap gap-2"&gt;
+          {(['CPI', 'PPI', 'NFP', 'FOMC'] as const).map((tag) =&gt; (
+            &lt;button
+              key={tag}
+              type="button"
+              onClick={() =&gt; setSelectedTag(tag)}
+              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
+                selectedTag === tag
+                  ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE] shadow-md shadow-[#168BFF]/30'
+                  : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE] hover:border-[#168BFF]/40'
+              }`}
+            &gt;
+              {tag} Event Insight
+            &lt;/button&gt;
+          ))}
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
+        {/* Selected Catalyst Detail */}
+        &lt;div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"&gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;span className="text-sm font-bold font-mono text-[#E8F2EE] flex items-center gap-2"&gt;
+              &lt;Calendar className="w-4 h-4 text-[#168BFF]" /&gt;
+              {activeEvent.name}
+            &lt;/span&gt;
+            &lt;span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30 uppercase font-bold"&gt;
+              {activeEvent.impact} Impact
+            &lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;p className="text-xs text-[#A9BEB5] leading-relaxed"&gt;{activeEvent.biasNote}&lt;/p&gt;
+
+          &lt;div className="grid grid-cols-3 gap-2.5 font-mono text-xs"&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Schedule&lt;/span&gt;
+              &lt;span className="font-bold text-[#E8F2EE]"&gt;{activeEvent.date}&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Previous&lt;/span&gt;
+              &lt;span className="font-bold text-[#E8F2EE]"&gt;{activeEvent.previous}&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Consensus&lt;/span&gt;
+              &lt;span className="font-bold text-[#168BFF]"&gt;{activeEvent.forecast}&lt;/span&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs font-mono"&gt;
+            &lt;span className="text-[#168BFF] flex items-center gap-1.5"&gt;
+              &lt;Globe className="w-3.5 h-3.5" /&gt;
+              Monitored Assets:
+            &lt;/span&gt;
+            &lt;span className="text-[#E8F2EE] font-semibold"&gt;
+              {activeEvent.affectedAssets.join(', ')}
+            &lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="p-3 rounded-xl bg-[#E69A36]/10 border border-[#E69A36]/30 text-xs text-[#A9BEB5] flex items-start gap-2"&gt;
+            &lt;AlertTriangle className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" /&gt;
+            &lt;span&gt;
+              Pre-event protection rule: high-impact macro windows pause new trade proposals 30 minutes prior to release to avoid spread spikes.
+            &lt;/span&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Core Macro Calendar List */}
+        &lt;div className="lg:col-span-6 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A9BEB5]"&gt;
+              Core 4 Economic Calendar Radar
+            &lt;/h3&gt;
+            &lt;span className="text-xs font-mono text-[#16A36A]"&gt;Illustrative Schedule&lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="space-y-2.5"&gt;
+            {CORE_ECONOMIC_EVENTS.map((evt) =&gt; (
+              &lt;button
+                key={evt.id}
+                type="button"
+                onClick={() =&gt; setSelectedTag(evt.tag)}
+                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
+                  selectedTag === evt.tag
+                    ? 'bg-[#101B20] border-[#168BFF] shadow-sm'
+                    : 'bg-[#101B20]/60 border-[#1A363E] hover:border-[#1A363E]/80'
+                }`}
+              &gt;
+                &lt;div className="flex items-center justify-between font-mono"&gt;
+                  &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;{evt.tag}&lt;/span&gt;
+                  &lt;span className="text-[11px] text-[#A9BEB5]"&gt;{evt.date}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;p className="text-xs text-[#A9BEB5] mt-1 font-medium"&gt;{evt.name}&lt;/p&gt;
+                &lt;div className="mt-2 pt-1.5 border-t border-[#1A363E]/50 flex items-center justify-between text-[11px] font-mono text-[#A9BEB5]"&gt;
+                  &lt;span&gt;
+                    Prev: &lt;strong className="text-[#E8F2EE]"&gt;{evt.previous}&lt;/strong&gt;
+                  &lt;/span&gt;
+                  &lt;span&gt;
+                    Consensus: &lt;strong className="text-[#168BFF]"&gt;{evt.forecast}&lt;/strong&gt;
+                  &lt;/span&gt;
+                &lt;/div&gt;
+              &lt;/button&gt;
+            ))}
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/RiskManagementPage.tsx b/src/pages/workspace/RiskManagementPage.tsx
new file mode 100644
index 0000000..23db1de
--- /dev/null
+++ b/src/pages/workspace/RiskManagementPage.tsx
@@ -0,0 +1,220 @@
+import React, { useState } from 'react';
+import { Calculator, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';
+import { AssetSymbol } from '../../data/workspaceData';
+
+export const RiskManagementPage: React.FC = () =&gt; {
+  const [asset, setAsset] = useState&lt;AssetSymbol&gt;('XAU/USD');
+  const [accountBalance, setAccountBalance] = useState(25000);
+  const [riskPercent, setRiskPercent] = useState(1.0);
+  const [stopLossPips, setStopLossPips] = useState(30);
+  const [dailyLossCap, setDailyLossCap] = useState(3.0);
+  const [maxCorrelatedPairs, setMaxCorrelatedPairs] = useState(2);
+
+  const riskAmount = (accountBalance * riskPercent) / 100;
+  const calculatedLotSize = Math.max(0.01, +(riskAmount / (stopLossPips * 10)).toFixed(2));
+  const dailyLossDollars = (accountBalance * dailyLossCap) / 100;
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
+        {/* Left: Interactive Position Sizing &amp; Risk-Per-Trade Calculator */}
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#16A36A]/35 rounded-2xl p-5 sm:p-6 purple-glow-box space-y-5"&gt;
+          &lt;div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3"&gt;
+            &lt;span className="text-xs font-mono font-bold text-[#16A36A] flex items-center gap-1.5"&gt;
+              &lt;Calculator className="w-4 h-4" /&gt;
+              POSITION SIZING &amp; RISK CALCULATOR
+            &lt;/span&gt;
+            &lt;span className="text-xs font-mono font-bold text-[#168BFF]"&gt;
+              {calculatedLotSize} Lots
+            &lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="space-y-4 font-mono text-xs"&gt;
+            {/* Instrument Selector */}
+            &lt;div&gt;
+              &lt;span className="text-[#A9BEB5] block mb-1.5"&gt;Instrument Focus&lt;/span&gt;
+              &lt;div className="grid grid-cols-4 gap-2"&gt;
+                {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((sym) =&gt; (
+                  &lt;button
+                    key={sym}
+                    type="button"
+                    onClick={() =&gt; setAsset(sym)}
+                    className={`py-2 rounded-xl border font-bold transition-all ${
+                      asset === sym
+                        ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
+                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE]'
+                    }`}
+                  &gt;
+                    {sym}
+                  &lt;/button&gt;
+                ))}
+              &lt;/div&gt;
+            &lt;/div&gt;
+
+            {/* Account Balance */}
+            &lt;div&gt;
+              &lt;div className="flex justify-between mb-1"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Account Balance&lt;/span&gt;
+                &lt;span className="text-[#E8F2EE] font-bold"&gt;
+                  ${accountBalance.toLocaleString()}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;input
+                type="range"
+                min={1000}
+                max={100000}
+                step={1000}
+                value={accountBalance}
+                onChange={(e) =&gt; setAccountBalance(Number(e.target.value))}
+                className="w-full accent-[#16A36A] cursor-pointer"
+                aria-label="Account balance"
+              /&gt;
+            &lt;/div&gt;
+
+            {/* Risk Percent */}
+            &lt;div&gt;
+              &lt;div className="flex justify-between mb-1.5"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Risk Per Trade (%)&lt;/span&gt;
+                &lt;span className="text-[#168BFF] font-bold"&gt;{riskPercent.toFixed(1)}%&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="grid grid-cols-4 gap-2"&gt;
+                {[0.5, 1.0, 1.5, 2.0].map((pct) =&gt; (
+                  &lt;button
+                    key={pct}
+                    type="button"
+                    onClick={() =&gt; setRiskPercent(pct)}
+                    className={`py-2 rounded-xl border font-bold transition-all ${
+                      riskPercent === pct
+                        ? 'bg-[#168BFF] border-[#168BFF] text-[#E8F2EE]'
+                        : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5] hover:text-[#E8F2EE]'
+                    }`}
+                  &gt;
+                    {pct}%
+                  &lt;/button&gt;
+                ))}
+              &lt;/div&gt;
+            &lt;/div&gt;
+
+            {/* Stop-Loss Distance */}
+            &lt;div&gt;
+              &lt;div className="flex justify-between mb-1"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Stop-Loss Distance&lt;/span&gt;
+                &lt;span className="text-[#E8F2EE] font-bold"&gt;{stopLossPips} Pips&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;input
+                type="range"
+                min={10}
+                max={80}
+                step={5}
+                value={stopLossPips}
+                onChange={(e) =&gt; setStopLossPips(Number(e.target.value))}
+                className="w-full accent-[#168BFF] cursor-pointer"
+                aria-label="Stop-loss pips"
+              /&gt;
+            &lt;/div&gt;
+
+            {/* Calculated Outputs */}
+            &lt;div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"&gt;
+              &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] uppercase block"&gt;Risk Amount&lt;/span&gt;
+                &lt;span className="text-base font-bold text-[#E05252]"&gt;
+                  ${riskAmount.toFixed(2)}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#16A36A]/40"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] uppercase block"&gt;Position Size&lt;/span&gt;
+                &lt;span className="text-base font-bold text-[#16A36A]"&gt;
+                  {calculatedLotSize} Lots
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] uppercase block"&gt;Selected Pair&lt;/span&gt;
+                &lt;span className="text-base font-bold text-[#168BFF]"&gt;{asset}&lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Right: Stop-Loss Validation, Daily Loss Limits &amp; Exposure Controls */}
+        &lt;div className="lg:col-span-5 space-y-5"&gt;
+          {/* Daily Loss Limits &amp; Exposure Controls */}
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"&gt;
+            &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+              &lt;span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5"&gt;
+                &lt;Sliders className="w-4 h-4 text-[#168BFF]" /&gt;
+                Daily Loss &amp; Exposure Limits
+              &lt;/span&gt;
+              &lt;span className="text-xs font-mono text-[#E05252] font-bold"&gt;
+                -${dailyLossDollars.toFixed(0)} Max/Day
+              &lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;div className="space-y-4 font-mono text-xs"&gt;
+              &lt;div&gt;
+                &lt;div className="flex justify-between mb-1"&gt;
+                  &lt;span className="text-[#A9BEB5]"&gt;Daily Loss Cap (%)&lt;/span&gt;
+                  &lt;span className="text-[#168BFF] font-bold"&gt;{dailyLossCap.toFixed(1)}%&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;input
+                  type="range"
+                  min={1}
+                  max={6}
+                  step={0.5}
+                  value={dailyLossCap}
+                  onChange={(e) =&gt; setDailyLossCap(Number(e.target.value))}
+                  className="w-full accent-[#E05252] cursor-pointer"
+                  aria-label="Daily loss limit"
+                /&gt;
+              &lt;/div&gt;
+
+              &lt;div&gt;
+                &lt;div className="flex justify-between mb-1.5"&gt;
+                  &lt;span className="text-[#A9BEB5]"&gt;Max Correlated Exposure&lt;/span&gt;
+                  &lt;span className="text-[#16A36A] font-bold"&gt;{maxCorrelatedPairs} Positions&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="grid grid-cols-3 gap-2"&gt;
+                  {[1, 2, 3].map((count) =&gt; (
+                    &lt;button
+                      key={count}
+                      type="button"
+                      onClick={() =&gt; setMaxCorrelatedPairs(count)}
+                      className={`py-2 rounded-xl border font-bold transition-colors ${
+                        maxCorrelatedPairs === count
+                          ? 'bg-[#16A36A] border-[#16A36A] text-[#E8F2EE]'
+                          : 'bg-[#101B20] border-[#1A363E] text-[#A9BEB5]'
+                      }`}
+                    &gt;
+                      {count} Max
+                    &lt;/button&gt;
+                  ))}
+                &lt;/div&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          {/* Stop-Loss Validation Guardrails */}
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+            &lt;h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5"&gt;
+              &lt;ShieldAlert className="w-4 h-4 text-[#16A36A]" /&gt;
+              Mandatory Stop-Loss Validation
+            &lt;/h3&gt;
+            &lt;ul className="space-y-2.5 text-xs text-[#A9BEB5]"&gt;
+              &lt;li className="flex items-start gap-2"&gt;
+                &lt;CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" /&gt;
+                &lt;span&gt;Every trade proposal requires an explicit structural Stop-Loss level.&lt;/span&gt;
+              &lt;/li&gt;
+              &lt;li className="flex items-start gap-2"&gt;
+                &lt;CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" /&gt;
+                &lt;span&gt;Minimum 1:2.0 Risk-to-Reward ratio enforced before trader approval.&lt;/span&gt;
+              &lt;/li&gt;
+              &lt;li className="flex items-start gap-2"&gt;
+                &lt;CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" /&gt;
+                &lt;span&gt;Correlated USD block exposure cap prevents stacked drawdown.&lt;/span&gt;
+              &lt;/li&gt;
+            &lt;/ul&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/SettingsPage.tsx b/src/pages/workspace/SettingsPage.tsx
new file mode 100644
index 0000000..cff41fc
--- /dev/null
+++ b/src/pages/workspace/SettingsPage.tsx
@@ -0,0 +1,226 @@
+import React, { useState } from 'react';
+import { Bell, CheckCircle2, KeyRound, LogOut, Shield, Sliders, User } from 'lucide-react';
+import { NavigationRoute } from '../../types';
+import { useAuth } from '../../context/AuthContext';
+import { AssetSymbol, TimeframeOption } from '../../data/workspaceData';
+
+interface SettingsPageProps {
+  onNavigate: (route: NavigationRoute) =&gt; void;
+}
+
+export const SettingsPage: React.FC&lt;SettingsPageProps&gt; = ({ onNavigate }) =&gt; {
+  const { user, emailVerified, membershipStatus, userRole, isAdmin, logout } = useAuth();
+
+  const [defaultPair, setDefaultPair] = useState&lt;AssetSymbol&gt;('XAU/USD');
+  const [defaultTimeframe, setDefaultTimeframe] = useState&lt;TimeframeOption&gt;('M15');
+  const [requireManualConfirm, setRequireManualConfirm] = useState(true);
+  const [notifySignals, setNotifySignals] = useState(true);
+  const [notifyMacro, setNotifyMacro] = useState(true);
+  const [notifyNoTrade, setNotifyNoTrade] = useState(true);
+  const [savedNotice, setSavedNotice] = useState(false);
+
+  const handleSave = (e: React.FormEvent) =&gt; {
+    e.preventDefault();
+    setSavedNotice(true);
+    setTimeout(() =&gt; setSavedNotice(false), 3000);
+  };
+
+  const handleSignOut = async () =&gt; {
+    await logout();
+    onNavigate('/');
+  };
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
+        {/* Left: User Profile + Security &amp; Session Management */}
+        &lt;div className="lg:col-span-5 space-y-5"&gt;
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+            &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+              &lt;span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5"&gt;
+                &lt;User className="w-4 h-4 text-[#16A36A]" /&gt;
+                User Profile &amp; Permissions
+              &lt;/span&gt;
+              &lt;span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#168BFF]/15 text-[#168BFF] uppercase"&gt;
+                {userRole}
+              &lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;div className="space-y-2.5 text-xs font-mono"&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Email Address&lt;/span&gt;
+                &lt;span className="font-bold text-[#E8F2EE] break-all"&gt;
+                  {user?.email ?? 'Unavailable'}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Email Verification&lt;/span&gt;
+                &lt;span className={emailVerified ? 'text-[#16A36A] font-bold' : 'text-[#E69A36] font-bold'}&gt;
+                  {emailVerified ? 'Verified' : 'Unverified'}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Membership Status&lt;/span&gt;
+                &lt;span className={membershipStatus === 'active' ? 'text-[#16A36A] font-bold' : 'text-[#E69A36] font-bold'}&gt;
+                  {membershipStatus === 'active' ? 'Active' : 'Pending Admin Approval'}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex justify-between"&gt;
+                &lt;span className="text-[#A9BEB5]"&gt;Admin Access&lt;/span&gt;
+                &lt;span className="text-[#E8F2EE] font-bold"&gt;
+                  {isAdmin ? 'Admin Role' : 'Ordinary Trader (No Admin Access)'}
+                &lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+            &lt;h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5"&gt;
+              &lt;Shield className="w-4 h-4 text-[#168BFF]" /&gt;
+              Security &amp; Session Management
+            &lt;/h3&gt;
+            &lt;p className="text-xs text-[#A9BEB5] leading-relaxed"&gt;
+              Sessions and role claims are managed via Supabase Auth. Admin permissions remain strictly separate from ordinary trader accounts.
+            &lt;/p&gt;
+            &lt;div className="flex flex-col sm:flex-row gap-2.5 pt-1"&gt;
+              &lt;button
+                type="button"
+                onClick={() =&gt; onNavigate('/forgot-password')}
+                className="flex-1 py-2.5 px-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] text-xs font-semibold text-[#E8F2EE] flex items-center justify-center gap-1.5"
+              &gt;
+                &lt;KeyRound className="w-3.5 h-3.5 text-[#168BFF]" /&gt;
+                &lt;span&gt;Reset Password&lt;/span&gt;
+              &lt;/button&gt;
+              &lt;button
+                type="button"
+                onClick={handleSignOut}
+                className="flex-1 py-2.5 px-3 rounded-xl bg-[#E05252]/10 hover:bg-[#E05252]/20 border border-[#E05252]/30 text-xs font-bold text-[#E05252] flex items-center justify-center gap-1.5"
+              &gt;
+                &lt;LogOut className="w-3.5 h-3.5" /&gt;
+                &lt;span&gt;Sign Out&lt;/span&gt;
+              &lt;/button&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Right: Preferences, Notifications &amp; Trading Preferences */}
+        &lt;form
+          onSubmit={handleSave}
+          className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 sm:p-6 space-y-5"
+        &gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;span className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2"&gt;
+              &lt;Sliders className="w-4 h-4 text-[#16A36A]" /&gt;
+              Workspace &amp; Trading Preferences
+            &lt;/span&gt;
+            &lt;span className="text-[10px] font-mono text-[#A9BEB5]"&gt;Local UI Preferences&lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono"&gt;
+            &lt;div&gt;
+              &lt;label className="block text-[#A9BEB5] mb-1.5"&gt;Default Instrument&lt;/label&gt;
+              &lt;select
+                value={defaultPair}
+                onChange={(e) =&gt; setDefaultPair(e.target.value as AssetSymbol)}
+                className="w-full px-3 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
+              &gt;
+                &lt;option value="XAU/USD"&gt;XAU/USD&lt;/option&gt;
+                &lt;option value="EUR/USD"&gt;EUR/USD&lt;/option&gt;
+                &lt;option value="GBP/USD"&gt;GBP/USD&lt;/option&gt;
+                &lt;option value="US30"&gt;US30&lt;/option&gt;
+              &lt;/select&gt;
+            &lt;/div&gt;
+            &lt;div&gt;
+              &lt;label className="block text-[#A9BEB5] mb-1.5"&gt;Default Chart Timeframe&lt;/label&gt;
+              &lt;select
+                value={defaultTimeframe}
+                onChange={(e) =&gt; setDefaultTimeframe(e.target.value as TimeframeOption)}
+                className="w-full px-3 py-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] text-[#E8F2EE] focus:outline-none focus:border-[#16A36A]"
+              &gt;
+                {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) =&gt; (
+                  &lt;option key={tf} value={tf}&gt;
+                    {tf}
+                  &lt;/option&gt;
+                ))}
+              &lt;/select&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          {/* Notification Settings */}
+          &lt;div className="space-y-3 pt-2 border-t border-[#1A363E]"&gt;
+            &lt;h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8F2EE] flex items-center gap-1.5"&gt;
+              &lt;Bell className="w-3.5 h-3.5 text-[#168BFF]" /&gt;
+              Notification Preferences
+            &lt;/h4&gt;
+
+            &lt;label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs"&gt;
+              &lt;span className="text-[#E8F2EE]"&gt;New Signal Review Alerts&lt;/span&gt;
+              &lt;input
+                type="checkbox"
+                checked={notifySignals}
+                onChange={(e) =&gt; setNotifySignals(e.target.checked)}
+                className="accent-[#16A36A] w-4 h-4"
+              /&gt;
+            &lt;/label&gt;
+
+            &lt;label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs"&gt;
+              &lt;span className="text-[#E8F2EE]"&gt;CPI / PPI / NFP / FOMC Reminders&lt;/span&gt;
+              &lt;input
+                type="checkbox"
+                checked={notifyMacro}
+                onChange={(e) =&gt; setNotifyMacro(e.target.checked)}
+                className="accent-[#16A36A] w-4 h-4"
+              /&gt;
+            &lt;/label&gt;
+
+            &lt;label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#1A363E] cursor-pointer text-xs"&gt;
+              &lt;span className="text-[#E8F2EE]"&gt;NO TRADE Capital Shield Notices&lt;/span&gt;
+              &lt;input
+                type="checkbox"
+                checked={notifyNoTrade}
+                onChange={(e) =&gt; setNotifyNoTrade(e.target.checked)}
+                className="accent-[#16A36A] w-4 h-4"
+              /&gt;
+            &lt;/label&gt;
+          &lt;/div&gt;
+
+          {/* Trading Preferences */}
+          &lt;div className="space-y-2 pt-2 border-t border-[#1A363E]"&gt;
+            &lt;label className="flex items-center justify-between p-3 rounded-xl bg-[#101B20] border border-[#16A36A]/35 cursor-pointer text-xs"&gt;
+              &lt;div&gt;
+                &lt;span className="font-bold text-[#E8F2EE] block"&gt;
+                  Mandatory Human Approval Gate
+                &lt;/span&gt;
+                &lt;span className="text-[11px] text-[#A9BEB5]"&gt;
+                  Always require explicit trader review prior to MT5 validation
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;input
+                type="checkbox"
+                checked={requireManualConfirm}
+                onChange={(e) =&gt; setRequireManualConfirm(e.target.checked)}
+                className="accent-[#16A36A] w-4 h-4"
+              /&gt;
+            &lt;/label&gt;
+          &lt;/div&gt;
+
+          {savedNotice &amp;&amp; (
+            &lt;div className="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#16A36A] flex items-center gap-2"&gt;
+              &lt;CheckCircle2 className="w-4 h-4" /&gt;
+              &lt;span&gt;Workspace preferences updated for this session.&lt;/span&gt;
+            &lt;/div&gt;
+          )}
+
+          &lt;div className="flex justify-end"&gt;
+            &lt;button
+              type="submit"
+              className="px-5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold transition-colors"
+            &gt;
+              Save Preferences
+            &lt;/button&gt;
+          &lt;/div&gt;
+        &lt;/form&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/SignalHistoryPage.tsx b/src/pages/workspace/SignalHistoryPage.tsx
new file mode 100644
index 0000000..73f3fcc
--- /dev/null
+++ b/src/pages/workspace/SignalHistoryPage.tsx
@@ -0,0 +1,139 @@
+import React, { useState } from 'react';
+import { Clock3, History } from 'lucide-react';
+import {
+  MAX_SHARED_SIGNALS,
+  SHARED_PLATFORM_SIGNALS,
+} from '../../data/workspaceData';
+
+export const SignalHistoryPage: React.FC = () =&gt; {
+  const [filter, setFilter] = useState&lt;'ALL' | 'BUY' | 'SELL' | 'NO_TRADE'&gt;('ALL');
+
+  const signals = SHARED_PLATFORM_SIGNALS.slice(0, MAX_SHARED_SIGNALS).filter(
+    (sig) =&gt; filter === 'ALL' || sig.direction === filter
+  );
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box flex flex-col sm:flex-row sm:items-center justify-between gap-4"&gt;
+        &lt;div className="space-y-1"&gt;
+          &lt;div className="flex flex-wrap items-center gap-2"&gt;
+            &lt;span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#168BFF] flex items-center gap-1"&gt;
+              &lt;History className="w-3.5 h-3.5" /&gt;
+              Rolling Shared Platform Feed
+            &lt;/span&gt;
+            &lt;span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101B20] border border-[#1A363E] text-[#16A36A]"&gt;
+              Max {MAX_SHARED_SIGNALS} Signals Preserved
+            &lt;/span&gt;
+          &lt;/div&gt;
+          &lt;h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text"&gt;
+            Signal History &amp; Outcome Log
+          &lt;/h2&gt;
+          &lt;p className="text-xs text-[#A9BEB5]"&gt;
+            Showing {signals.length} of {SHARED_PLATFORM_SIGNALS.length} sample platform signals (capped at {MAX_SHARED_SIGNALS} shared records).
+          &lt;/p&gt;
+        &lt;/div&gt;
+
+        &lt;div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E] self-start sm:self-auto"&gt;
+          {(['ALL', 'BUY', 'SELL', 'NO_TRADE'] as const).map((tab) =&gt; (
+            &lt;button
+              key={tab}
+              type="button"
+              onClick={() =&gt; setFilter(tab)}
+              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
+                filter === tab
+                  ? 'bg-[#16A36A] text-[#E8F2EE]'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              {tab === 'NO_TRADE' ? 'NO TRADE' : tab}
+            &lt;/button&gt;
+          ))}
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      {/* Signal Records */}
+      &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
+        {signals.map((sig) =&gt; (
+          &lt;div
+            key={sig.id}
+            className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3.5 hover:border-[#168BFF]/40 transition-colors"
+          &gt;
+            &lt;div className="flex flex-wrap items-center justify-between gap-2"&gt;
+              &lt;div className="flex items-center gap-2 font-mono"&gt;
+                &lt;span className="text-xs text-[#A9BEB5]"&gt;{sig.id}&lt;/span&gt;
+                &lt;span className="font-bold text-sm text-[#E8F2EE]"&gt;{sig.pair}&lt;/span&gt;
+                &lt;span className="text-[11px] text-[#168BFF]"&gt;{sig.timeframe}&lt;/span&gt;
+              &lt;/div&gt;
+
+              &lt;div className="flex items-center gap-2 font-mono"&gt;
+                &lt;span
+                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
+                    sig.direction === 'BUY'
+                      ? 'bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/30'
+                      : sig.direction === 'SELL'
+                      ? 'bg-[#E05252]/20 text-[#E05252] border border-[#E05252]/30'
+                      : 'bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/30'
+                  }`}
+                &gt;
+                  {sig.direction === 'NO_TRADE' ? 'NO TRADE' : sig.direction}
+                &lt;/span&gt;
+                &lt;span className="text-[10px] px-2 py-0.5 rounded bg-[#101B20] border border-[#1A363E] text-[#A9BEB5]"&gt;
+                  {sig.status}
+                &lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+
+            &lt;div className="space-y-1"&gt;
+              &lt;span className="text-[11px] font-mono text-[#9560E8] font-semibold"&gt;
+                {sig.strategy} · Confidence {sig.confidence}%
+              &lt;/span&gt;
+              &lt;p className="text-xs text-[#A9BEB5] leading-relaxed"&gt;{sig.analysisReasoning}&lt;/p&gt;
+            &lt;/div&gt;
+
+            {sig.entryPrice !== undefined &amp;&amp; (
+              &lt;div className="grid grid-cols-3 gap-2 font-mono text-center text-xs"&gt;
+                &lt;div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Entry&lt;/span&gt;
+                  &lt;span className="font-bold text-[#E8F2EE]"&gt;{sig.entryPrice}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#E05252] block"&gt;SL&lt;/span&gt;
+                  &lt;span className="font-bold text-[#E8F2EE]"&gt;{sig.stopLoss}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="p-2 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#16A36A] block"&gt;TP&lt;/span&gt;
+                  &lt;span className="font-bold text-[#E8F2EE]"&gt;{sig.takeProfit}&lt;/span&gt;
+                &lt;/div&gt;
+              &lt;/div&gt;
+            )}
+
+            &lt;div className="pt-2 border-t border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono"&gt;
+              &lt;span className="text-[#A9BEB5] flex items-center gap-1"&gt;
+                &lt;Clock3 className="w-3.5 h-3.5" /&gt;
+                {sig.timestamp}
+              &lt;/span&gt;
+              &lt;div className="flex items-center gap-3"&gt;
+                {sig.riskReward &amp;&amp; (
+                  &lt;span className="text-[#168BFF] font-bold"&gt;R:R {sig.riskReward}&lt;/span&gt;
+                )}
+                &lt;span
+                  className={`font-bold ${
+                    sig.outcome === 'TP_HIT'
+                      ? 'text-[#16A36A]'
+                      : sig.outcome === 'SL_HIT'
+                      ? 'text-[#E05252]'
+                      : sig.outcome === 'PROTECTED'
+                      ? 'text-[#E69A36]'
+                      : 'text-[#A9BEB5]'
+                  }`}
+                &gt;
+                  Outcome: {sig.outcome ?? 'SAMPLE'}
+                &lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        ))}
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/StrategiesPage.tsx b/src/pages/workspace/StrategiesPage.tsx
new file mode 100644
index 0000000..a5d290b
--- /dev/null
+++ b/src/pages/workspace/StrategiesPage.tsx
@@ -0,0 +1,154 @@
+import React, { useState } from 'react';
+import { AlertCircle, CheckCircle2, Layers, ShieldAlert, Sparkles } from 'lucide-react';
+import { STRATEGY_MODULES } from '../../data/workspaceData';
+
+export const StrategiesPage: React.FC = () =&gt; {
+  const [styleFilter, setStyleFilter] = useState&lt;'ALL' | 'INTRADAY' | 'SWING'&gt;('ALL');
+  const [noTradeThreshold, setNoTradeThreshold] = useState(60);
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      {/* Header &amp; Intraday/Swing Filter */}
+      &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box flex flex-col sm:flex-row sm:items-center justify-between gap-4"&gt;
+        &lt;div className="space-y-1"&gt;
+          &lt;span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9560E8]"&gt;
+            Institutional Methodology
+          &lt;/span&gt;
+          &lt;h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text"&gt;
+            SMC, ICT, CRT &amp; Confluence Filters
+          &lt;/h2&gt;
+          &lt;p className="text-xs text-[#A9BEB5] max-w-2xl"&gt;
+            PipPilotAi unifies institutional price-action models with quantitative NO TRADE filters. Rule configurations below reflect the planned analytical engine architecture.
+          &lt;/p&gt;
+        &lt;/div&gt;
+
+        &lt;div className="flex items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E] shrink-0 self-start sm:self-auto"&gt;
+          {(['ALL', 'INTRADAY', 'SWING'] as const).map((tab) =&gt; (
+            &lt;button
+              key={tab}
+              type="button"
+              onClick={() =&gt; setStyleFilter(tab)}
+              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
+                styleFilter === tab
+                  ? 'bg-[#16A36A] text-[#E8F2EE]'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              {tab}
+            &lt;/button&gt;
+          ))}
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      {/* Strategy Modules Grid */}
+      &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
+        {STRATEGY_MODULES.filter((mod) =&gt; {
+          if (styleFilter === 'INTRADAY') return mod.cadence.includes('Intraday') || mod.code === 'IND';
+          if (styleFilter === 'SWING') return mod.cadence.includes('Swing') || mod.code === 'IND';
+          return true;
+        }).map((mod) =&gt; (
+          &lt;div
+            key={mod.id}
+            className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"
+          &gt;
+            &lt;div className="flex items-center justify-between"&gt;
+              &lt;div className="flex items-center gap-2.5"&gt;
+                &lt;span
+                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
+                  style={{ backgroundColor: `${mod.accent}20`, color: mod.accent }}
+                &gt;
+                  {mod.code}
+                &lt;/span&gt;
+                &lt;h3 className="text-base font-bold text-[#E8F2EE]"&gt;{mod.name}&lt;/h3&gt;
+              &lt;/div&gt;
+              &lt;span className="text-[11px] font-mono text-[#168BFF]"&gt;{mod.cadence}&lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;p className="text-xs text-[#A9BEB5] leading-relaxed"&gt;{mod.summary}&lt;/p&gt;
+
+            &lt;ul className="space-y-2 pt-2 border-t border-[#1A363E]"&gt;
+              {mod.rules.map((rule) =&gt; (
+                &lt;li key={rule} className="flex items-start gap-2 text-xs text-[#A9BEB5]"&gt;
+                  &lt;CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A] shrink-0 mt-0.5" /&gt;
+                  &lt;span&gt;{rule}&lt;/span&gt;
+                &lt;/li&gt;
+              ))}
+            &lt;/ul&gt;
+          &lt;/div&gt;
+        ))}
+      &lt;/div&gt;
+
+      {/* Confluence &amp; NO TRADE Filters */}
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-5"&gt;
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-4"&gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;span className="text-xs font-mono font-bold text-[#E8F2EE] flex items-center gap-1.5"&gt;
+              &lt;Layers className="w-4 h-4 text-[#168BFF]" /&gt;
+              Intraday vs Swing Confluence Matrix
+            &lt;/span&gt;
+            &lt;span className="text-[11px] font-mono text-[#16A36A]"&gt;Minimum 1:2.0 R:R&lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono"&gt;
+            &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5"&gt;
+              &lt;span className="text-[#168BFF] font-bold block"&gt;Intraday Execution&lt;/span&gt;
+              &lt;p className="text-[11px] font-sans text-[#A9BEB5]"&gt;
+                H1 bias + M15/M5 FVG mitigation during London and New York Kill Zones.
+              &lt;/p&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3.5 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1.5"&gt;
+              &lt;span className="text-[#9560E8] font-bold block"&gt;Swing Execution&lt;/span&gt;
+              &lt;p className="text-[11px] font-sans text-[#A9BEB5]"&gt;
+                D1/H4 CRT range sweeps and unmitigated weekly/daily Order Blocks.
+              &lt;/p&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        &lt;div className="lg:col-span-5 bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 space-y-4"&gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;span className="text-xs font-mono font-bold text-[#E69A36] flex items-center gap-1.5"&gt;
+              &lt;ShieldAlert className="w-4 h-4" /&gt;
+              NO TRADE Capital Filter
+            &lt;/span&gt;
+            &lt;span className="text-xs font-mono text-[#E8F2EE]"&gt;
+              Max Choppiness: &lt;strong className="text-[#168BFF]"&gt;{noTradeThreshold}&lt;/strong&gt;
+            &lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="space-y-2"&gt;
+            &lt;input
+              type="range"
+              min={45}
+              max={75}
+              step={1}
+              value={noTradeThreshold}
+              onChange={(e) =&gt; setNoTradeThreshold(Number(e.target.value))}
+              className="w-full accent-[#E69A36]"
+              aria-label="Choppiness NO TRADE threshold"
+            /&gt;
+            &lt;div className="flex justify-between text-[10px] font-mono text-[#A9BEB5]"&gt;
+              &lt;span&gt;Strict (45)&lt;/span&gt;
+              &lt;span&gt;Balanced (60)&lt;/span&gt;
+              &lt;span&gt;Permissive (75)&lt;/span&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] text-xs text-[#A9BEB5] flex items-start gap-2"&gt;
+            &lt;AlertCircle className="w-4 h-4 text-[#E69A36] shrink-0 mt-0.5" /&gt;
+            &lt;span&gt;
+              When market Choppiness exceeds &lt;strong className="text-[#E8F2EE] font-mono"&gt;{noTradeThreshold}.0&lt;/strong&gt; or conflicting H4/M15 bias is detected, proposals are automatically suppressed.
+            &lt;/span&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      &lt;div className="p-3.5 rounded-xl bg-[#152B30]/60 border border-[#1A363E] text-xs text-[#A9BEB5] flex items-center gap-2"&gt;
+        &lt;Sparkles className="w-4 h-4 text-[#9560E8] shrink-0" /&gt;
+        &lt;span&gt;
+          Strategy configuration parameters are local workspace preferences until live signal orchestration is connected.
+        &lt;/span&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/TradingPage.tsx b/src/pages/workspace/TradingPage.tsx
new file mode 100644
index 0000000..b91791f
--- /dev/null
+++ b/src/pages/workspace/TradingPage.tsx
@@ -0,0 +1,402 @@
+import React, { useState } from 'react';
+import {
+  Activity,
+  AlertTriangle,
+  Check,
+  CheckCircle2,
+  Cpu,
+  Workflow,
+  XCircle,
+} from 'lucide-react';
+import {
+  AssetSymbol,
+  SAMPLE_WATCHLIST,
+  TimeframeOption,
+} from '../../data/workspaceData';
+
+export const TradingPage: React.FC = () =&gt; {
+  const [selectedAsset, setSelectedAsset] = useState&lt;AssetSymbol&gt;('XAU/USD');
+  const [timeframe, setTimeframe] = useState&lt;TimeframeOption&gt;('M15');
+  const [approvalStatus, setApprovalStatus] = useState&lt;
+    'PENDING' | 'APPROVED' | 'REJECTED' | 'MT5_VALIDATED'
+  &gt;('PENDING');
+  const [showNoTradeDemo, setShowNoTradeDemo] = useState(false);
+
+  const assetDetails =
+    SAMPLE_WATCHLIST.find((a) =&gt; a.symbol === selectedAsset) ?? SAMPLE_WATCHLIST[0];
+
+  return (
+    &lt;div className="space-y-5"&gt;
+      {/* Instrument &amp; Multi-Timeframe Controls */}
+      &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"&gt;
+        &lt;div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]"&gt;
+          {(['XAU/USD', 'EUR/USD', 'GBP/USD', 'US30'] as const).map((asset) =&gt; (
+            &lt;button
+              key={asset}
+              type="button"
+              onClick={() =&gt; {
+                setSelectedAsset(asset);
+                setApprovalStatus('PENDING');
+              }}
+              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all ${
+                selectedAsset === asset
+                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              {asset}
+            &lt;/button&gt;
+          ))}
+        &lt;/div&gt;
+
+        &lt;div className="flex flex-wrap items-center gap-1 bg-[#101B20] p-1 rounded-xl border border-[#1A363E]"&gt;
+          {(['M5', 'M15', 'H1', 'H4', 'D1'] as const).map((tf) =&gt; (
+            &lt;button
+              key={tf}
+              type="button"
+              onClick={() =&gt; setTimeframe(tf)}
+              className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-md transition-all ${
+                timeframe === tf
+                  ? 'bg-[#168BFF] text-[#E8F2EE]'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              {tf}
+            &lt;/button&gt;
+          ))}
+        &lt;/div&gt;
+      &lt;/div&gt;
+
+      {/* Main Trading Grid */}
+      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
+        {/* Left: Market Analysis &amp; Multi-Timeframe Confluence Chart */}
+        &lt;div className="lg:col-span-7 space-y-5"&gt;
+          {/* Active Asset Info Strip */}
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"&gt;
+            &lt;div&gt;
+              &lt;div className="flex flex-wrap items-center gap-2"&gt;
+                &lt;h2 className="text-lg font-bold font-mono text-[#E8F2EE]"&gt;
+                  {selectedAsset}
+                &lt;/h2&gt;
+                &lt;span className="text-xs font-mono px-2 py-0.5 rounded bg-[#16A36A]/15 text-[#16A36A] border border-[#16A36A]/30 font-semibold"&gt;
+                  {assetDetails.bias}
+                &lt;/span&gt;
+                &lt;span className="text-xs font-mono text-[#168BFF] font-semibold"&gt;
+                  {timeframe}
+                &lt;/span&gt;
+              &lt;/div&gt;
+              &lt;p className="text-xs text-[#A9BEB5] font-mono mt-0.5"&gt;{assetDetails.name}&lt;/p&gt;
+            &lt;/div&gt;
+            &lt;div className="text-right"&gt;
+              &lt;span className="text-xl font-bold font-mono text-[#168BFF]"&gt;
+                {assetDetails.price}
+              &lt;/span&gt;
+              &lt;p
+                className={`text-xs font-mono ${
+                  assetDetails.positive ? 'text-[#16A36A]' : 'text-[#E05252]'
+                }`}
+              &gt;
+                {assetDetails.change} Session (Simulated)
+              &lt;/p&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          {/* Interactive Chart Canvas */}
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 purple-glow-box space-y-3"&gt;
+            &lt;div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#A9BEB5]"&gt;
+              &lt;span className="flex items-center gap-1.5"&gt;
+                &lt;Activity className="w-3.5 h-3.5 text-[#168BFF]" /&gt;
+                Structural Confluence View ({timeframe})
+              &lt;/span&gt;
+              &lt;div className="flex items-center gap-2"&gt;
+                &lt;span className="w-2 h-2 rounded-full bg-[#E69A36]" /&gt;
+                &lt;span&gt;Simulated Market Preview&lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+
+            &lt;div className="relative h-64 sm:h-72 w-full bg-[#101B20] rounded-xl border border-[#1A363E] p-3 flex flex-col justify-between overflow-hidden"&gt;
+              &lt;div className="z-10 flex flex-wrap gap-2 text-[10px] font-mono"&gt;
+                &lt;span className="bg-[#9560E8]/20 border border-[#9560E8]/40 text-[#E8F2EE] px-2 py-0.5 rounded"&gt;
+                  Fair Value Gap (H1)
+                &lt;/span&gt;
+                &lt;span className="bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] px-2 py-0.5 rounded"&gt;
+                  Liquidity Sweep Range
+                &lt;/span&gt;
+                &lt;span className="bg-[#16A36A]/20 border border-[#16A36A]/40 text-[#16A36A] px-2 py-0.5 rounded"&gt;
+                  Bullish Order Block
+                &lt;/span&gt;
+              &lt;/div&gt;
+
+              &lt;svg
+                className="w-full h-full relative z-0"
+                viewBox="0 0 600 220"
+                preserveAspectRatio="none"
+                aria-label="Illustrative structural confluence chart"
+              &gt;
+                &lt;defs&gt;
+                  &lt;linearGradient id="tradingChartFvg" x1="0" y1="0" x2="1" y2="0"&gt;
+                    &lt;stop offset="0%" stopColor="#9560E8" stopOpacity="0.3" /&gt;
+                    &lt;stop offset="100%" stopColor="#9560E8" stopOpacity="0.05" /&gt;
+                  &lt;/linearGradient&gt;
+                &lt;/defs&gt;
+                &lt;line x1="0" y1="50" x2="600" y2="50" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" /&gt;
+                &lt;line x1="0" y1="110" x2="600" y2="110" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" /&gt;
+                &lt;line x1="0" y1="170" x2="600" y2="170" stroke="#1A363E" strokeWidth="1" strokeDasharray="4 4" /&gt;
+                &lt;rect x="250" y="70" width="180" height="50" fill="url(#tradingChartFvg)" stroke="#9560E8" strokeWidth="1" strokeDasharray="2 2" /&gt;
+                &lt;text x="255" y="65" fill="#9560E8" fontSize="10" fontFamily="monospace"&gt;ICT Fair Value Gap&lt;/text&gt;
+                &lt;line x1="20" y1="160" x2="580" y2="160" stroke="#E69A36" strokeWidth="1" strokeDasharray="3 3" /&gt;
+                &lt;text x="30" y="155" fill="#E69A36" fontSize="9" fontFamily="monospace"&gt;Asian Session Low Swept&lt;/text&gt;
+
+                &lt;line x1="50" y1="80" x2="50" y2="140" stroke="#E05252" strokeWidth="1.5" /&gt;
+                &lt;rect x="44" y="90" width="12" height="35" fill="#E05252" rx="1" /&gt;
+                &lt;line x1="90" y1="110" x2="90" y2="175" stroke="#E05252" strokeWidth="1.5" /&gt;
+                &lt;rect x="84" y="120" width="12" height="42" fill="#E05252" rx="1" /&gt;
+                &lt;line x1="130" y1="105" x2="130" y2="185" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="124" y="110" width="12" height="30" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="180" y1="75" x2="180" y2="145" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="174" y="80" width="12" height="50" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="230" y1="65" x2="230" y2="115" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="224" y="70" width="12" height="30" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="280" y1="85" x2="280" y2="125" stroke="#E05252" strokeWidth="1.5" /&gt;
+                &lt;rect x="274" y="90" width="12" height="25" fill="#E05252" rx="1" /&gt;
+                &lt;line x1="330" y1="60" x2="330" y2="110" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="324" y="65" width="12" height="35" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="380" y1="40" x2="380" y2="90" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="374" y="45" width="12" height="35" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="430" y1="35" x2="430" y2="75" stroke="#E69A36" strokeWidth="1.5" /&gt;
+                &lt;rect x="424" y="40" width="12" height="20" fill="#E69A36" rx="1" /&gt;
+                &lt;line x1="480" y1="20" x2="480" y2="65" stroke="#16A36A" strokeWidth="1.5" /&gt;
+                &lt;rect x="474" y="25" width="12" height="30" fill="#16A36A" rx="1" /&gt;
+                &lt;line x1="486" y1="30" x2="570" y2="15" stroke="#168BFF" strokeWidth="2" strokeDasharray="3 3" /&gt;
+                &lt;circle cx="570" cy="15" r="3" fill="#168BFF" /&gt;
+              &lt;/svg&gt;
+
+              &lt;div className="z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#A9BEB5] pt-1 border-t border-[#1A363E]"&gt;
+                &lt;span&gt;
+                  CRT High: {assetDetails.crtHigh} | Low: {assetDetails.crtLow}
+                &lt;/span&gt;
+                &lt;span className="text-[#16A36A]"&gt;Regime: {assetDetails.regime}&lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+
+          {/* Multi-Timeframe Sync Breakdown */}
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-4 space-y-3"&gt;
+            &lt;div className="flex items-center justify-between text-xs font-mono"&gt;
+              &lt;span className="font-bold text-[#E8F2EE]"&gt;Multi-Timeframe Alignment&lt;/span&gt;
+              &lt;span className="text-[#16A36A]"&gt;D1 / H4 / H1 / M15&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono"&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Daily / H4 Bias&lt;/span&gt;
+                &lt;span className="text-[#16A36A] font-bold"&gt;Bullish Structure&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;H1 Liquidity&lt;/span&gt;
+                &lt;span className="text-[#168BFF] font-bold"&gt;Sweep Confirmed&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+                &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;M15 Trigger&lt;/span&gt;
+                &lt;span className="text-[#9560E8] font-bold"&gt;FVG Mitigated&lt;/span&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Right: Entry, Stop-Loss, Take-Profit &amp; Trader Approval */}
+        &lt;div className="lg:col-span-5 space-y-5"&gt;
+          &lt;div className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-2 flex gap-2"&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; {
+                setShowNoTradeDemo(false);
+                setApprovalStatus('PENDING');
+              }}
+              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
+                !showNoTradeDemo
+                  ? 'bg-[#16A36A] text-[#E8F2EE] shadow-sm'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              &lt;Cpu className="w-3.5 h-3.5" /&gt;
+              &lt;span&gt;Valid Setup&lt;/span&gt;
+            &lt;/button&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; setShowNoTradeDemo(true)}
+              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
+                showNoTradeDemo
+                  ? 'bg-[#E69A36] text-[#101B20] shadow-sm'
+                  : 'text-[#A9BEB5] hover:text-[#E8F2EE]'
+              }`}
+            &gt;
+              &lt;AlertTriangle className="w-3.5 h-3.5" /&gt;
+              &lt;span&gt;'NO TRADE' Filter&lt;/span&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+
+          {!showNoTradeDemo ? (
+            &lt;div className="bg-[#152B30] border border-[#16A36A]/40 rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+              &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+                &lt;span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#16A36A]/20 text-[#16A36A] border border-[#16A36A]/40 uppercase"&gt;
+                  Pending Trader Review
+                &lt;/span&gt;
+                &lt;span className="text-xs font-mono text-[#A9BEB5]"&gt;Sample #842&lt;/span&gt;
+              &lt;/div&gt;
+
+              &lt;div&gt;
+                &lt;div className="flex items-center justify-between"&gt;
+                  &lt;h3 className="text-base font-bold text-[#E8F2EE]"&gt;
+                    {selectedAsset} Trade Proposal
+                  &lt;/h3&gt;
+                  &lt;span className="text-xs font-mono text-[#168BFF] font-bold"&gt;
+                    R:R {assetDetails.riskReward}
+                  &lt;/span&gt;
+                &lt;/div&gt;
+                &lt;p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed"&gt;
+                  {assetDetails.confluenceNote}
+                &lt;/p&gt;
+              &lt;/div&gt;
+
+              &lt;div className="grid grid-cols-3 gap-2 font-mono text-center"&gt;
+                &lt;div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Entry Level&lt;/span&gt;
+                  &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;{assetDetails.entry}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#E05252] block"&gt;Stop Loss&lt;/span&gt;
+                  &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;{assetDetails.stopLoss}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="bg-[#101B20] p-2.5 rounded-xl border border-[#1A363E]"&gt;
+                  &lt;span className="text-[10px] text-[#16A36A] block"&gt;Take Profit&lt;/span&gt;
+                  &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;{assetDetails.takeProfit}&lt;/span&gt;
+                &lt;/div&gt;
+              &lt;/div&gt;
+
+              &lt;div className="space-y-3 pt-2"&gt;
+                &lt;div className="text-xs font-mono text-[#A9BEB5] flex items-center justify-between"&gt;
+                  &lt;span&gt;Semi-Automated Workflow:&lt;/span&gt;
+                  &lt;span className="font-bold text-[#E8F2EE]"&gt;Step 3: Trader Review&lt;/span&gt;
+                &lt;/div&gt;
+
+                {approvalStatus === 'PENDING' &amp;&amp; (
+                  &lt;div className="flex gap-2"&gt;
+                    &lt;button
+                      type="button"
+                      onClick={() =&gt; setApprovalStatus('APPROVED')}
+                      className="flex-1 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#16A36A]/20 transition-all"
+                    &gt;
+                      &lt;Check className="w-4 h-4" /&gt;
+                      &lt;span&gt;Approve Setup&lt;/span&gt;
+                    &lt;/button&gt;
+                    &lt;button
+                      type="button"
+                      onClick={() =&gt; setApprovalStatus('REJECTED')}
+                      className="flex-1 py-2.5 rounded-xl bg-[#101B20] hover:bg-[#1A363E] text-[#E05252] border border-[#E05252]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
+                    &gt;
+                      &lt;XCircle className="w-4 h-4" /&gt;
+                      &lt;span&gt;Reject Setup&lt;/span&gt;
+                    &lt;/button&gt;
+                  &lt;/div&gt;
+                )}
+
+                {approvalStatus === 'APPROVED' &amp;&amp; (
+                  &lt;div className="space-y-2.5"&gt;
+                    &lt;div className="p-3 rounded-xl bg-[#16A36A]/15 border border-[#16A36A]/40 text-xs text-[#E8F2EE] space-y-1"&gt;
+                      &lt;p className="font-bold text-[#16A36A] flex items-center gap-1.5"&gt;
+                        &lt;CheckCircle2 className="w-4 h-4" /&gt;
+                        Trader Approval Granted (Simulation)
+                      &lt;/p&gt;
+                      &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+                        Setup is queued for planned MT5 execution validation. Live MT5 bridge is not connected.
+                      &lt;/p&gt;
+                    &lt;/div&gt;
+                    &lt;button
+                      type="button"
+                      onClick={() =&gt; setApprovalStatus('MT5_VALIDATED')}
+                      className="w-full py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#147bdc] text-[#E8F2EE] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#168BFF]/25 transition-all"
+                    &gt;
+                      &lt;Workflow className="w-4 h-4" /&gt;
+                      &lt;span&gt;Simulate MT5 Independent Validation&lt;/span&gt;
+                    &lt;/button&gt;
+                  &lt;/div&gt;
+                )}
+
+                {approvalStatus === 'MT5_VALIDATED' &amp;&amp; (
+                  &lt;div className="p-3.5 rounded-xl bg-[#168BFF]/15 border border-[#168BFF]/40 text-xs space-y-2"&gt;
+                    &lt;div className="flex items-center justify-between text-[#168BFF] font-bold"&gt;
+                      &lt;span className="flex items-center gap-1.5"&gt;
+                        &lt;CheckCircle2 className="w-4 h-4" /&gt;
+                        MT5 Client Validated (Simulation)
+                      &lt;/span&gt;
+                      &lt;span className="text-[10px] font-mono"&gt;Spread: 1.2 pips OK&lt;/span&gt;
+                    &lt;/div&gt;
+                    &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+                      Simulated check passed. Actual MT5 order transmission is under development and not active.
+                    &lt;/p&gt;
+                    &lt;button
+                      type="button"
+                      onClick={() =&gt; setApprovalStatus('PENDING')}
+                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
+                    &gt;
+                      Reset Simulation
+                    &lt;/button&gt;
+                  &lt;/div&gt;
+                )}
+
+                {approvalStatus === 'REJECTED' &amp;&amp; (
+                  &lt;div className="p-3 rounded-xl bg-[#E05252]/15 border border-[#E05252]/40 text-xs text-[#E8F2EE] space-y-2"&gt;
+                    &lt;p className="font-bold text-[#E05252] flex items-center gap-1.5"&gt;
+                      &lt;XCircle className="w-4 h-4" /&gt; Setup Declined by Trader
+                    &lt;/p&gt;
+                    &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+                      Execution canceled. No instruction transmitted.
+                    &lt;/p&gt;
+                    &lt;button
+                      type="button"
+                      onClick={() =&gt; setApprovalStatus('PENDING')}
+                      className="text-[11px] font-bold text-[#E8F2EE] underline hover:text-[#168BFF]"
+                    &gt;
+                      Reset Simulation
+                    &lt;/button&gt;
+                  &lt;/div&gt;
+                )}
+              &lt;/div&gt;
+            &lt;/div&gt;
+          ) : (
+            &lt;div className="bg-[#152B30] border border-[#E69A36]/40 rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+              &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+                &lt;span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E69A36]/20 text-[#E69A36] border border-[#E69A36]/40 uppercase flex items-center gap-1"&gt;
+                  &lt;AlertTriangle className="w-3.5 h-3.5" /&gt; NO TRADE SIGNAL
+                &lt;/span&gt;
+                &lt;span className="text-xs font-mono text-[#E69A36]"&gt;Protection Active&lt;/span&gt;
+              &lt;/div&gt;
+
+              &lt;div&gt;
+                &lt;h3 className="text-base font-bold text-[#E8F2EE]"&gt;Capital Preservation Filter&lt;/h3&gt;
+                &lt;p className="text-xs text-[#A9BEB5] mt-1 leading-relaxed"&gt;
+                  Market conditions fail confluence requirements. The engine blocks trade proposals when noise is elevated.
+                &lt;/p&gt;
+              &lt;/div&gt;
+
+              &lt;div className="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-2 text-xs font-mono"&gt;
+                &lt;div className="flex justify-between"&gt;
+                  &lt;span className="text-[#A9BEB5]"&gt;Choppiness Index&lt;/span&gt;
+                  &lt;span className="text-[#E69A36] font-bold"&gt;64.2 / 100 (High Noise)&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="flex justify-between"&gt;
+                  &lt;span className="text-[#A9BEB5]"&gt;Orderflow Alignment&lt;/span&gt;
+                  &lt;span className="text-[#E05252] font-bold"&gt;Conflicted (M15 vs H4)&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="flex justify-between"&gt;
+                  &lt;span className="text-[#A9BEB5]"&gt;Economic Proximity&lt;/span&gt;
+                  &lt;span className="text-[#E8F2EE]"&gt;FOMC within 2 hours&lt;/span&gt;
+                &lt;/div&gt;
+              &lt;/div&gt;
+            &lt;/div&gt;
+          )}
+        &lt;/div&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/pages/workspace/WorkspaceDashboardPage.tsx b/src/pages/workspace/WorkspaceDashboardPage.tsx
new file mode 100644
index 0000000..b9195b3
--- /dev/null
+++ b/src/pages/workspace/WorkspaceDashboardPage.tsx
@@ -0,0 +1,391 @@
+import React from 'react';
+import {
+  Activity,
+  ArrowRight,
+  Calendar,
+  Clock3,
+  Cpu,
+  FlaskConical,
+  Lock,
+  Plug,
+  Shield,
+  Sparkles,
+  TrendingDown,
+  TrendingUp,
+} from 'lucide-react';
+import { NavigationRoute } from '../../types';
+import { useAuth } from '../../context/AuthContext';
+import {
+  CORE_ECONOMIC_EVENTS,
+  MAX_SHARED_SIGNALS,
+  SAMPLE_WATCHLIST,
+  SHARED_PLATFORM_SIGNALS,
+} from '../../data/workspaceData';
+
+interface WorkspaceDashboardPageProps {
+  onNavigate: (route: NavigationRoute) =&gt; void;
+}
+
+export const WorkspaceDashboardPage: React.FC&lt;WorkspaceDashboardPageProps&gt; = ({
+  onNavigate,
+}) =&gt; {
+  const { user, emailVerified, membershipStatus, userRole, isApproved } = useAuth();
+  const recentSignals = SHARED_PLATFORM_SIGNALS.slice(0, 3);
+
+  return (
+    &lt;div className="space-y-6"&gt;
+      {/* 1. Account &amp; Connection Status + Quick Actions */}
+      &lt;section className="grid grid-cols-1 lg:grid-cols-12 gap-4"&gt;
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 purple-glow-box space-y-4"&gt;
+          &lt;div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A363E] pb-3"&gt;
+            &lt;div&gt;
+              &lt;span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#16A36A]"&gt;
+                Workspace Overview
+              &lt;/span&gt;
+              &lt;h2 className="text-lg sm:text-xl font-extrabold text-[#E8F2EE] purple-glow-text"&gt;
+                Account &amp; Connection Status
+              &lt;/h2&gt;
+            &lt;/div&gt;
+            &lt;span
+              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
+                isApproved
+                  ? 'bg-[#16A36A]/15 text-[#16A36A] border-[#16A36A]/35'
+                  : 'bg-[#E69A36]/15 text-[#E69A36] border-[#E69A36]/35'
+              }`}
+            &gt;
+              {isApproved ? 'APPROVED MEMBER' : 'PENDING ADMIN APPROVAL'}
+            &lt;/span&gt;
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs"&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Authenticated User&lt;/span&gt;
+              &lt;span className="font-bold text-[#E8F2EE] truncate block mt-0.5"&gt;
+                {user?.email ?? 'Session active'}
+              &lt;/span&gt;
+              &lt;span className="text-[10px] text-[#16A36A] block mt-1"&gt;
+                {emailVerified ? 'Email Verified' : 'Verification Pending'} · {userRole.toUpperCase()}
+              &lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Membership Tier&lt;/span&gt;
+              &lt;span className="font-bold text-[#168BFF] block mt-0.5"&gt;
+                {membershipStatus === 'active' ? 'Cohort Active' : 'Step 3: Pending'}
+              &lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block mt-1"&gt;
+                {isApproved ? 'Full workspace unlocked' : 'Trading modules locked'}
+              &lt;/span&gt;
+            &lt;/div&gt;
+
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;MT5 Execution Bridge&lt;/span&gt;
+              &lt;span className="font-bold text-[#E69A36] block mt-0.5"&gt;Disconnected&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block mt-1"&gt;
+                Integration in development
+              &lt;/span&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        {/* Quick Actions Card */}
+        &lt;div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex items-center justify-between border-b border-[#1A363E] pb-3"&gt;
+            &lt;h3 className="text-sm font-bold text-[#E8F2EE]"&gt;Quick Trading Actions&lt;/h3&gt;
+            {!isApproved &amp;&amp; (
+              &lt;span className="text-[10px] font-mono text-[#E69A36] flex items-center gap-1"&gt;
+                &lt;Lock className="w-3 h-3" /&gt; Approval Required
+              &lt;/span&gt;
+            )}
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-2 gap-2.5"&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/trading')}
+              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#16A36A]/50 text-left transition-colors group"
+            &gt;
+              &lt;Activity className="w-4 h-4 text-[#16A36A] mb-1.5" /&gt;
+              &lt;span className="block text-xs font-bold text-[#E8F2EE]"&gt;Open Trading&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5"&gt;
+                Analysis &amp; setups &lt;ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /&gt;
+              &lt;/span&gt;
+            &lt;/button&gt;
+
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/risk')}
+              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#168BFF]/50 text-left transition-colors group"
+            &gt;
+              &lt;Shield className="w-4 h-4 text-[#168BFF] mb-1.5" /&gt;
+              &lt;span className="block text-xs font-bold text-[#E8F2EE]"&gt;Risk Calculator&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5"&gt;
+                Position sizing &lt;ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /&gt;
+              &lt;/span&gt;
+            &lt;/button&gt;
+
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/mt5')}
+              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#9560E8]/50 text-left transition-colors group"
+            &gt;
+              &lt;Plug className="w-4 h-4 text-[#9560E8] mb-1.5" /&gt;
+              &lt;span className="block text-xs font-bold text-[#E8F2EE]"&gt;MT5 Status&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5"&gt;
+                Bridge &amp; mode &lt;ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /&gt;
+              &lt;/span&gt;
+            &lt;/button&gt;
+
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/backtesting')}
+              className="p-3 rounded-xl bg-[#101B20] hover:bg-[#1B363C] border border-[#1A363E] hover:border-[#E69A36]/50 text-left transition-colors group"
+            &gt;
+              &lt;FlaskConical className="w-4 h-4 text-[#E69A36] mb-1.5" /&gt;
+              &lt;span className="block text-xs font-bold text-[#E8F2EE]"&gt;Backtesting&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] flex items-center gap-1 mt-0.5"&gt;
+                Strategy lab &lt;ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /&gt;
+              &lt;/span&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/section&gt;
+
+      {/* 2. Market Watchlist &amp; 3. AI Engine Status */}
+      &lt;section className="grid grid-cols-1 lg:grid-cols-12 gap-4"&gt;
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex flex-wrap items-center justify-between gap-2"&gt;
+            &lt;div&gt;
+              &lt;h3 className="text-sm font-bold text-[#E8F2EE]"&gt;Market Watchlist&lt;/h3&gt;
+              &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+                Sample instrument snapshot (no live market feed connected)
+              &lt;/p&gt;
+            &lt;/div&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/trading')}
+              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
+            &gt;
+              &lt;span&gt;Full Trading View&lt;/span&gt;
+              &lt;ArrowRight className="w-3.5 h-3.5" /&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono"&gt;
+            {SAMPLE_WATCHLIST.map((item) =&gt; (
+              &lt;div
+                key={item.symbol}
+                className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] space-y-1"
+              &gt;
+                &lt;div className="flex items-center justify-between"&gt;
+                  &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;{item.symbol}&lt;/span&gt;
+                  {item.positive ? (
+                    &lt;TrendingUp className="w-3.5 h-3.5 text-[#16A36A]" /&gt;
+                  ) : (
+                    &lt;TrendingDown className="w-3.5 h-3.5 text-[#E05252]" /&gt;
+                  )}
+                &lt;/div&gt;
+                &lt;span className="block text-sm font-bold text-[#168BFF]"&gt;{item.price}&lt;/span&gt;
+                &lt;span
+                  className={`block text-[10px] font-semibold ${
+                    item.positive ? 'text-[#16A36A]' : 'text-[#E05252]'
+                  }`}
+                &gt;
+                  {item.change} · {item.bias}
+                &lt;/span&gt;
+              &lt;/div&gt;
+            ))}
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        &lt;div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex items-center justify-between"&gt;
+            &lt;h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2"&gt;
+              &lt;Cpu className="w-4 h-4 text-[#9560E8]" /&gt;
+              &lt;span&gt;AI Engine Status&lt;/span&gt;
+            &lt;/h3&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/strategies')}
+              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
+            &gt;
+              &lt;span&gt;Strategies&lt;/span&gt;
+              &lt;ArrowRight className="w-3.5 h-3.5" /&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+
+          &lt;div className="space-y-2 text-xs font-mono"&gt;
+            &lt;div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+              &lt;span className="text-[#A9BEB5]"&gt;SMC / ICT / CRT Confluence&lt;/span&gt;
+              &lt;span className="text-[#E69A36] font-bold"&gt;Preview Mode&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+              &lt;span className="text-[#A9BEB5]"&gt;Choppiness 'NO TRADE' Shield&lt;/span&gt;
+              &lt;span className="text-[#16A36A] font-bold"&gt;Active (Rule Demo)&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-2.5 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between"&gt;
+              &lt;span className="text-[#A9BEB5]"&gt;Human Approval Gate&lt;/span&gt;
+              &lt;span className="text-[#168BFF] font-bold"&gt;Enforced&lt;/span&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/section&gt;
+
+      {/* 4. Recent Signal Summaries &amp; 5. Risk Overview */}
+      &lt;section className="grid grid-cols-1 lg:grid-cols-12 gap-4"&gt;
+        &lt;div className="lg:col-span-7 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex flex-wrap items-center justify-between gap-2"&gt;
+            &lt;div&gt;
+              &lt;h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2"&gt;
+                &lt;Clock3 className="w-4 h-4 text-[#168BFF]" /&gt;
+                &lt;span&gt;Recent Signal Summaries&lt;/span&gt;
+              &lt;/h3&gt;
+              &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+                Sample shared platform feed (capped at {MAX_SHARED_SIGNALS} max records)
+              &lt;/p&gt;
+            &lt;/div&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/signals')}
+              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
+            &gt;
+              &lt;span&gt;All Signals ({MAX_SHARED_SIGNALS} Max)&lt;/span&gt;
+              &lt;ArrowRight className="w-3.5 h-3.5" /&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+
+          &lt;div className="space-y-2"&gt;
+            {recentSignals.map((sig) =&gt; (
+              &lt;div
+                key={sig.id}
+                className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
+              &gt;
+                &lt;div className="flex items-center gap-2.5 min-w-0"&gt;
+                  &lt;span className="font-bold text-[#E8F2EE]"&gt;{sig.pair}&lt;/span&gt;
+                  &lt;span
+                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
+                      sig.direction === 'BUY'
+                        ? 'bg-[#16A36A]/20 text-[#16A36A]'
+                        : sig.direction === 'SELL'
+                        ? 'bg-[#E05252]/20 text-[#E05252]'
+                        : 'bg-[#E69A36]/20 text-[#E69A36]'
+                    }`}
+                  &gt;
+                    {sig.direction === 'NO_TRADE' ? 'NO TRADE' : sig.direction}
+                  &lt;/span&gt;
+                  &lt;span className="text-[11px] text-[#A9BEB5] truncate"&gt;{sig.strategy}&lt;/span&gt;
+                &lt;/div&gt;
+                &lt;div className="flex items-center gap-3"&gt;
+                  {sig.riskReward &amp;&amp; (
+                    &lt;span className="text-[#168BFF] font-bold"&gt;{sig.riskReward}&lt;/span&gt;
+                  )}
+                  &lt;span className="text-[10px] text-[#A9BEB5]"&gt;{sig.timestamp}&lt;/span&gt;
+                &lt;/div&gt;
+              &lt;/div&gt;
+            ))}
+          &lt;/div&gt;
+        &lt;/div&gt;
+
+        &lt;div className="lg:col-span-5 bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+          &lt;div className="flex items-center justify-between"&gt;
+            &lt;h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2"&gt;
+              &lt;Shield className="w-4 h-4 text-[#16A36A]" /&gt;
+              &lt;span&gt;Risk Overview&lt;/span&gt;
+            &lt;/h3&gt;
+            &lt;button
+              type="button"
+              onClick={() =&gt; onNavigate('/app/risk')}
+              className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
+            &gt;
+              &lt;span&gt;Manage Risk&lt;/span&gt;
+              &lt;ArrowRight className="w-3.5 h-3.5" /&gt;
+            &lt;/button&gt;
+          &lt;/div&gt;
+
+          &lt;div className="grid grid-cols-2 gap-2.5 font-mono text-xs"&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Default Risk / Trade&lt;/span&gt;
+              &lt;span className="text-base font-bold text-[#168BFF]"&gt;1.0%&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Daily Loss Cap&lt;/span&gt;
+              &lt;span className="text-base font-bold text-[#E05252]"&gt;3.0%&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;SL Validation&lt;/span&gt;
+              &lt;span className="text-xs font-bold text-[#16A36A]"&gt;Mandatory&lt;/span&gt;
+            &lt;/div&gt;
+            &lt;div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E]"&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block"&gt;Correlated Exposure&lt;/span&gt;
+              &lt;span className="text-xs font-bold text-[#E8F2EE]"&gt;Max 2 Pairs&lt;/span&gt;
+            &lt;/div&gt;
+          &lt;/div&gt;
+        &lt;/div&gt;
+      &lt;/section&gt;
+
+      {/* 6. Upcoming CPI, PPI, NFP and FOMC Events */}
+      &lt;section className="bg-[#152B30] border border-[#1A363E] rounded-2xl p-5 space-y-3"&gt;
+        &lt;div className="flex flex-wrap items-center justify-between gap-2"&gt;
+          &lt;div&gt;
+            &lt;h3 className="text-sm font-bold text-[#E8F2EE] flex items-center gap-2"&gt;
+              &lt;Calendar className="w-4 h-4 text-[#168BFF]" /&gt;
+              &lt;span&gt;Upcoming CPI, PPI, NFP &amp; FOMC Events&lt;/span&gt;
+            &lt;/h3&gt;
+            &lt;p className="text-[11px] text-[#A9BEB5]"&gt;
+              Core macro catalysts monitored for pre-event volatility protection (sample schedule)
+            &lt;/p&gt;
+          &lt;/div&gt;
+          &lt;button
+            type="button"
+            onClick={() =&gt; onNavigate('/app/news')}
+            className="text-xs font-bold text-[#168BFF] hover:underline flex items-center gap-1"
+          &gt;
+            &lt;span&gt;News Intelligence&lt;/span&gt;
+            &lt;ArrowRight className="w-3.5 h-3.5" /&gt;
+          &lt;/button&gt;
+        &lt;/div&gt;
+
+        &lt;div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs"&gt;
+          {CORE_ECONOMIC_EVENTS.map((evt) =&gt; (
+            &lt;div
+              key={evt.id}
+              className="bg-[#101B20] p-3 rounded-xl border border-[#1A363E] space-y-1"
+            &gt;
+              &lt;div className="flex items-center justify-between"&gt;
+                &lt;span
+                  className={`font-bold text-[10px] ${
+                    evt.impact === 'Critical' ? 'text-[#E05252]' : 'text-[#168BFF]'
+                  }`}
+                &gt;
+                  {evt.tag}
+                &lt;/span&gt;
+                &lt;span className="text-[10px] text-[#168BFF]"&gt;Est: {evt.forecast}&lt;/span&gt;
+              &lt;/div&gt;
+              &lt;span className="text-[#E8F2EE] font-bold block"&gt;{evt.date}&lt;/span&gt;
+              &lt;span className="text-[10px] text-[#A9BEB5] block truncate"&gt;
+                {evt.affectedAssets.join(', ')}
+              &lt;/span&gt;
+            &lt;/div&gt;
+          ))}
+        &lt;/div&gt;
+      &lt;/section&gt;
+
+      {/* Footer Note */}
+      &lt;div className="p-3.5 rounded-xl bg-[#152B30]/60 border border-[#1A363E] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A9BEB5]"&gt;
+        &lt;span className="flex items-center gap-2"&gt;
+          &lt;Sparkles className="w-4 h-4 text-[#9560E8] shrink-0" /&gt;
+          &lt;span&gt;
+            This overview summarizes workspace modules. Select any navigation item on the left to open its dedicated view.
+          &lt;/span&gt;
+        &lt;/span&gt;
+        &lt;button
+          type="button"
+          onClick={() =&gt; onNavigate('/app/support')}
+          className="text-[#16A36A] font-semibold hover:underline"
+        &gt;
+          Platform Guidance
+        &lt;/button&gt;
+      &lt;/div&gt;
+    &lt;/div&gt;
+  );
+};
diff --git a/src/types/index.ts b/src/types/index.ts
index beb56cb..694f9f7 100644
--- a/src/types/index.ts
+++ b/src/types/index.ts
@@ -1,21 +1,37 @@
-export type NavigationRoute = 
-  | '/' 
-  | '/app' 
-  | '/register' 
-  | '/login' 
-  | '/forgot-password' 
-  | '/reset-password' 
+export type WorkspaceRoute =
+  | '/app'
+  | '/app/trading'
+  | '/app/strategies'
+  | '/app/news'
+  | '/app/risk'
+  | '/app/mt5'
+  | '/app/signals'
+  | '/app/backtesting'
+  | '/app/settings'
+  | '/app/support';
+
+export type NavigationRoute =
+  | '/'
+  | WorkspaceRoute
+  | '/register'
+  | '/login'
+  | '/forgot-password'
+  | '/reset-password'
   | '/verify-email';
 
 export type MembershipApprovalStatus = 'none' | 'pending_approval' | 'active';
 
+export type UserRole = 'trader' | 'admin';
+
 export interface UserProfile {
   id: string;
   email: string;
   emailVerified: boolean;
   membershipStatus: MembershipApprovalStatus;
+  role: UserRole;
   createdAt: string;
 }
+
 export interface EconomicEvent {
   id: string;
   name: string;
@@ -33,13 +49,18 @@ export interface TradingSignal {
   pair: string;
   direction: 'BUY' | 'SELL' | 'NO_TRADE';
   timeframe: string;
-  strategy: 'SMC Order Block' | 'ICT Silver Bullet' | 'CRT Range Expansion' | 'Market Choppiness Filter';
+  strategy:
+    | 'SMC Order Block'
+    | 'ICT Silver Bullet'
+    | 'CRT Range Expansion'
+    | 'Market Choppiness Filter';
   entryPrice?: number;
   stopLoss?: number;
   takeProfit?: number;
   riskReward?: string;
   confidence: number;
   status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'DISMISSED';
+  outcome?: 'TP_HIT' | 'SL_HIT' | 'BREAKEVEN' | 'PROTECTED' | 'PENDING';
   timestamp: string;
   analysisReasoning: string;
 }
diff --git a/vite.config.ts b/vite.config.ts
index 80a6ab5..b4aa825 100644
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -8,7 +8,7 @@ export default defineConfig(() =&gt; {
     plugins: [react(), tailwindcss()],
     resolve: {
       alias: {
-        '@': path.resolve(__dirname, '.'),
+        '@': path.resolve(import.meta.dirname, '.'),
       },
     },
     define: {
@@ -20,6 +20,9 @@ export default defineConfig(() =&gt; {
       ),
     },
     server: {
+      port: 3000,
+      host: '0.0.0.0',
+      allowedHosts: true as const,
       // HMR is disabled in AI Studio via DISABLE_HMR env var.
       // Do not modify—file watching is disabled to prevent flickering during agent edits.
       hmr: process.env.DISABLE_HMR !== 'true',
</textarea></div></form></div></div></div></number></timeframeoption></assetsymbol></boolean></session></void></authresponse<{></authresponse<{></div></dashboardpreviewpageprops></dashboardpreviewpage></dashboardpreviewpage></supabaseconfigbanner></navigationroute></navigationroute></body></html>
------MultipartBoundary--A4d08sTGbR7JITrLHWRaBfc8gPZmoF7jGlCh82tXiD------
