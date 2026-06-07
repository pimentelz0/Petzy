/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

export default function App() {
  // Authentication user State (starts null, saved to sessionStorage on success)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [alertCount, setAlertCount] = useState<number>(0);

  // Read existing session on reload so user doesn't have to keep logging-in during review
  useEffect(() => {
    const saved = sessionStorage.getItem('petzy_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        sessionStorage.removeItem('petzy_user');
      }
    }
  }, []);

  const handleLoginSuccess = (signedInUser: { id: string; email: string }) => {
    setUser(signedInUser);
    sessionStorage.setItem('petzy_user', JSON.stringify(signedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('petzy_user');
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#1C1917] font-sans antialiased text-sm">
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1C1917] font-sans antialiased flex flex-col">
      {/* Dynamic Nav Header Bar */}
      <Navbar
        userEmail={user.email}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
      />

      {/* Main SaaS App content panel */}
      <main className="flex-1">
        <Dashboard
          userId={user.id}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setAlertCount={setAlertCount}
        />
      </main>

      {/* Footer information */}
      <footer className="w-full bg-[#FAFAF8] py-8 border-t border-[#E4E4E0] text-center text-xs text-[#1C1917]/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-[#059669]">Petzy — Cuide de quem te ama</p>
          <p>© 2026 Petzy SaaS Corporation. Todos os direitos reservados. Integrado perfeitamente com Supabase Rest API.</p>
        </div>
      </footer>
    </div>
  );
}
