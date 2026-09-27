
import React from 'react';
import { 
  AlertCircle, Package, UserCheck, ArrowDownLeft, 
  ArrowUpRight, ShoppingCart, History, Activity, Wrench, ChevronLeft
} from 'lucide-react';
import { Item, Movement } from '../types';
import { formatDateTime } from '../utils';

interface DashboardProps {
  items: Item[];
  movements: Movement[];
}

const Dashboard: React.FC<DashboardProps> = ({ items, movements }) => {
  const lowStockItems = items.filter(item => 
    item.minThreshold > 0 && item.currentBalance <= item.minThreshold
  );

  const recentSettlements = movements
    .filter(m => m.note?.includes('تسوية جردية'))
    .slice(0, 4);

  const topSuppliers = movements
    .filter(m => m.type === 'INWARD' && m.supplierId)
    .reduce((acc: any, curr) => {
      acc[curr.supplierId!] = (acc[curr.supplierId!] || 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">رادار العمليات</h2>
          <p className="text-slate-400 mt-1 font-bold">الحالة اللحظية للمخازن والاحتياجات التشغيلية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Urgent Shopping List - أصناف تحتاج شراء */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-700/50 shadow-2xl p-8 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-br-full"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <ShoppingCart className="text-red-400" size={24} /> قائمة المشتريات العاجلة
              </h3>
              <span className="bg-red-500/10 text-red-400 px-4 py-1.5 rounded-xl text-xs font-black border border-red-500/20">
                {lowStockItems.length} صنف يحتاج توريد
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.length > 0 ? lowStockItems.map(item => (
                <div key={item.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                       <Package size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-100 text-sm">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">حد الطلب: {item.minThreshold}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-red-400 leading-none">{item.currentBalance}</p>
                    <p className="text-[9px] text-slate-600 font-black mt-1 uppercase">الرصيد</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-12 text-center text-slate-600">
                   <Activity className="mx-auto mb-4 opacity-10" size={48} />
                   <p className="font-bold">المخزون في حالة آمنة تماماً</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Recent Adjustments - آخر التسويات */}
             <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                  <History className="text-sky-400" size={20} /> آخر التسويات الجردية
                </h3>
                <div className="space-y-4">
                   {recentSettlements.map(m => (
                     <div key={m.id} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{items.find(i => i.id === m.itemId)?.name}</p>
                          <p className="text-[9px] text-slate-500 mt-1">{formatDateTime(m.timestamp)}</p>
                        </div>
                        <span className={`text-sm font-black ${m.type === 'INWARD' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.type === 'INWARD' ? '+' : '-'}{m.quantity}
                        </span>
                     </div>
                   ))}
                   {recentSettlements.length === 0 && <p className="text-center text-xs text-slate-700 py-10 font-bold">لا توجد تسويات حديثة</p>}
                </div>
             </div>

             {/* System Health - حالة النظام */}
             <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
                   <Activity size={32} />
                </div>
                <h3 className="text-xl font-black text-white">النظام يعمل بكفاءة</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed px-4">تم تسجيل {movements.length} حركة مخزنية هذا العام بنجاح وبدون أخطاء برمجية.</p>
                <div className="mt-8 pt-6 border-t border-slate-800 w-full flex justify-around">
                   <div>
                     <p className="text-xl font-black text-sky-400">{items.length}</p>
                     <p className="text-[9px] text-slate-600 font-bold uppercase">صنف مفعل</p>
                   </div>
                   <div className="w-px h-8 bg-slate-800"></div>
                   <div>
                     <p className="text-xl font-black text-amber-500">{movements.filter(m => m.status !== 'NORMAL').length}</p>
                     <p className="text-[9px] text-slate-600 font-bold uppercase">مرتجع مسجل</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Operational Timeline - التايم لاين التشغيلي */}
        <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-700/50 shadow-2xl p-8">
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
             <Activity className="text-yellow-400" size={24} /> التدفق التشغيلي الحي
          </h3>
          <div className="space-y-6 relative">
            <div className="absolute top-0 bottom-0 right-4 w-0.5 bg-slate-800"></div>
            {movements.slice(0, 6).map((m, i) => {
              const item = items.find(it => it.id === m.itemId);
              return (
                <div key={i} className="relative pr-12 group">
                  <div className={`absolute right-2 top-1 w-4 h-4 rounded-full border-4 border-[#1e293b] z-10 ${
                    m.type === 'INWARD' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}></div>
                  <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 group-hover:bg-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatDateTime(m.timestamp)}</span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${m.type === 'INWARD' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {m.type === 'INWARD' ? 'توريد' : 'صرف'}
                       </span>
                    </div>
                    <p className="font-bold text-slate-200 text-sm truncate">{item?.name || 'صنف مجهول'}</p>
                    <div className="mt-3 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <UserCheck size={12} className="text-sky-500" />
                          <span className="text-[10px] text-slate-500 font-bold">{m.performedBy}</span>
                       </div>
                       <span className="text-lg font-black text-white">{m.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="w-full py-4 text-xs font-black text-slate-500 hover:text-sky-400 transition-colors flex items-center justify-center gap-2">
               مشاهدة السجل الكامل <ChevronLeft size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
