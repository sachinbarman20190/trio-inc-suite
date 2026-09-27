'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { NotificationProvider, useNotification } from '@/lib/notification-context';
import { NotificationToastContainer } from '@/components/NotificationToastContainer';
import { LiveMeetingBanner } from '@/components/LiveMeetingBanner';
import { 
  QuickNavigationCommandPalette, 
  DashboardModuleId 
} from '@/components/QuickNavigationCommandPalette';
import { useDashboardNavigation } from '@/lib/use-dashboard-navigation';

const ModuleLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[300px] text-slate-400">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading module...</span>
    </div>
  </div>
);

const TeamChatModule = dynamic(() => import('@/components/TeamChatModule').then(m => m.TeamChatModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const MeetingHubModule = dynamic(() => import('@/components/MeetingHubModule').then(m => m.MeetingHubModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const DoubtsAndUpdatesModule = dynamic(() => import('@/components/DoubtsAndUpdatesModule').then(m => m.DoubtsAndUpdatesModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const PODProfitEngineModule = dynamic(() => import('@/components/PODProfitEngineModule').then(m => m.PODProfitEngineModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const AdVideoRepositoryModule = dynamic(() => import('@/components/AdVideoRepositoryModule').then(m => m.AdVideoRepositoryModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const MediaAssetHubModule = dynamic(() => import('@/components/MediaAssetHubModule').then(m => m.MediaAssetHubModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const InstagramTrackerModule = dynamic(() => import('@/components/InstagramTrackerModule').then(m => m.InstagramTrackerModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const BusinessAnalyticsDashboardModule = dynamic(() => import('@/components/BusinessAnalyticsDashboardModule').then(m => m.BusinessAnalyticsDashboardModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
const AdminControlModule = dynamic(() => import('@/components/AdminControlModule').then(m => m.AdminControlModule), {
  ssr: false,
  loading: () => <ModuleLoadingFallback />,
});
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Video, 
  HelpCircle, 
  Calculator, 
  Film, 
  Instagram, 
  BarChart3, 
  Shield, 
  HardDrive, 
  LogIn, 
  LogOut, 
  User, 
  DownloadCloud, 
  Users, 
  Radio, 
  Sparkles,
  Menu,
  X,
  Search,
  Bell
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardModuleId>('chat');

  return (
    <NotificationProvider activeTab={activeTab} setActiveTab={setActiveTab}>
      <DashboardView activeTab={activeTab} setActiveTab={setActiveTab} />
    </NotificationProvider>
  );
}

function DashboardView({
  activeTab,
  setActiveTab,
}: {
  activeTab: DashboardModuleId;
  setActiveTab: (tab: DashboardModuleId) => void;
}) {
  const { 
    currentUser,
    userRole,
    isAdmin,
    isLoading,
    user, 
    teamMember, 
    isWhitelisted, 
    whitelist, 
    isUnauthorized,
    unauthorizedEmail,
    clearUnauthorized,
    signInWithGoogle, 
    signOut, 
    isAuthenticated 
  } = useAuth();

  const { unreadCounts } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fast unified navigation handler: switches tab and closes More menu immediately
  const handleTabSwitch = (tab: DashboardModuleId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Global keyboard shortcut hook (Ctrl+K / Cmd+K, Alt+ArrowRight/Left, 1-8 navigation)
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    openCommandPalette,
    shortcutLabel
  } = useDashboardNavigation(activeTab, setActiveTab);

  // PWA installation prompt handling
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration:', err);
      });
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 3-second hard timeout fallback: guarantees splash screen NEVER freezes indefinitely
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallable(false);
    }
  };

  // 1. Splash Screen with 3-second hard timeout fallback
  if (isLoading && !authTimedOut) {
    return (
      <main className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/20 animate-pulse">
            3P
          </div>
          <div className="flex items-center space-x-2 text-slate-400 text-sm font-medium">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Verifying Trio INC. Workspace...</span>
          </div>
        </div>
      </main>
    );
  }

  // 2. CLEAN STATE RESTRICTION:
  // If an unauthorized email logs in, show a gentle access-denied screen and automatically trigger auth.signOut()
  if (isUnauthorized || (currentUser && !isWhitelisted)) {
    const attemptedEmail = unauthorizedEmail || currentUser?.email || user?.email || 'Unknown User';
    return (
      <main className="min-h-screen bg-[#070a12] flex items-center justify-center p-4 font-sans selection:bg-sky-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Access Restricted</h1>
            <p className="text-xs text-amber-400 font-mono mt-1 break-all bg-amber-500/10 border border-amber-500/20 py-1 px-2.5 rounded-lg inline-block">
              {attemptedEmail}
            </p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trio INC. is a strictly private operational hub restricted to designated team members. Your Google account is not on the active whitelist.
          </p>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-200">Authorized Team Accounts:</div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Sachin Barman (Admin &bull; sachinbarman20190@gmail.com)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <span>Suraj Barman (Member &bull; surajbarman50191@gmail.com)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <span>Suraj Barman (Secondary / Lab &bull; suraj.yt.science@gmail.com)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <span>Member 3 (Member &bull; member3@gmail.com)</span>
            </div>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                clearUnauthorized();
                signInWithGoogle();
              }}
              className="w-full py-3 min-h-[44px] cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In with Authorized Google Account
            </button>
            <button
              onClick={() => clearUnauthorized()}
              className="w-full py-2.5 min-h-[40px] cursor-pointer bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 3. UNRESTRICTED LOGIN SCREEN:
  // Render clean Material 3 Google Sign-In view immediately if unauthenticated
  if (!currentUser || !isWhitelisted) {
    return (
      <main className="min-h-screen bg-[#070a12] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/10 via-indigo-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
          {/* Logo & Identity */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-sky-500/25">
                3P
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">TRIO INC.</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  POD HUB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Private 3-Member Operations &bull; Admin 5 TB Storage
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to the Trio INC. operational workspace. Please authenticate with your authorized Google account to continue.
          </p>

          {/* Clean Material 3 Google Sign-In Button */}
          <div className="space-y-3 pt-1">
            <button
              onClick={() => signInWithGoogle()}
              disabled={isLoading}
              className="w-full min-h-[48px] cursor-pointer bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm sm:text-base rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed border border-slate-200"
            >
              {/* Official Google Multicolor G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.03c-1.08.72-2.46 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.13C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.18 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.61l4.01 3.13c.95-2.85 3.6-4.97 6.73-4.97z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Whitelisted Members Reference */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Authorized Team Members:</span>
              <span className="text-[10px] text-slate-500 font-mono">Team Whitelist</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">Sachin Barman (Admin &bull; sachinbarman20190@gmail.com)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span className="truncate">Suraj Barman (Member &bull; surajbarman50191@gmail.com)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span className="truncate">Suraj Barman (Secondary / Lab &bull; suraj.yt.science@gmail.com)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="truncate">Member 3 (Member &bull; member3@gmail.com)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative">
      {/* Floating Material 3 In-App Toast Overlay */}
      <NotificationToastContainer />

      {/* Top Navigation Bar - Minimal & Compact h-14 Header */}
      <header className="sticky top-0 z-40 h-14 bg-[#090d16]/95 border-b border-slate-800/80 backdrop-blur-md px-3 sm:px-6 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md shadow-sky-500/20">
                3P
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">TRIO INC.</h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shrink-0">
                  POD HUB
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate leading-tight">
                3-Member Operations &bull; Storage: <strong className="text-white">Admin 5 TB Drive</strong>
              </p>
            </div>
          </div>

          {/* Quick Member Simulation Switcher, User Profile & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Command Palette Shortcut Trigger (Ctrl+K / Cmd+K) */}
            <button
              onClick={openCommandPalette}
              className="cursor-pointer min-h-[36px] hidden md:inline-flex items-center gap-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-1 rounded-xl text-xs font-medium transition-all shadow-sm group"
              title={`Quick Module Switcher (${shortcutLabel})`}
            >
              <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-slate-400">Quick Jump...</span>
              <kbd className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded text-sky-400">
                {shortcutLabel}
              </kbd>
            </button>

            {/* Install PWA button */}
            {installable && (
              <button
                onClick={handleInstallPWA}
                className="hidden md:inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-md"
              >
                <DownloadCloud className="w-3.5 h-3.5" /> Install App
              </button>
            )}

            {/* Authenticated Member Session Clearance */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">
                {isAdmin ? 'Admin Clearance' : 'Member Clearance'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {userRole || 'Active'}
              </span>
            </div>

            {/* Active User Card & Sign In/Out */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 px-2 sm:px-2.5 py-1 rounded-xl">
              {currentUser?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={currentUser.photoURL} 
                  alt={teamMember?.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-sky-500/40 shrink-0" 
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">
                  {teamMember?.displayName.substring(0, 2).toUpperCase() || '3P'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  {teamMember?.displayName}
                  {isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {teamMember?.email}
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => signOut()}
                  className="cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="cursor-pointer min-h-[32px] px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  title="Sign In with Google"
                >
                  <LogIn className="w-3 h-3" />
                  <span className="hidden sm:inline">Google Login</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger / Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="cursor-pointer min-h-[40px] min-w-[40px] relative flex items-center justify-center md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors touch-manipulation active:scale-95"
              title={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-sky-400" /> : <Menu className="w-4 h-4" />}
              {!mobileMenuOpen && (unreadCounts.chat > 0 || unreadCounts.doubts > 0 || unreadCounts.sales > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#090d16] animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Top Navigation Tab Bar (8 Modules) - Desktop Only */}
      <nav className="hidden md:block bg-[#0b101c] border-b border-slate-800/80 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 sm:py-2 touch-pan-x">
          {/* Chat Tab with dynamic unread indicator */}
          <button
            onClick={() => handleTabSwitch('chat')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {unreadCounts.chat > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b101c] animate-pulse" />
              )}
            </div>
            <span>Team Chat & Voice Notes</span>
            {unreadCounts.chat > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {unreadCounts.chat}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('meetings')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'meetings'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Google Meet Hub
          </button>

          {/* Doubts Tab with dynamic unread indicator */}
          <button
            onClick={() => handleTabSwitch('doubts')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'doubts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {unreadCounts.doubts > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0b101c] animate-pulse" />
              )}
            </div>
            <span>Doubts & Updates</span>
            {unreadCounts.doubts > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {unreadCounts.doubts}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('pod-calc')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'pod-calc'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            POD Profit Engine
          </button>

          <button
            onClick={() => handleTabSwitch('creatives')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'creatives'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Ad Video & Creatives
          </button>

          <button
            onClick={() => handleTabSwitch('media-hub')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'media-hub'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            Media Hub &amp; Gallery
          </button>

          <button
            onClick={() => handleTabSwitch('instagram')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'instagram'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Instagram Tracker
          </button>

          {/* POD Sales Analytics Tab with celebration badge */}
          <button
            onClick={() => handleTabSwitch('analytics')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="relative">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {unreadCounts.sales > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b101c] animate-pulse" />
              )}
            </div>
            <span>POD Sales Analytics</span>
            {unreadCounts.sales > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {unreadCounts.sales}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('admin')}
            className={`cursor-pointer min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Admin & Whitelist
          </button>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay - Below Bottom Nav (z-40) */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ease-out cursor-pointer touch-manipulation" 
          aria-hidden="true"
        />
      )}

      {/* Mobile Material 3 "More" Bottom Sheet - Positioned above backdrop (z-45) and docked right above bottom nav bar (z-50) */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed left-0 right-0 bottom-[60px] z-45 max-h-[calc(100dvh-5.5rem)] bg-[#090d16]/98 border-t border-slate-800/90 rounded-t-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-200 ease-out animate-in slide-in-from-bottom-5 fade-in touch-manipulation"
          role="dialog"
          aria-modal="true"
          aria-label="More Modules and Team Settings"
        >
          {/* Material 3 Drag / Dismiss Bar */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="pt-2.5 pb-1 flex justify-center cursor-pointer active:opacity-60 transition-opacity"
            title="Dismiss Sheet"
          >
            <div className="w-10 h-1 rounded-full bg-slate-700/80 hover:bg-slate-600 transition-colors" />
          </div>

          {/* Sheet Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-[11px] shadow-sm">
                3P
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">More Modules &amp; Tools</h3>
                <p className="text-[10px] text-slate-400">Print-On-Demand Operations</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors active:scale-95"
              aria-label="Close More menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sheet Scrollable Body */}
          <div className="overflow-y-auto overscroll-contain p-4 space-y-4 max-h-[60vh]">
            {/* Quick Command Palette Launcher */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCommandPalette();
              }}
              className="cursor-pointer min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 active:scale-[0.99] transition-all shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" />
                <span>Search Modules &amp; Commands</span>
              </span>
              <kbd className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-sky-400">
                {shortcutLabel}
              </kbd>
            </button>

            {/* Extended Modules Grid / List */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                Extended Modules
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  { id: 'media-hub', label: 'Media Hub & Gallery', desc: 'Pinterest POD Design Library', icon: Sparkles, color: 'text-indigo-400', count: 0 },
                  { id: 'creatives', label: 'Ad Video & Creatives', desc: '5 TB Google Drive Repository', icon: Film, color: 'text-rose-400', count: 0 },
                  { id: 'instagram', label: 'Instagram Tracker', desc: 'Daily Reel Analytics & Growth', icon: Instagram, color: 'text-pink-400', count: 0 },
                  { id: 'analytics', label: 'POD Sales Analytics', desc: 'Revenue, Profit & ROAS Trends', icon: BarChart3, color: 'text-sky-400', count: unreadCounts.sales },
                  { id: 'admin', label: 'Admin & Whitelist', desc: 'Manage 3-Member Permissions', icon: Shield, color: 'text-amber-400', count: 0 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSwitch(item.id as DashboardModuleId)}
                      className={`cursor-pointer min-h-[50px] w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-sky-600/20 text-white border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900/60 text-slate-300 border border-slate-800/80 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="truncate font-semibold">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">{item.desc}</div>
                        </div>
                      </div>
                      {item.count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0 ml-1">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authenticated Account Card */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={currentUser.photoURL} 
                      alt={teamMember?.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-sky-500/40 shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400 shrink-0">
                      {teamMember?.displayName?.substring(0, 2).toUpperCase() || '3P'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {teamMember?.displayName}
                      {isAdmin && <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {teamMember?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="cursor-pointer min-h-[36px] px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Sheet Bottom Actions */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              {installable && (
                <button
                  onClick={() => {
                    handleInstallPWA();
                    setMobileMenuOpen(false);
                  }}
                  className="cursor-pointer min-h-[44px] w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  <DownloadCloud className="w-4 h-4" /> Install PWA on Phone
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Storage: <strong className="text-slate-200">Admin 5 TB Drive</strong></span>
                </div>
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Live Meeting in Progress Banner (App-Wide) */}
      <LiveMeetingBanner />

      {/* Main Content Workspace with fluid Material 3 view transitions */}
      <div className={`flex-1 max-w-7xl w-full mx-auto ${
        activeTab === 'chat' 
          ? 'p-0 sm:p-4 lg:p-6 pb-20 md:pb-6' 
          : 'p-3 sm:p-6 lg:p-8 pb-24 md:pb-8'
      }`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full will-change-transform"
          >
            {activeTab === 'chat' && <TeamChatModule />}
            {activeTab === 'meetings' && <MeetingHubModule />}
            {activeTab === 'doubts' && <DoubtsAndUpdatesModule />}
            {activeTab === 'pod-calc' && <PODProfitEngineModule />}
            {activeTab === 'creatives' && <AdVideoRepositoryModule />}
            {activeTab === 'media-hub' && <MediaAssetHubModule />}
            {activeTab === 'instagram' && <InstagramTrackerModule />}
            {activeTab === 'analytics' && <BusinessAnalyticsDashboardModule />}
            {activeTab === 'admin' && <AdminControlModule />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar (Docked cleanly with z-50 & Material 3 pill indicators) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090d16]/98 border-t border-slate-800/90 backdrop-blur-2xl shadow-2xl px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around select-none touch-manipulation"
      >
        {/* Chat Tab with dynamic unread red accent dot */}
        <button
          onClick={() => handleTabSwitch('chat')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group active:scale-95 transition-transform"
          title="Team Chat & Voice Notes"
          aria-label="Team Chat & Voice Notes"
        >
          <div className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            activeTab === 'chat'
              ? 'bg-sky-500/25 text-sky-300 border border-sky-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            <MessageSquare className="w-4 h-4" />
            {unreadCounts.chat > 0 && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#090d16] animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            activeTab === 'chat' ? 'text-sky-300 font-bold' : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            Chat
          </span>
        </button>

        {/* Meet Tab */}
        <button
          onClick={() => handleTabSwitch('meetings')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group active:scale-95 transition-transform"
          title="Google Meet Hub"
          aria-label="Google Meet Hub"
        >
          <div className={`flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            activeTab === 'meetings'
              ? 'bg-sky-500/25 text-sky-300 border border-sky-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            <Video className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            activeTab === 'meetings' ? 'text-sky-300 font-bold' : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            Meet
          </span>
        </button>

        {/* Doubts Tab with dynamic unread indicator */}
        <button
          onClick={() => handleTabSwitch('doubts')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group active:scale-95 transition-transform"
          title="Doubts & Updates"
          aria-label="Doubts & Updates"
        >
          <div className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            activeTab === 'doubts'
              ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            <HelpCircle className="w-4 h-4" />
            {unreadCounts.doubts > 0 && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-[#090d16] animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            activeTab === 'doubts' ? 'text-indigo-300 font-bold' : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            Doubts
          </span>
        </button>

        {/* POD Calc Tab */}
        <button
          onClick={() => handleTabSwitch('pod-calc')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group active:scale-95 transition-transform"
          title="POD Profit Engine"
          aria-label="POD Profit Engine"
        >
          <div className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            activeTab === 'pod-calc'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            <Calculator className="w-4 h-4" />
            {unreadCounts.sales > 0 && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090d16] animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            activeTab === 'pod-calc' ? 'text-emerald-300 font-bold' : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            Calc
          </span>
        </button>

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group active:scale-95 transition-transform"
          title={mobileMenuOpen ? 'Close Menu' : 'More Modules & Settings'}
          aria-label={mobileMenuOpen ? 'Close Menu' : 'More Modules & Settings'}
          aria-expanded={mobileMenuOpen}
        >
          <div className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            mobileMenuOpen || ['creatives', 'media-hub', 'instagram', 'analytics', 'admin'].includes(activeTab)
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {!mobileMenuOpen && unreadCounts.sales > 0 && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090d16] animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            mobileMenuOpen || ['creatives', 'media-hub', 'instagram', 'analytics', 'admin'].includes(activeTab)
              ? 'text-amber-300 font-bold'
              : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            {mobileMenuOpen ? 'Close' : 'More'}
          </span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#090d16] py-3 sm:py-4 px-4 sm:px-6 text-center text-[11px] sm:text-xs text-slate-500 hidden md:block">
        <p>
          Trio INC. &bull; Internal 3-Member Print-On-Demand Operating System &bull; 100% Free-Tier Architecture (Firebase Spark + Admin 5 TB Google Drive API v3)
        </p>
      </footer>

      {/* Quick Module Navigation Command Palette (Ctrl+K / Cmd+K) */}
      <QuickNavigationCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        activeTab={activeTab}
        onSelectModule={setActiveTab}
      />
    </main>
  );
}
