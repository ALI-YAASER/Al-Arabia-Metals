
import React, { useState, useMemo } from 'react';
import { Bell, Search, LogOut, Package, AlertTriangle, X } from 'lucide-react';
import { User as UserType, Item } from '../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  items?: Item[];
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, items = [] }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockItems = useMemo(() => {
    return items.filter(item => 
      item.isThresholdEnabled && 
      item.currentBalance <= item.minThreshold
    );
  }, [items]);

  return (
    <header className="h-20 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-8 sticky top-0 z-[100]">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="بحث سريع عن صنف..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-yellow-400 transition-all border border-slate-700 active:scale-90"
          >
            <Bell size={20} />
            {lowStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#1e293b] animate-bounce">
                {lowStockItems.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full left-0 mt-3 w-80 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <span className="text-xs font-black uppercase text-slate-400">تنبيهات المخزون</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-600 hover:text-white"><X size={14}/></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map(item => (
                    <div key={item.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800 transition-colors flex items-center gap-4">
                      <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500">الرصيد الحرج: {item.currentBalance} | حد الأمان: {item.minThreshold}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <Package size={40} className="text-slate-800" />
                    <p className="text-xs text-slate-500 font-bold">لا توجد نواقص مفعلة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-700 mx-2"></div>

        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-sm font-bold text-slate-100">{user.name}</p>
            <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">{user.role}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-slate-700"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
