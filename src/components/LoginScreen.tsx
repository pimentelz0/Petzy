/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { signInUser, signUpUser } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const res = await signUpUser(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setSuccessMsg('Cadastro realizado com sucesso! Conectando você...');
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 1500);
        }
      } else {
        const res = await signInUser(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onLoginSuccess(res.user);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #059669 50%, #FAFAF8 50%)' }}
    >
      {/* Modern elevated card with premium smooth shadow, centered exact split overlay */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E4E4E0] shadow-2xl p-5 sm:p-7 transition-all duration-300 mx-4">
        
        {/* Top of card: Logo Petzy + Slogan pequeno */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E4E4E0] pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            {/* Custom rounded paw print circle */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D1FAE5]">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-[#059669]">
                {/* One large central oval pad */}
                <path d="M12 11.5c-2.4 0-4.2 1.4-4.2 3.2 0 1.6 1.8 2.8 4.2 2.8s4.2-1.2 4.2-2.8c0-1.8-1.8-3.2-4.2-3.2z" />
                {/* Four smaller rounded toe pads above */}
                <circle cx="6.8" cy="10.4" r="1.6" />
                <circle cx="10.2" cy="7.6" r="1.8" />
                <circle cx="13.8" cy="7.6" r="1.8" />
                <circle cx="17.2" cy="10.4" r="1.6" />
              </svg>
            </div>
            <span className="text-lg font-black text-[#059669] tracking-tight">
              Petzy
            </span>
          </div>
          <span className="text-[10px] text-[#1C1917]/50 italic font-semibold">
            “Cuide de quem te ama”
          </span>
        </div>

        {/* Título e descrição do card */}
        <div className="space-y-1 text-center mb-4">
          <h2 className="text-lg font-extrabold text-[#1C1917] tracking-tight">
            {isSignUp ? 'Criar Conta' : 'Acesse sua Conta'}
          </h2>
          <p className="text-[11px] text-[#1C1917]/50 leading-tight">
            {isSignUp 
              ? 'Comece a cuidar da saúde do seu melhor amigo' 
              : 'Entre com seus dados cadastrados para acessar'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 text-[11px] mb-3 animate-fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 text-[11px] mb-3 animate-fade-in">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email input field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#1C1917]/70 uppercase tracking-widest block">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
              <input
                id="login-email-input"
                type="email"
                required
                placeholder="exemplo@petzy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E4E0] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all text-xs text-[#1C1917]"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#1C1917]/70 uppercase tracking-widest block">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1917]/40" />
              <input
                id="login-password-input"
                type="password"
                required
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E4E0] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-all text-xs text-[#1C1917]"
              />
            </div>
          </div>

          {/* Hot CTA colored Orange Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-2.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide cursor-pointer mt-3"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? 'Cadastrar Grátis' : 'Entrar no Painel'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Form alternate mode switcher links */}
        <div className="text-center border-t border-[#E4E4E0] pt-4 mt-4">
          <button
            id="login-toggle-signup"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors focus:outline-none cursor-pointer"
          >
            {isSignUp 
              ? 'Já possui uma conta? Acesse aqui' 
              : 'Não tem uma conta configurada? Registre-se gratuitamente'}
          </button>
        </div>

      </div>
    </div>
  );
}
