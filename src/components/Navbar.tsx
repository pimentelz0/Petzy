/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PawPrint, LogOut, User, Heart, Bell } from 'lucide-react';

interface NavbarProps {
  userEmail: string;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
}

export default function Navbar({
  userEmail,
  onLogout,
  activeTab,
  setActiveTab,
  alertCount
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAF8] border-b border-[#E4E4E0] px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Logo and Slogan */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#D1FAE5] text-[#059669] shadow-inner transition-transform hover:scale-105 duration-300">
            <PawPrint className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#059669] tracking-tight font-sans">
                Petzy
              </span>
              <span className="w-2 h-2 rounded-full bg-[#F97316] inline-block animate-pulse"></span>
            </div>
            <p className="text-[10px] text-[#1C1917]/60 font-medium tracking-wide italic leading-tight">
              “Cuide de quem te ama”
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center flex-wrap justify-center gap-1 bg-[#F4F4F0] p-1 rounded-2xl border border-[#E1E1DC]">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#059669] shadow-sm'
                : 'text-[#1C1917]/70 hover:text-[#059669] hover:bg-white/50'
            }`}
          >
            Dashboard
          </button>
          
          <button
            id="nav-tab-pets"
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'pets'
                ? 'bg-white text-[#059669] shadow-sm'
                : 'text-[#1C1917]/70 hover:text-[#059669] hover:bg-white/50'
            }`}
          >
            Meus Pets
          </button>

          <button
            id="nav-tab-recipes"
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'recipes'
                ? 'bg-white text-[#059669] shadow-sm'
                : 'text-[#1C1917]/70 hover:text-[#059669] hover:bg-white/50'
            }`}
          >
            Receitas
          </button>
        </nav>

        {/* User Profile and Log out */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-2 bg-[#D1FAE5]/60 px-3 py-1.5 rounded-2xl border border-[#D1FAE5]">
            <User className="w-4 h-4 text-[#059669]" />
            <span className="text-xs font-semibold text-[#1C1917] hidden md:inline max-w-[120px] truncate">
              {userEmail.split('@')[0]}
            </span>
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
                {alertCount}
              </span>
            )}
          </div>

          <button
            id="nav-logout-btn"
            onClick={onLogout}
            title="Sair do aplicativo"
            className="flex items-center justify-center p-2 rounded-xl bg-white border border-[#E4E4E0] text-red-500 hover:bg-red-50 hover:border-red-100 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
