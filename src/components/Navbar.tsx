import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Compass, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  User 
} from 'lucide-react';
import { NavigationRoute } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute, hash?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (hash?: string) => {
    setMobileMenuOpen(false);
    if (currentRoute !== '/') {
      onNavigate('/', hash);
    } else if (hash) {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await logout();
    onNavigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#101B20]/95 backdrop-blur-md border-b border-[#152B30] shadow-lg shadow-black/20 py-3'
          : 'bg-[#101B20]/80 backdrop-blur-sm border-b border-[#152B30]/50 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            aria-label="PipPilotAi Home"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#16A36A] via-[#168BFF] to-[#9560E8] p-[1.5px] transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#101B20] rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-[#16A36A]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#E8F2EE] flex items-center gap-1">
                PipPilot<span className="text-[#16A36A]">Ai</span>
              </span>
              <span className="text-[10px] font-mono text-[#A9BEB5] tracking-wider uppercase">
                Trading Intelligence
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => handleLinkClick('#features')}
              className="text-sm font-medium text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleLinkClick('#how-it-works')}
              className="text-sm font-medium text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => handleLinkClick('#about')}
              className="text-sm font-medium text-[#A9BEB5] hover:text-[#E8F2EE] transition-colors"
            >
              About
            </button>
            <button
              onClick={() => onNavigate('/app')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                currentRoute === '/app'
                  ? 'border-[#168BFF] text-[#168BFF] bg-[#168BFF]/10'
                  : 'border-[#152B30] text-[#A9BEB5] hover:text-[#E8F2EE] hover:border-[#168BFF]/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#168BFF]" />
              Dashboard Preview
            </button>
          </nav>

          {/* Action CTAs & Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#152B30] border border-[#1A363E] text-xs font-mono text-[#E8F2EE]">
                  <User className="w-3.5 h-3.5 text-[#16A36A]" />
                  <span className="max-w-[130px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 rounded-xl bg-[#152B30] hover:bg-[#1B363C] text-[#A9BEB5] hover:text-[#E05252] text-xs font-semibold border border-[#1A363E] transition-colors flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-xs font-bold text-[#E8F2EE] hover:text-[#168BFF] transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#168BFF]" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onNavigate('/register')}
                  className="relative inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-[#E8F2EE] bg-[#16A36A] rounded-xl hover:bg-[#148f5d] transition-all duration-200 shadow-md shadow-[#16A36A]/25 hover:shadow-lg hover:shadow-[#16A36A]/35 hover:-translate-y-0.5 active:translate-y-0 group"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Get Access
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!user ? (
              <button
                onClick={() => onNavigate('/login')}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#168BFF] bg-[#168BFF]/10 rounded-lg border border-[#168BFF]/30"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="p-1.5 text-xs text-[#E05252] bg-[#E05252]/10 rounded-lg border border-[#E05252]/30"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#152B30] text-[#E8F2EE] border border-[#1A363E] hover:bg-[#1A363E] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#E8F2EE]" /> : <Menu className="w-5 h-5 text-[#E8F2EE]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#152B30] bg-[#152B30]/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="p-3 rounded-xl bg-[#101B20] border border-[#1A363E] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-[#16A36A] shrink-0" />
                <span className="text-xs font-mono text-[#E8F2EE] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-[#E05252] font-semibold flex items-center gap-1 shrink-0 ml-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleLinkClick('#features')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#E8F2EE] hover:bg-[#101B20]/60 active:bg-[#101B20]"
            >
              <span>Features</span>
              <ChevronRight className="w-4 h-4 text-[#A9BEB5]" />
            </button>
            <button
              onClick={() => handleLinkClick('#how-it-works')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#E8F2EE] hover:bg-[#101B20]/60 active:bg-[#101B20]"
            >
              <span>How It Works</span>
              <ChevronRight className="w-4 h-4 text-[#A9BEB5]" />
            </button>
            <button
              onClick={() => handleLinkClick('#about')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#E8F2EE] hover:bg-[#101B20]/60 active:bg-[#101B20]"
            >
              <span>About</span>
              <ChevronRight className="w-4 h-4 text-[#A9BEB5]" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/app');
              }}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#168BFF] bg-[#168BFF]/10 border border-[#168BFF]/25 hover:bg-[#168BFF]/15"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#168BFF]" />
                <span>Dashboard Preview</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#168BFF]" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#101B20]/80 space-y-2">
            {!user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/register');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#16A36A] hover:bg-[#148f5d] text-[#E8F2EE] font-bold text-sm shadow-md shadow-[#16A36A]/30 active:scale-[0.99] transition-transform"
                >
                  <span>Get Access / Register</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#101B20] text-[#E8F2EE] font-semibold text-xs border border-[#1A363E]"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#168BFF]" />
                  <span>Existing Member? Sign In</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/app');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#168BFF] text-[#E8F2EE] font-bold text-sm"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <p className="text-center text-[11px] text-[#A9BEB5] pt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A36A]" />
              Membership subject to administrator approval
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
