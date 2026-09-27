
import React, { useState } from 'react';
import { User, Lock, ArrowLeft, ShieldCheck, Settings } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
  users: UserType[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // محاكاة تأخير بسيط للتحقق
    setTimeout(() => {
      const foundUser = users.find(u => u.username === username);
      
      // التحقق من اسم المستخدم وكلمة المرور
      // إذا لم تكن كلمة المرور مخزنة (حالة نادرة)، نفترض 'admin' كقيمة افتراضية للمسؤول
      if (foundUser && (foundUser.password === password || (!foundUser.password && password === 'admin'))) {
        onLogin(foundUser);
      } else {
        setError('خطأ في اسم المستخدم أو كلمة المرور');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-['Cairo']">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-600/5 rounded-full blur-[140px] animate-pulse"></div>
      
      {/* 3D Floating Login Card */}
      <div className="w-full max-w-lg bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/40 rounded-[3.5rem] p-10 lg:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-1000 group">
        
        <div className="flex flex-col items-center mb-12">
          {/* Advanced 3D Mechanical Gears Container */}
          <div className="relative mb-10 perspective-1000">
             <div className="w-32 h-32 bg-gradient-to-br from-blue-900 to-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-blue-400/20 transform-style-3d rotate-x-12 rotate-y-[-12deg] group-hover:rotate-x-0 group-hover:rotate-y-0 transition-transform duration-1000 relative">
                
                {/* Large Main Gear (3D effect through layered shadows) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_12s_linear_infinite]">
                   <Settings 
                    className="text-yellow-500/90 drop-shadow-[0_4px_0_#92400e] transition-all" 
                    size={74} 
                    strokeWidth={1.5}
                   />
                </div>
                
                {/* Secondary Interlocking Gear */}
                <div className="absolute top-[20%] right-[15%] animate-[spin_8s_linear_infinite_reverse]">
                   <Settings 
                    className="text-yellow-400 drop-shadow-[0_3px_0_#78350f]" 
                    size={42} 
                    strokeWidth={2}
                   />
                </div>

                {/* Third Tiny High-Speed Gear */}
                <div className="absolute bottom-[20%] left-[25%] animate-[spin_4s_linear_infinite]">
                   <Settings 
                    className="text-blue-400/80 drop-shadow-[0_2px_0_#1e3a8a]" 
                    size={28} 
                    strokeWidth={2.5}
                   />
                </div>

                {/* Inner Core Pulse */}
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-40 absolute"></div>
             </div>

             {/* Industrial Badge */}
             <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl rotate-[-12deg] border-4 border-[#0f172a] transform group-hover:scale-110 transition-transform">
                <span className="text-black font-black text-xs">AR</span>
             </div>
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter text-center leading-tight">
            الشركة العربية <br/>
            <span className="bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-500 bg-clip-text text-transparent text-2xl font-black">لصهر وتشكيل المعادن</span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mt-5 rounded-full"></div>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-[0.4em] text-[9px]">Industrial Control System v4.0</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-black text-center mb-8 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest block">اسم المستخدم</label>
            <div className="relative group/input">
              <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-yellow-400 transition-colors" size={20} />
              <input 
                required type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم..." 
                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-[1.5rem] py-5 pr-14 pl-6 outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400/40 text-white font-bold transition-all placeholder:text-slate-700 text-sm" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest block">كلمة المرور</label>
            <div className="relative group/input">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-yellow-400 transition-colors" size={20} />
              <input 
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-900/40 border border-slate-700/50 rounded-[1.5rem] py-5 pr-14 pl-6 outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400/40 text-white font-bold transition-all placeholder:text-slate-700 text-sm" 
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-5 rounded-[1.75rem] transition-all shadow-2xl shadow-yellow-500/10 active:scale-[0.97] flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-500 mt-10 text-lg overflow-hidden relative group/btn"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                <span>دخول آمن للنظام</span>
                <ArrowLeft size={22} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-slate-600 grayscale hover:grayscale-0 transition-all cursor-default">
            <ShieldCheck size={18} className="text-yellow-500/50" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Hardware Encrypted Session</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-x-12 { transform: rotateX(12deg); }
        .rotate-y-12-neg { transform: rotateY(-12deg); }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }

        /* Custom Gear Shadowing */
        .drop-shadow-3d-gold {
          filter: drop-shadow(0 4px 0 #92400e) drop-shadow(0 8px 10px rgba(0,0,0,0.5));
        }
      `}</style>
    </div>
  );
};

export default Login;
