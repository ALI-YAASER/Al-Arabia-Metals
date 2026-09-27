
import React, { useState } from 'react';
import { 
  Package, Plus, Search, Barcode, Trash2, Edit, 
  History, X, CheckCircle2, Circle, ShieldCheck, AlertTriangle, Hash, Tag, Printer, Layers
} from 'lucide-react';
import { Item, Unit, Movement, CustodyState } from '../types';
import { generateId, formatDateTime } from '../utils';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface ItemCodingProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  units: Unit[];
  movements: Movement[];
}

const ItemCoding: React.FC<ItemCodingProps> = ({ items, setItems, units, movements }) => {
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newItem, setNewItem] = useState<Partial<Item>>({
    code: '',
    name: '',
    unitId: units[0]?.id || '',
    openingBalance: 0,
    minThreshold: 0,
    isThresholdEnabled: true,
    isCustody: false,
    initialState: 'NEW'
  });
  
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.code || !newItem.name) return;

    if (items.find(i => i.code === newItem.code)) {
      alert('عذراً، هذا الكود/الباركود مسجل مسبقاً لصنف آخر');
      return;
    }

    const item: Item = {
      id: generateId(),
      code: newItem.code!,
      name: newItem.name!,
      unitId: newItem.unitId || '',
      openingBalance: Math.floor(Number(newItem.openingBalance || 0)),
      currentBalance: Math.floor(Number(newItem.openingBalance || 0)),
      minThreshold: Math.floor(Number(newItem.minThreshold || 0)),
      isThresholdEnabled: !!newItem.isThresholdEnabled,
      isCustody: !!newItem.isCustody,
      initialState: newItem.isCustody ? (newItem.initialState || 'NEW') : 'NEW',
      createdAt: new Date().toISOString(),
    };

    setItems([...items, item]);
    setNewItem({ 
      code: '', 
      name: '', 
      unitId: units[0]?.id || '', 
      openingBalance: 0, 
      minThreshold: 0, 
      isThresholdEnabled: true, 
      isCustody: false,
      initialState: 'NEW'
    });
    setShowModal(false);
  };

  const handlePrintBarcode = (item: Item) => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة باركود - ${item.name}</title>
          <style>
            @font-face {
              font-family: 'Cairo';
              src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap');
            }
            body { 
              font-family: 'Cairo', sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #fff;
            }
            .label {
              border: 1px solid #000;
              padding: 20px;
              text-align: center;
              width: 300px;
            }
            .item-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              display: block;
            }
            .barcode-lines {
              display: flex;
              justify-content: center;
              height: 60px;
              margin: 10px 0;
              gap: 1px;
            }
            .bar {
              background: #000;
              height: 100%;
            }
            .b-1 { width: 1px; }
            .b-2 { width: 2px; }
            .b-3 { width: 3px; }
            .code-text {
              font-family: monospace;
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 4px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <span class="item-name">${item.name}</span>
            <div class="barcode-lines">
              ${Array(15).fill(0).map(() => `<div class="bar b-${Math.floor(Math.random() * 3) + 1}"></div>`).join('')}
            </div>
            <div class="code-text">${item.code}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const itemMovements = selectedItemHistory 
    ? movements.filter(m => m.itemId === selectedItemHistory.id)
    : [];

  const filteredItems = items.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    it.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-['Cairo']">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">تكويد الأصناف والعهد</h2>
          <p className="text-slate-400 mt-1 font-bold">تعريف المواد والمعدات مع تحديد الحالة الجردية الابتدائية</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-sky-500 hover:bg-sky-400 text-white font-black py-3 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[2.5rem] border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-700/50 flex flex-col md:flex-row gap-4 justify-between bg-slate-800/20">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold text-white placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">الكود / الباركود</th>
                <th className="px-8 py-5">اسم الصنف</th>
                <th className="px-8 py-5">النوع والحالة الابتدائية</th>
                <th className="px-8 py-5">حد الأمان</th>
                <th className="px-8 py-5">الرصيد الحالي</th>
                <th className="px-8 py-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <span className="bg-slate-900 text-sky-400 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-black">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-100">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      {item.isCustody ? (
                        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black border border-amber-500/20 flex items-center w-fit gap-1">
                          <ShieldCheck size={10}/> عهدة
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/20 flex items-center w-fit gap-1">
                          <Package size={10}/> مخزون
                        </span>
                      )}
                      {item.isCustody && (
                        <span className="text-[9px] font-bold text-slate-500 mr-1">
                          الرصيد الافتتاحي: {item.initialState === 'NEW' ? 'جديد' : item.initialState === 'USED' ? 'مستعمل' : 'هالك'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {item.isThresholdEnabled ? (
                      <span className="text-sm font-bold text-slate-400">{item.minThreshold}</span>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-bold italic">معطل</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-xl font-black ${item.isThresholdEnabled && item.currentBalance <= item.minThreshold ? 'text-red-400' : 'text-emerald-400'}`}>
                      {Math.floor(item.currentBalance)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePrintBarcode(item)}
                        className="p-2.5 bg-slate-900 rounded-xl text-slate-400 hover:text-amber-400 border border-slate-700 transition-all" title="طباعة باركود"
                      >
                        <Barcode size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedItemHistory(item); setShowHistoryModal(true); }}
                        className="p-2.5 bg-slate-900 rounded-xl text-slate-400 hover:text-sky-400 border border-slate-700 transition-all" title="سجل الحركة"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteItemId(item.id)}
                        className="p-2.5 bg-slate-900 rounded-xl text-slate-400 hover:text-red-400 border border-slate-700 transition-all" title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-3xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
                  <Plus size={28} />
                </div>
                <h3 className="text-3xl font-black text-white">تكويد صنف جديد</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-700">&times;</button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Barcode size={14} className="text-sky-400" /> كود الصنف / الباركود
                  </label>
                  <input required type="text" value={newItem.code} onChange={(e) => setNewItem({...newItem, code: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-mono text-white focus:ring-2 focus:ring-sky-500/50" placeholder="622100..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={14} className="text-sky-400" /> اسم الصنف
                  </label>
                  <input required type="text" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-white focus:ring-2 focus:ring-sky-500/50" placeholder="صاج حديد 2مم" />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                   <button 
                    type="button"
                    onClick={() => setNewItem({...newItem, isCustody: !newItem.isCustody})}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${newItem.isCustody ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                   >
                     <div className="flex items-center gap-2">
                        <ShieldCheck size={20} />
                        <span className="font-black text-xs">تصنيف كعهدة</span>
                     </div>
                     {newItem.isCustody ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                   </button>

                   <button 
                    type="button"
                    onClick={() => setNewItem({...newItem, isThresholdEnabled: !newItem.isThresholdEnabled})}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${newItem.isThresholdEnabled ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                   >
                     <div className="flex items-center gap-2">
                        <AlertTriangle size={20} />
                        <span className="font-black text-xs">تفعيل حد الطلب</span>
                     </div>
                     {newItem.isThresholdEnabled ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                   </button>
                </div>

                {newItem.isCustody && (
                  <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700/50 animate-in slide-in-from-top-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Layers size={14} className="text-amber-500" /> الحالة الجردية الابتدائية للرصيد
                    </label>
                    <div className="flex gap-4">
                       {['NEW', 'USED', 'SCRAP'].map((state) => (
                         <button 
                           key={state}
                           type="button"
                           onClick={() => setNewItem({...newItem, initialState: state as CustodyState})}
                           className={`flex-1 py-4 rounded-xl border font-black text-xs transition-all ${
                             newItem.initialState === state 
                             ? (state === 'NEW' ? 'bg-emerald-500 text-white border-emerald-400' : state === 'USED' ? 'bg-sky-500 text-white border-sky-400' : 'bg-rose-500 text-white border-rose-400')
                             : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                           }`}
                         >
                           {state === 'NEW' ? 'جديد' : state === 'USED' ? 'مستعمل' : 'هالك'}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-emerald-500" /> رصيد أول المدة
                  </label>
                  <input type="number" step="1" value={newItem.openingBalance} onChange={(e) => setNewItem({...newItem, openingBalance: Math.floor(Number(e.target.value))})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 font-black text-white outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>

                {newItem.isThresholdEnabled && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" /> الحد الأدنى للتنبيه
                    </label>
                    <input type="number" step="1" value={newItem.minThreshold} onChange={(e) => setNewItem({...newItem, minThreshold: Math.floor(Number(e.target.value))})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 font-black text-red-400 outline-none focus:ring-2 focus:ring-red-500/50" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 text-lg">حفظ البيانات</button>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && selectedItemHistory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-[#111827] w-full max-w-5xl rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <History className="text-sky-400" size={24} />
                  <h3 className="text-2xl font-black text-white">كارت الصنف: {selectedItemHistory.name}</h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-500 hover:text-white text-3xl font-black transition-all">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                      <th className="px-4 py-4">التاريخ</th>
                      <th className="px-4 py-4">النوع</th>
                      <th className="px-4 py-4">رقم السند</th>
                      <th className="px-4 py-4">الكمية</th>
                      <th className="px-4 py-4">الرصيد بعد</th>
                      <th className="px-4 py-4">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {itemMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">{formatDateTime(m.timestamp)}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${m.type === 'INWARD' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {m.type === 'INWARD' ? 'وارد' : 'منصرف'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-sky-400">{m.docNumber}</td>
                        <td className="px-4 py-4 font-black text-white">{Math.floor(m.quantity)}</td>
                        <td className="px-4 py-4 font-black text-emerald-400">{Math.floor(m.balanceAfter)}</td>
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-500">@{m.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {deleteItemId && (
        <ConfirmationDialog 
          isOpen={true} onClose={() => setDeleteItemId(null)} 
          onConfirm={() => { setItems(items.filter(i => i.id !== deleteItemId)); setDeleteItemId(null); }}
          title="حذف صنف" message="تنبيه: سيتم حذف كافة سجلات الحركة المرتبطة بهذا الصنف نهائياً."
        />
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ItemCoding;
