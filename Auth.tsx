
import React, { useState } from 'react';
import { Crown, ShieldCheck, ArrowRight, Fingerprint, Terminal, Check, Loader2, Mail, Apple, AlertCircle, RefreshCw, User } from 'lucide-react';
import { useTheme } from './ThemeContext.tsx';
import { AIPersona } from './types.ts';

interface AuthProps {
  onAuthorize: (remember: boolean) => Promise<void>;
  onSkip?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthorize, onSkip }) => {
  const { theme, persona, setPersona } = useTheme();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);

  const isValid = isForgotPassword 
    ? email.trim() !== '' 
    : email.trim() !== '' && password.trim() !== '';

  const triggerHaptic = (intensity: number = 10) => {
    if ('vibrate' in navigator) navigator.vibrate(intensity);
  };

  const simulateHandshake = async (provider: string) => {
    const steps = [
      `Initializing secure gateway with ${provider}...`,
      'Synchronizing identity manifest...',
      'Validating biometric signatures...',
      'Synthesizing security tokens...',
      'Access Protocol Authorized.'
    ];

    for (const step of steps) {
      setAuthStatus(step);
      await new Promise(r => setTimeout(r, 450));
    }
  };

  const handleAuthorize = async () => {
    setErrorMessage(null);
    if (!isValid) {
      triggerHaptic(50);
      setErrorVisible(true);
      setErrorMessage("IDENT_ERR: MISSING CREDENTIALS");
      setTimeout(() => setErrorVisible(false), 500);
      return;
    }

    if (!navigator.onLine) {
      triggerHaptic(50);
      setErrorVisible(true);
      setErrorMessage("LINK_ERR: SYNC OFFLINE");
      setTimeout(() => setErrorVisible(false), 500);
      return;
    }
    
    triggerHaptic();
    setIsConnecting(true);

    if (isForgotPassword) {
      setAuthStatus('Initiating recovery sequence...');
      try {
        await new Promise(r => setTimeout(r, 2000));
        setAuthStatus('Recovery cipher dispatched to email.');
        await new Promise(r => setTimeout(r, 1500));
        setIsForgotPassword(false);
        setIsLogin(true);
        setErrorMessage(null);
        alert(`A recovery protocol has been dispatched to ${email}. Check your secure terminal.`);
      } catch (e: any) {
        setErrorMessage("RECOVERY_ERR: DISPATCH FAILED");
      } finally {
        setIsConnecting(false);
        setAuthStatus(null);
      }
      return;
    }
    
    setAuthStatus('Verifying credentials...');
    
    try {
      // Simulate real auth latency
      await new Promise(r => setTimeout(r, 1500));
      
      // Basic validation simulation
      if (password.length < 6) {
        throw new Error("AUTH_ERR: CIPHER TOO WEAK (MIN 6 CHARS)");
      }

      await onAuthorize(rememberMe);
    } catch (e: any) {
      triggerHaptic(50);
      setErrorVisible(true);
      setErrorMessage(e.message || "AUTH_ERR: INVALID ACCESS CIPHER");
      setAuthStatus(null);
      setTimeout(() => setErrorVisible(false), 500);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setErrorMessage(null);
    triggerHaptic(15);

    if (!navigator.onLine) {
      setErrorMessage("LINK_ERR: NETWORK UNAVAILABLE");
      triggerHaptic(50);
      return;
    }

    setIsConnecting(true);
    
    try {
      if (provider === 'biometric') {
        setAuthStatus("Scanning biometrics...");
        await new Promise(r => setTimeout(r, 1000));
        await onAuthorize(rememberMe);
        return;
      }
      
      await simulateHandshake(provider.charAt(0).toUpperCase() + provider.slice(1));
      await onAuthorize(rememberMe);
    } catch (e) {
      console.error("Auth failed", e);
      setErrorMessage("PROTOCOL_ERR: GATEWAY REJECTED HANDSHAKE");
      setAuthStatus(null);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 reveal overflow-y-auto no-scrollbar bg-black">
      {isConnecting && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
           <div className="w-full max-w-xs space-y-8 text-center">
              <div className="relative inline-block">
                 <div className="absolute inset-0 opacity-20 blur-[60px] animate-pulse rounded-full" style={{ backgroundColor: theme.accentColor }} />
                 <Loader2 className="relative animate-spin" size={64} strokeWidth={1} style={{ color: theme.accentColor }} />
              </div>
              <div className="space-y-4">
                 <p className="text-[10px] font-bold uppercase tracking-[0.6em] animate-pulse" style={{ color: theme.accentColor }}>Establishing Connection</p>
                 <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest min-h-[2.5em] flex items-center justify-center leading-relaxed">
                    {authStatus}
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center space-y-12 py-10">
        
        <header className="text-center space-y-6">
          <div className="relative inline-block">
             <div className="absolute inset-0 opacity-10 blur-[40px] scale-150 rounded-full" style={{ backgroundColor: theme.accentColor }} />
             <Crown className="relative" size={48} strokeWidth={1.5} style={{ color: theme.accentColor }} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-[0.2em] uppercase leading-tight" style={{ color: theme.accentColor }}>
              {isForgotPassword ? `${theme.brandName.toUpperCase()}_RECOVER` : (isLogin ? `${theme.brandName.toUpperCase()}_AUTH` : `${theme.brandName.toUpperCase()}_ENROLL`)}
            </h1>
            <p className="text-zinc-500 text-[9px] font-bold tracking-[0.5em] uppercase">PERFORMANCE OPTIMIZATION HUB</p>
          </div>
        </header>

        <div className="w-full space-y-8">
          {!isForgotPassword && (
            <div className="space-y-3">
              <button 
                disabled={isConnecting}
                onClick={() => handleSocialAuth('google')}
                className="w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-4 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <button 
                disabled={isConnecting}
                onClick={() => handleSocialAuth('apple')}
                className="w-full h-14 bg-zinc-900 text-white border border-white/10 rounded-2xl flex items-center justify-center gap-4 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                <Apple className="w-5 h-5" fill="currentColor" />
                Continue with Apple
              </button>
            </div>
          )}

          {!isForgotPassword && (
            <div className="flex items-center gap-4 opacity-20">
              <div className="h-px flex-1 bg-white"></div>
              <span className="text-[8px] font-bold tracking-[0.4em] uppercase">OR</span>
              <div className="h-px flex-1 bg-white"></div>
            </div>
          )}

          <div className={`w-full posh-card p-10 rounded-[48px] space-y-10 transition-all ${errorVisible ? 'animate-shake shadow-[0_0_20px_rgba(197,160,89,0.1)]' : 'border-white/5'}`} style={errorVisible ? { borderColor: `${theme.accentColor}80` } : {}}>
            <div className="space-y-6">
              {!isLogin && !isForgotPassword && (
                <div className="space-y-4">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-2">Select Trainer Persona</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[AIPersona.ARES, AIPersona.ATHENA].map(p => (
                      <button
                        key={p}
                        onClick={() => { triggerHaptic(5); setPersona(p); }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${persona === p ? 'bg-white/5' : 'bg-transparent border-white/5 opacity-40'}`}
                        style={persona === p ? { borderColor: theme.accentColor } : {}}
                      >
                        <Crown size={20} style={{ color: persona === p ? theme.accentColor : '#71717a' }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: persona === p ? theme.accentColor : '#71717a' }}>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-2">Email Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                  <input 
                    disabled={isConnecting}
                    type="email"
                    placeholder={`PROTOCOL@${theme.brandName.toUpperCase()}.IO`} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-5 pl-12 rounded-2xl bg-zinc-900 border ${errorVisible && !email.trim() ? '' : 'border-white/5'} outline-none tracking-wider uppercase text-xs transition-all disabled:opacity-50`}
                    style={{ 
                      color: theme.accentColor,
                      borderColor: errorVisible && !email.trim() ? `${theme.accentColor}4D` : undefined
                    }}
                  />
                </div>
              </div>
              
              {!isForgotPassword && (
                <div className="space-y-2">
                  <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-2">Secure Cipher</label>
                  <input 
                    disabled={isConnecting}
                    type="password"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full p-5 rounded-2xl bg-zinc-900 border ${errorVisible && !password.trim() ? '' : 'border-white/5'} outline-none tracking-widest text-xs transition-all disabled:opacity-50`}
                    style={{ 
                      color: theme.accentColor,
                      borderColor: errorVisible && !password.trim() ? `${theme.accentColor}4D` : undefined
                    }}
                  />
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-3 px-4 py-3 border rounded-xl animate-in slide-in-from-top-2 duration-300" style={{ backgroundColor: `${theme.accentColor}0D`, borderColor: `${theme.accentColor}33` }}>
                  <AlertCircle size={14} className="shrink-0" style={{ color: theme.accentColor }} />
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest leading-relaxed" style={{ color: theme.accentColor }}>
                    {errorMessage}
                  </p>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="flex items-center justify-between px-2 pt-2">
                  <button 
                    disabled={isConnecting}
                    onClick={() => { triggerHaptic(5); setRememberMe(!rememberMe); }}
                    className="flex items-center gap-3 group disabled:opacity-50"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'text-black' : 'bg-transparent border-white/10'}`} style={rememberMe ? { backgroundColor: theme.accentColor, borderColor: theme.accentColor } : {}}>
                      {rememberMe && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Maintain Active</span>
                  </button>
                  <button 
                    disabled={isConnecting} 
                    onClick={() => { triggerHaptic(5); setIsForgotPassword(true); }}
                    className="text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    style={{ color: `${theme.accentColor}99` }}
                  >
                    Recover?
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button 
                disabled={isConnecting}
                onClick={handleAuthorize}
                className={`w-full font-bold h-16 rounded-[24px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 ${isValid ? 'text-black' : 'bg-zinc-800 text-zinc-600 opacity-50'}`}
                style={isValid ? { backgroundColor: theme.accentColor } : {}}
              >
                <span className="text-[12px] tracking-[0.4em] uppercase">
                  {isForgotPassword ? "INITIATE RECOVERY" : (isLogin ? "INITIATE SESSION" : "FORGE ACCOUNT")}
                </span>
                {isForgotPassword ? <RefreshCw size={18} strokeWidth={2.5} /> : <ArrowRight size={18} strokeWidth={2.5} />}
              </button>
              
              <button 
                disabled={isConnecting}
                onClick={() => { 
                  triggerHaptic(5); 
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                  } else {
                    setIsLogin(!isLogin);
                  }
                  setEmail(''); 
                  setPassword(''); 
                  setErrorMessage(null); 
                }}
                className="w-full text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase transition-colors disabled:opacity-50"
              >
                {isForgotPassword ? (
                  <>RETURN TO <span className="ml-1" style={{ color: theme.accentColor }}>TERMINAL</span></>
                ) : (
                  isLogin ? (
                    <>NO RECORD DETECTED? <span className="ml-1" style={{ color: theme.accentColor }}>ENROLL</span></>
                  ) : (
                    <>EXISTING PROTOCOL? <span className="ml-1" style={{ color: theme.accentColor }}>LOG IN</span></>
                  )
                )}
              </button>
            </div>
          </div>
        </div>

        {!isForgotPassword && (
          <div className="flex flex-col items-center space-y-10 w-full">
            <div className="flex items-center gap-8">
              <button disabled={isConnecting} onClick={() => handleSocialAuth('biometric')} className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 transition-all duration-500 active:scale-90 disabled:opacity-50" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <Fingerprint size={28} strokeWidth={1.5} className="hover:text-current" style={{ color: persona === AIPersona.ARES ? '#D4AF37' : '#999B9B' }} />
              </button>
              {onSkip && (
                <button disabled={isConnecting} onClick={() => { triggerHaptic(); onSkip(); }} className="px-6 h-12 bg-zinc-900 border border-white/5 rounded-xl text-[9px] text-zinc-700 font-bold uppercase tracking-[0.4em] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 hover:text-current" style={{ color: theme.accentColor }}>
                  <Terminal size={14} /> Sandbox Bypass
                </button>
              )}
            </div>
          </div>
        )}

        <footer className="flex items-center gap-3 opacity-10">
          <ShieldCheck size={14} style={{ color: theme.accentColor }} />
          <span className="text-[9px] font-bold tracking-[0.6em] uppercase">AES-256 SECURED</span>
        </footer>
      </div>
    </div>
  );
};
