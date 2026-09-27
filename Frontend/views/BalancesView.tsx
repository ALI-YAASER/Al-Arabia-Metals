
import React, { useMemo, useState } from 'react';
import { Layers, Search, Package, CheckCircle2, RotateCcw, Trash2, Info } from 'lucide-react';
import { Item, Movement, Custody } from '../types';

interface BalancesViewProps {
  items: Item[];
  movements: Movement[];
  custodies: Custody[];
}

const BalancesView: React.FC<BalancesViewProps> = ({ items, movements, custodies }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const detailedBalances = useMemo(() => {
    return items.map(item => {
      // رصيد أول المدة يوزع حسب الحالة الابتدائية المختارة عند التكويد
      let newQty = 0;
      let usedQty = 0;
      let scrapQty = 0;

      const opening = item.openingBalance || 0;
      if (!item.isCustody || item.initialState === 'NEW') newQty = opening;
      else if (item.initialState === 'USED') usedQty = opening;
      else if (item.initialState === 'SCRAP') scrapQty = opening;

      // حساب من حركات المخازن العادية (دائماً نعتبرها جديد في المخزون العام)
      movements.filter(m => m.itemId === item.id).forEach(m => {
        if (m.type === 'INWARD') newQty += m.quantity;
        else if (m.type === 'OUTWARD') newQty -= m.quantity;
        
        if (m.returnedQuantity) {
            if (m.type === 'INWARD') newQty -= m.returnedQuantity;
            else newQty += m.returnedQuantity;
        }
      });

      // حساب من حركات العهد (التي تحتوي على حالات محددة)
      custodies.filter(c => c.itemId === item.id).forEach(c => {
        if (c.type === 'HANDOVER') {
          if (c.state === 'NEW') newQty -= c.quantity;
          else if (c.state === 'USED') usedQty -= c.quantity;
          else if (c.state === 'SCRAP') scrapQty -= c.quantity;
        } else if (c.type === 'RETURN') {
          if (c.state === 'NEW') newQty += c.quantity;
          else if (c.state === 'USED') usedQty += c.quantity;
          else if (c.state === 'SCRAP') scrapQty += c.quantity;
        } else if (c.type === 'SETTLEMENT') {
           // في حالة التسوية الجردية، الحركة تعبر عن فرق الرصيد في تلك الحالة
           const diff = c.quantity; // الكمية في التسوية هي مقدار الفرق (+/-)
           // ملاحظة: التسويات المخزنة في النظام الحالي تمثل مقدار التصحيح
           // إذا كانت التسوية "زيادة" (موجب) تضاف، "عجز" (سالب) تخصم
           // هنا نعتمد على Note لمعرفة الاتجاه كما في InventoryAudit
           const isSurplus = c.note?.includes('زيادة');
           const val = isSurplus ? diff : -diff;

           if (c.state === 'NEW') newQty += val;
           else if (c.state === 'USED') usedQty += val;
           else if (c.state === 'SCRAP') scrapQty += val;
        }
      });

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        isCustody: item.isCustody,
        newQty,
        usedQty,
        scrapQty,
        netBalance: newQty + usedQty // الرصيد الصالح للاستخدام (جديد + مستعمل)
      };
    });
  }, [items, movements, custodies]);

  const filteredBalances = detailedBalances.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-[1600px] mx-auto font-['Cairo']">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-700 text-black rounded-[2.5rem] border border-amber-400/20 shadow-xl shadow-amber-900/20">
             <Layers size={40} />
           </div>
           <div>
             <h2 className="text-4xl font-black text-white tracking-tight">أرصدة الأصناف والحالات</h2>
             <p className="text-slate-400 font-bold mt-1 tracking-tight">توزيع الأرصدة الفعلية بناءً على الحالات التشغيلية والعهدة</p>
           </div>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[3rem] border border-slate-700/50 shadow-2xl no-print">
        <div className="relative group max-w-xl">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={20} />
          <input 
            type="text" placeholder="بحث باسم الصنف أو الكود..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[3rem] border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-800/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-5 border-b border-slate-700">الصنف والبيان</th>
                <th className="px-6 py-5 border-b border-slate-700 text-center">جديد (New)</th>
                <th className="px-6 py-5 border-b border-slate-700 text-center">مستعمل (Used)</th>
                <th className="px-6 py-5 border-b border-slate-700 text-center text-rose-500">هالك (Scrap)</th>
                <th className="px-6 py-5 border-b border-slate-700 text-center text-emerald-400">الرصيد الصافي المتاح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBalances.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl bg-slate-800 border border-slate-700 shadow-inner group-hover:border-amber-500/30 transition-all ${b.isCustody ? 'text-amber-500' : 'text-blue-500'}`}>
                        <Package size={20}/>
                      </div>
                      <div>
                        <p className="font-black text-slate-100 text-sm">{b.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 font-bold">{b.code} {b.isCustody && <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1 rounded ml-1 font-black">صنف عهدة</span>}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-xl font-black text-slate-200">{b.newQty}</span>
                       <span className="text-[8px] font-black text-slate-600 uppercase">Available New</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-xl font-black text-sky-400">{b.usedQty}</span>
                       <span className="text-[8px] font-black text-slate-600 uppercase">Re-usable</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-xl font-black text-rose-500">{b.scrapQty}</span>
                       <span className="text-[8px] font-black text-slate-600 uppercase">Non-Usable</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center bg-emerald-500/5">
                    <div className="flex flex-col items-center">
                       <span className="text-2xl font-black text-emerald-400">{b.netBalance}</span>
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Total Active</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBalances.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-20 text-center text-slate-700 italic font-black">لا توجد أصناف لعرض أرصدتها</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-800/50 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic">
             <Info size={14} className="text-blue-400" />
             <span>الرصيد الصافي المتاح هو مجموع الكميات (الجديدة + المستعملة) القابلة للصرف والتشغيل، ويتم استبعاد الهالك من العمليات.</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BalancesView;
