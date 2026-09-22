'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { NotificationProvider, useNotification } from '@/lib/notification-context';
import { NotificationToastContainer } from '@/components/NotificationToastContainer';
import { TeamChatModule } from '@/components/TeamChatModule';
import { MeetingHubModule } from '@/components/MeetingHubModule';
import { DoubtsAndUpdatesModule } from '@/components/DoubtsAndUpdatesModule';
import { PODProfitEngineModule } from '@/components/PODProfitEngineModule';
import { AdVideoRepositoryModule } from '@/components/AdVideoRepositoryModule';
import { InstagramTrackerModule } from '@/components/InstagramTrackerModule';
import { BusinessAnalyticsDashboardModule } from '@/components/BusinessAnalyticsDashboardModule';
import { AdminControlModule } from '@/components/AdminControlModule';
import { 
  QuickNavigationCommandPalette, 
  DashboardModuleId 
} from '@/components/QuickNavigationCommandPalette';
import { useDashboardNavigation } from '@/lib/use-dashboard-navigation';
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
    user, 
    teamMember, 
    isAdmin, 
    isWhitelisted, 
    loading, 
    whitelist, 
    signInWithGoogle, 
    signOut, 
    simulateMemberLogin 
  } = useAuth();

  const { unreadCounts } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallable(false);
    }
  };

  // If user signed in with an unauthorized Google account outside the 3-member whitelist:
  if (!loading && user && !isWhitelisted) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ACCESS DENIED</h1>
            <p className="text-xs text-red-400 font-mono mt-1">
              Unauthorized Gmail ID: {user.email}
            </p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Trio INC. is a strictly private operational hub restricted to exactly 3 designated team members. Your Google account is not on the active whitelist.
          </p>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Authorized Whitelist (3 Slots):</div>
            <div>&bull; Sachin Barman (sachinbarman20190@gmail.com - Admin 5 TB Host)</div>
            <div>&bull; Suraj Barman (suraj.yt.science@gmail.com - Team Member)</div>
            <div>&bull; Member 3 (member3@gmail.com - Team Member Placeholder)</div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full py-3 min-h-[44px] cursor-pointer bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center"
          >
            Sign Out & Switch Account
          </button>
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

            {/* Quick 3-Member Role Switcher */}
            <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 gap-0.5">
              <span className="text-[10px] text-slate-500 px-1.5 font-medium">Switch:</span>
              {whitelist.map((m) => (
                <button
                  key={m.email}
                  onClick={() => simulateMemberLogin(m.email)}
                  className={`cursor-pointer px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    teamMember?.email.toLowerCase() === m.email.toLowerCase()
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {m.displayName.split(' ')[0]} {m.role === 'admin' && '(Admin)'}
                </button>
              ))}
            </div>

            {/* Active User Card & Sign In/Out */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 px-2 sm:px-2.5 py-1 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">
                {teamMember?.displayName.substring(0, 2).toUpperCase() || '3P'}
              </div>
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

            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="cursor-pointer min-h-[40px] min-w-[40px] relative flex items-center justify-center md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
              {(unreadCounts.chat > 0 || unreadCounts.doubts > 0 || unreadCounts.sales > 0) && (
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
            onClick={() => setActiveTab('chat')}
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
            onClick={() => setActiveTab('meetings')}
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
            onClick={() => setActiveTab('doubts')}
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
            onClick={() => setActiveTab('pod-calc')}
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
            onClick={() => setActiveTab('creatives')}
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
            onClick={() => setActiveTab('instagram')}
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
            onClick={() => setActiveTab('analytics')}
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
            onClick={() => setActiveTab('admin')}
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

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs h-full bg-[#090d16] border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-10">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs">
                    3P
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Trio Team Hub</h3>
                    <p className="text-[10px] text-slate-400">Print-On-Demand OS</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Command Palette Launcher */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCommandPalette();
                }}
                className="cursor-pointer min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-all shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>Quick Command Palette</span>
                </span>
                <kbd className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-sky-400">
                  {shortcutLabel}
                </kbd>
              </button>

              {/* Module Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1">
                  Modules
                </p>
                {[
                  { id: 'chat', label: 'Team Chat & Voice Notes', icon: MessageSquare, color: 'text-sky-400', count: unreadCounts.chat },
                  { id: 'meetings', label: 'Google Meet Hub', icon: Video, color: 'text-sky-400', count: 0 },
                  { id: 'doubts', label: 'Doubts & Updates', icon: HelpCircle, color: 'text-indigo-400', count: unreadCounts.doubts },
                  { id: 'pod-calc', label: 'POD Profit Engine', icon: Calculator, color: 'text-emerald-400', count: 0 },
                  { id: 'creatives', label: 'Ad Video & Creatives', icon: Film, color: 'text-rose-400', count: 0 },
                  { id: 'instagram', label: 'Instagram Tracker', icon: Instagram, color: 'text-pink-400', count: 0 },
                  { id: 'analytics', label: 'POD Sales Analytics', icon: BarChart3, color: 'text-sky-400', count: unreadCounts.sales },
                  { id: 'admin', label: 'Admin & Whitelist', icon: Shield, color: 'text-amber-400', count: 0 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Member Perspective Switcher */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">
                  Switch Member View
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {whitelist.map((m) => (
                    <button
                      key={m.email}
                      onClick={() => {
                        simulateMemberLogin(m.email);
                        setMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer min-h-[44px] px-2 py-2 text-[11px] font-semibold rounded-lg text-center flex items-center justify-center transition-all ${
                        teamMember?.email.toLowerCase() === m.email.toLowerCase()
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {m.displayName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {installable && (
                <button
                  onClick={() => {
                    handleInstallPWA();
                    setMobileMenuOpen(false);
                  }}
                  className="cursor-pointer min-h-[44px] w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md"
                >
                  <DownloadCloud className="w-4 h-4" /> Install PWA on Phone
                </button>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Storage: <strong>Admin 5 TB Drive</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className={`flex-1 max-w-7xl w-full mx-auto ${
        activeTab === 'chat' 
          ? 'p-0 sm:p-4 lg:p-6 pb-20 md:pb-6' 
          : 'p-3 sm:p-6 lg:p-8 pb-24 md:pb-8'
      }`}>
        {activeTab === 'chat' && <TeamChatModule />}
        {activeTab === 'meetings' && <MeetingHubModule />}
        {activeTab === 'doubts' && <DoubtsAndUpdatesModule />}
        {activeTab === 'pod-calc' && <PODProfitEngineModule />}
        {activeTab === 'creatives' && <AdVideoRepositoryModule />}
        {activeTab === 'instagram' && <InstagramTrackerModule />}
        {activeTab === 'analytics' && <BusinessAnalyticsDashboardModule />}
        {activeTab === 'admin' && <AdminControlModule />}
      </div>

      {/* Mobile Bottom Navigation Bar (Docked cleanly with z-50 & Material 3 pill indicators) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090d16]/95 border-t border-slate-800/80 backdrop-blur-xl shadow-2xl px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around select-none"
      >
        {/* Chat Tab with dynamic unread red accent dot */}
        <button
          onClick={() => setActiveTab('chat')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group"
          title="Team Chat & Voice Notes"
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
          onClick={() => setActiveTab('meetings')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group"
          title="Google Meet Hub"
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
          onClick={() => setActiveTab('doubts')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group"
          title="Doubts & Updates"
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
          onClick={() => setActiveTab('pod-calc')}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group"
          title="POD Profit Engine"
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
          onClick={() => setMobileMenuOpen(true)}
          className="cursor-pointer min-h-[52px] flex-1 flex flex-col items-center justify-center py-0.5 px-1 group"
          title="More Modules"
        >
          <div className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
            ['creatives', 'instagram', 'analytics', 'admin'].includes(activeTab)
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-sm scale-105'
              : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
          }`}>
            <Menu className="w-4 h-4" />
            {unreadCounts.sales > 0 && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090d16] animate-pulse" />
            )}
          </div>
          <span className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
            ['creatives', 'instagram', 'analytics', 'admin'].includes(activeTab)
              ? 'text-amber-300 font-bold'
              : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            More
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
