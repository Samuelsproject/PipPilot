/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationRoute } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { About } from './components/About';
import { AccessMembership } from './components/AccessMembership';
import { RiskDisclaimer } from './components/RiskDisclaimer';
import { Footer } from './components/Footer';
import { DashboardPreviewPage } from './components/DashboardPreviewPage';
import { RegisterPlaceholderPage } from './components/RegisterPlaceholderPage';
import { ContactModal, PrivacyModal, TermsModal } from './components/Modals';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>(() => {
    const path = window.location.pathname;
    if (path === '/app' || window.location.hash === '#/app') return '/app';
    if (path === '/register' || window.location.hash === '#/register') return '/register';
    return '/';
  });

  const [contactOpen, setContactOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Sync with browser back/forward and path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/app' || hash === '#/app') {
        setCurrentRoute('/app');
      } else if (path === '/register' || hash === '#/register') {
        setCurrentRoute('/register');
      } else {
        setCurrentRoute('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: NavigationRoute, hash?: string) => {
    setCurrentRoute(route);
    // Push state without page reload
    const targetUrl = route === '/' ? (hash ? `/${hash}` : '/') : route;
    try {
      window.history.pushState({}, '', targetUrl);
    } catch {
      // Fallback for strict sandbox
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

  if (currentRoute === '/app') {
    return (
      <DashboardPreviewPage
        onNavigate={(route) => navigateTo(route)}
      />
    );
  }

  if (currentRoute === '/register') {
    return (
      <RegisterPlaceholderPage
        onNavigate={(route) => navigateTo(route)}
      />
    );
  }

  // Default Route: Public Landing Page ("/")
  return (
    <div className="min-h-screen bg-[#101B20] text-[#E8F2EE] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
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

      {/* Global Compliance & Contact Modals */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
