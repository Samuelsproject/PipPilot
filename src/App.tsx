/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationRoute } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { About } from './components/About';
import { AccessMembership } from './components/AccessMembership';
import { RiskDisclaimer } from './components/RiskDisclaimer';
import { Footer } from './components/Footer';
import { DashboardPreviewPage } from './components/DashboardPreviewPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { SupabaseConfigBanner } from './components/SupabaseConfigBanner';
import { ContactModal, PrivacyModal, TermsModal } from './components/Modals';

function AppContent() {
  const { isConfigured, user } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Detect Supabase recovery link callback in hash
    if (hash.includes('type=recovery') || path === '/reset-password') {
      return '/reset-password';
    }
    // Detect email confirmation signup callback in hash
    if (hash.includes('type=signup') || path === '/verify-email') {
      return '/verify-email';
    }
    if (path === '/app' || hash === '#/app') return '/app';
    if (path === '/register' || hash === '#/register') return '/register';
    if (path === '/login' || hash === '#/login') return '/login';
    if (path === '/forgot-password' || hash === '#/forgot-password') return '/forgot-password';

    return '/';
  });

  const [contactOpen, setContactOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Sync with browser popstate and URL hash changes
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (hash.includes('type=recovery') || path === '/reset-password') {
        setCurrentRoute('/reset-password');
      } else if (hash.includes('type=signup') || path === '/verify-email') {
        setCurrentRoute('/verify-email');
      } else if (path === '/app' || hash === '#/app') {
        setCurrentRoute('/app');
      } else if (path === '/register' || hash === '#/register') {
        setCurrentRoute('/register');
      } else if (path === '/login' || hash === '#/login') {
        setCurrentRoute('/login');
      } else if (path === '/forgot-password' || hash === '#/forgot-password') {
        setCurrentRoute('/forgot-password');
      } else {
        setCurrentRoute('/');
      }
    };

    // Custom event dispatched from AuthContext when Supabase fires PASSWORD_RECOVERY
    const handlePasswordRecoveryEvent = () => {
      setCurrentRoute('/reset-password');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pippilot:password_recovery', handlePasswordRecoveryEvent);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pippilot:password_recovery', handlePasswordRecoveryEvent);
    };
  }, []);

  const navigateTo = (route: NavigationRoute, hash?: string) => {
    setCurrentRoute(route);
    const targetUrl = route === '/' ? (hash ? `/${hash}` : '/') : route;
    try {
      window.history.pushState({}, '', targetUrl);
    } catch {
      // Ignore strict iframe pushState limitations
    }

    if (route === '/') {
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash.replace('#', ''));
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Specific Route Renders
  if (currentRoute === '/register') {
    return (
      <>
        <SupabaseConfigBanner />
        <RegisterPage 
          onNavigate={navigateTo} 
          onOpenPrivacy={() => setPrivacyOpen(true)}
          onOpenTerms={() => setTermsOpen(true)}
        />
        <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      </>
    );
  }

  if (currentRoute === '/login') {
    return (
      <>
        <SupabaseConfigBanner />
        <LoginPage onNavigate={navigateTo} />
      </>
    );
  }

  if (currentRoute === '/forgot-password') {
    return (
      <>
        <SupabaseConfigBanner />
        <ForgotPasswordPage onNavigate={navigateTo} />
      </>
    );
  }

  if (currentRoute === '/reset-password') {
    return (
      <>
        <SupabaseConfigBanner />
        <ResetPasswordPage onNavigate={navigateTo} />
      </>
    );
  }

  if (currentRoute === '/verify-email') {
    return (
      <>
        <SupabaseConfigBanner />
        <VerifyEmailPage onNavigate={navigateTo} />
      </>
    );
  }

  if (currentRoute === '/app') {
    return (
      <>
        <SupabaseConfigBanner />
        <DashboardPreviewPage onNavigate={navigateTo} />
      </>
    );
  }

  // Default Route: Public Landing Page ("/")
  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      <SupabaseConfigBanner />
      
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
      />

      <main className="flex-1">
        <Hero onNavigate={navigateTo} />
        <Features />
        <HowItWorks onNavigate={navigateTo} />
        <About />
        <AccessMembership onNavigate={navigateTo} />
        <RiskDisclaimer />
      </main>

      <Footer
        onNavigate={navigateTo}
        onOpenContact={() => setContactOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
      />

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
