
import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, Search, Save, Package, History, 
  Printer, Download, Info, Layers, FileSpreadsheet, FileText, CheckCircle2, Circle, CheckSquare, Square, Hash
} from 'lucide-react';
import { Item, Movement, User, Custody, CustodyState } from '../types';
import { generateId, formatDateTime } from '../utils';

interface InventoryAuditProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  custodies: Custody[];
  setCustodies: React.Dispatch<React.SetStateAction<Custody[]>>;
  currentUser: User;
}

const InventoryAudit: React.FC<InventoryAuditProps> = ({ 
  items, setItems, movements, setMovements, custodies, setCustodies, currentUser 
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedStates, setSelectedStates] = useState<Record<string, CustodyState>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualDocNumber, setManualDocNumber] = useState(''); // رقم المحضر اليدوي

  const filteredItems = useMemo(() => {
    return items.filter(it => 
      it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      it.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Add missing toggleSelectAll function to select/deselect all filtered items
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  // Add missing toggleSelectItem function to select/deselect individual items
  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSettleItem = (item: Item, docNum: string) => {
    const physical = counts[item.id];
    if (physical === undefined) return;

    let bookBalance = Math.floor(item.currentBalance);
    const state = selectedStates[item.id] || 'NEW';

    if (item.isCustody) {
      if (state === 'USED') {
        let usedInStore = 0;
        if (item.initialState === 'USED') usedInStore += item.openingBalance;
        custodies.filter(c => c.itemId === item.id && c.state === 'USED').forEach(c => {
          if (c.type === 'RETURN') usedInStore += c.quantity;
          if (c.type === 'HANDOVER') usedInStore -= c.quantity;
        });
        bookBalance = Math.floor(usedInStore);
      } else if (state === 'SCRAP') {
        let scrapInStore = 0;
        if (item.initialState === 'SCRAP') scrapInStore += item.openingBalance;
        custodies.filter(c => c.itemId === item.id && c.state === 'SCRAP').forEach(c => {
          if (c.type === 'RETURN') scrapInStore += c.quantity;
        });
        bookBalance = Math.floor(scrapInStore);
      }
    }

    const diff = Math.floor(physical - bookBalance);
    if (diff === 0) return;

    const finalDocNum = docNum || `INV-${Date.now()}`;

    if (item.isCustody && (state === 'USED' || state === 'SCRAP')) {
      const settlement: Custody = {
        id: generateId(),
        itemId: item.id,
        employeeId: 'SYSTEM',
        type: 'SETTLEMENT',
        quantity: Math.abs(diff),
        state: state,
        timestamp: new Date().toISOString(),
        performedBy: currentUser.username,
        docNumber: finalDocNum,
        note: `تسوية جردية (${state === 'USED' ? 'مستعمل' : 'هالك'}): ${diff > 0 ? 'زيادة' : 'عجز'}`,
      };
      setCustodies(prev => [settlement, ...prev]);
    } else {
      const settlement: Movement = {
        id: generateId(),
        itemId: item.id,
        type: diff > 0 ? 'INWARD' : 'OUTWARD',
        quantity: Math.abs(diff),
        unitId: item.unitId,
        docNumber: finalDocNum,
        employeeId: 'SYSTEM',
        performedBy: currentUser.username,
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
        balanceAfter: Math.floor(item.currentBalance + diff),
        note: `تسوية جردية (جديد): ${diff > 0 ? 'زيادة' : 'عجز'}`,
      };
      setMovements(prev => [settlement, ...prev]);
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, currentBalance: Math.floor(it.currentBalance + diff) } : it));
    }
  };

  const handleBulkSettle = () => {
    const itemsToSettle = items.filter(i => selectedIds.includes(i.id) && counts[i.id] !== undefined);
    
    if (!manualDocNumber) {
      alert('يرجى إدخال رقم محضر الجرد الرسمي أولاً لتوثيق التسوية');
      return;
    }

    if (itemsToSettle.length === 0) {
      alert('يرجى اختيار أصناف وإدخال الكمية الفعلية لها أولاً');
      return;
    }
    
    itemsToSettle.forEach(item => handleSettleItem(item, manualDocNumber));
    alert(`تم ترحيل التسويات بنجاح بمحضر رقم: ${manualDocNumber}`);
    
    const newCounts = { ...counts };
    itemsToSettle.forEach(i => delete newCounts[i.id]);
    setCounts(newCounts);
    setSelectedIds([]);
    setManualDocNumber('');
  };

  const handlePrintSelectedInventory = () => {
    const selectedItems = items.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) {
      alert('يرجى اختيار أصناف للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = selectedItems.map(it => `
      <tr>
        <td style="font-family: monospace; font-weight: bold;">${it.code}</td>
        <td style="text-align: right; font-weight: bold;">${it.name}</td>
        <td style="font-size: 10px;">${it.isCustody ? 'جديد [ ] مستعمل [ ] هالك [ ]' : 'مخزون عام [ ]'}</td>
        <td style="font-weight: bold;">${Math.floor(it.currentBalance)}</td>
        <td>................</td>
        <td>................</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>محضر جرد - الشركة العربية</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 24px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 12px; text-align: center; }
            th { background: #f2f2f2; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>محضر جرد أصناف مخزنية</h1>
            <div style="font-weight:bold; margin-top:5px;">الشركة العربية لصهر وتشكيل المعادن</div>
          </div>
          <div class="meta">
            <span>رقم المحضر: ${manualDocNumber || '........'}</span>
            <span>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>الباركود</th>
                <th>اسم الصنف والمعدة</th>
                <th>الحالة</th>
                <th>الرصيد الدفتري</th>
                <th>الرصيد الفعلي</th>
                <th>ملاحظات اللجنة</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="signatures">
            <div>أمين المخزن<br/><br/>..................</div>
            <div>لجنة الجرد<br/><br/>..................</div>
            <div>اعتماد الإدارة<br/><br/>..................</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20 font-['Cairo']">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-gradient-to-br from-indigo-600 to-blue-900 text-white rounded-[2.5rem] shadow-2xl border border-blue-400/20">
            <ClipboardList size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">الجرد الفعلي والتسويات</h2>
            <p className="text-slate-400 font-bold mt-1">مطابقة الأرصدة للأصناف المختارة (أرقام صحيحة فقط)</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
             <Hash size={18} className="text-indigo-400 mr-2" />
             <input 
               type="text" 
               placeholder="رقم محضر الجرد اليدوي..." 
               value={manualDocNumber} 
               onChange={e => setManualDocNumber(e.target.value)}
               className="bg-transparent text-sm font-black text-white outline-none w-48 placeholder:text-slate-600"
             />
          </div>
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={handlePrintSelectedInventory} 
                className="bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl hover:bg-slate-100 transition-all border-2 border-slate-200 animate-in slide-in-from-left"
              >
                <Printer size={20} /> طباعة جرد فارغ ({selectedIds.length})
              </button>
              <button 
                onClick={handleBulkSettle} 
                className="bg-sky-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl hover:bg-sky-400 transition-all animate-in slide-in-from-left"
              >
                <CheckCircle2 size={20} /> اعتماد ترحيل التسوية
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-700/50 shadow-2xl no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
           <div className="relative group flex-1 max-w-xl">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" placeholder="ابحث باسم الصنف أو الباركود..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-white focus:ring-2 focus:ring-blue-500/20"
              />
           </div>
           <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-blue-400 text-xs font-bold">
              <Info size={18}/>
              <span>يرجى كتابة رقم المحضر يدوياً من الدفاتر الورقية لضمان مطابقة النظام مع السجلات الفنية.</span>
           </div>
        </div>

        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-700/50">
          <table className="w-full text-right border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-800/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-6 border-b border-slate-700 text-center w-12">
                   <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white transition-colors">
                      {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                   </button>
                </th>
                <th className="px-8 py-6 border-b border-slate-700">الصنف والبيان</th>
                <th className="px-8 py-6 border-b border-slate-700">حالة الجرد</th>
                <th className="px-8 py-6 border-b border-slate-700 text-center">الرصيد الدفتري</th>
                <th className="px-8 py-6 border-b border-slate-700 text-center">الرصيد الفعلي</th>
                <th className="px-8 py-6 border-b border-slate-700 text-center">الفارق</th>
                <th className="px-8 py-6 border-b border-slate-700 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const state = selectedStates[item.id] || 'NEW';
                let bookBalance = Math.floor(item.currentBalance);
                
                if (item.isCustody) {
                  if (state === 'USED') {
                    let usedInStore = 0;
                    if (item.initialState === 'USED') usedInStore += item.openingBalance;
                    custodies.filter(c => c.itemId === item.id && c.state === 'USED').forEach(c => {
                      if (c.type === 'RETURN') usedInStore += c.quantity;
                      if (c.type === 'HANDOVER') usedInStore -= c.quantity;
                    });
                    bookBalance = Math.floor(usedInStore);
                  } else if (state === 'SCRAP') {
                    let scrapInStore = 0;
                    if (item.initialState === 'SCRAP') scrapInStore += item.openingBalance;
                    custodies.filter(c => c.itemId === item.id && c.state === 'SCRAP').forEach(c => {
                      if (c.type === 'RETURN') scrapInStore += c.quantity;
                    });
                    bookBalance = Math.floor(scrapInStore);
                  }
                }

                const physical = Math.floor(counts[item.id] ?? bookBalance);
                const diff = physical - bookBalance;

                return (
                  <tr key={item.id} className={`hover:bg-slate-800/40 transition-all group ${isSelected ? 'bg-sky-500/5' : ''}`}>
                    <td className="px-6 py-6 text-center">
                       <button onClick={() => toggleSelectItem(item.id)} className={`${isSelected ? 'text-sky-400' : 'text-slate-700 hover:text-slate-500'} transition-colors`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                       </button>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-slate-900 border border-slate-700 rounded-xl ${item.isCustody ? 'text-amber-400' : 'text-blue-400'}`}>
                                {item.isCustody ? <Layers size={20}/> : <Package size={20}/>}
                            </div>
                            <div>
                                <p className="font-black text-slate-100 text-sm">{item.name}</p>
                                <p className="text-[10px] font-mono text-slate-500 font-bold">{item.code}</p>
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                      {item.isCustody ? (
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 w-fit">
                          {['NEW', 'USED', 'SCRAP'].map((s) => (
                              <button key={s} onClick={() => setSelectedStates({...selectedStates, [item.id]: s as CustodyState})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${state === s ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                                {s === 'NEW' ? 'جديد' : s === 'USED' ? 'مستعمل' : 'هالك'}
                              </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">مخزون عام</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-xl font-black text-slate-400">{bookBalance}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <input 
                        type="number" step="1" value={counts[item.id] ?? ''} onChange={(e) => setCounts({...counts, [item.id]: Math.floor(Number(e.target.value))})}
                        className="w-28 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-center font-black text-white text-xl outline-none"
                        placeholder={bookBalance.toString()}
                      />
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`text-xl font-black px-4 py-1 rounded-xl ${diff === 0 ? 'text-slate-700' : diff > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                         {diff > 0 ? `+${diff}` : diff}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button 
                         disabled={diff === 0}
                         onClick={() => {
                            if(!manualDocNumber) alert('يرجى إدخال رقم محضر الجرد أولاً');
                            else handleSettleItem(item, manualDocNumber);
                         }}
                         className={`px-6 py-3 rounded-2xl font-black text-[11px] transition-all flex items-center gap-2 mx-auto ${
                           diff === 0 ? 'bg-slate-800 text-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40'
                         }`}
                       >
                         اعتماد التسوية <Save size={16}/>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryAudit;
