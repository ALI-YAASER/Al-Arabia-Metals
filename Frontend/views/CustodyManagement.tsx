
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, RotateCcw, Search, X, ArrowDown, ArrowUp, Hash, Barcode, Tag, Activity, Users, User, ClipboardList, AlertTriangle, UserCheck, AlertCircle
} from 'lucide-react';
import { Item, Custody, Employee, User as UserType, CustodyState } from '../types';
import { generateId, formatDateTime } from '../utils';

interface CustodyProps {
  items: Item[]; 
  custodies: Custody[];
  setCustodies: React.Dispatch<React.SetStateAction<Custody[]>>;
  employees: Employee[];
  currentUser: UserType;
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

const CustodyManagement: React.FC<CustodyProps> = ({ 
  items, custodies, setCustodies, employees, currentUser, setItems 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('ALL');
  const [viewMode, setViewMode] = useState<'ALL' | 'UNRETURNED'>('ALL');
  const [movementType, setMovementType] = useState<'HANDOVER' | 'RETURN'>('HANDOVER');
  const barcodeRef = useRef<HTMLInputElement>(null);
  
  const [selectedItemId, setSelectedItemId] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    quantity: 1,
    docNumber: '',
    note: '',
    state: 'NEW' as CustodyState
  });

  useEffect(() => {
    if (showModal && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [showModal]);

  const custodyItemsOnly = useMemo(() => {
    return items.filter(it => it.isCustody);
  }, [items]);

  const handleBarcodeChange = (val: string) => {
    setBarcodeInput(val);
    const found = custodyItemsOnly.find(i => i.code === val);
    if (found) setSelectedItemId(found.id);
    else setSelectedItemId('');
  };

  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const found = custodyItemsOnly.find(i => i.id === id);
    if (found) setBarcodeInput(found.code);
    else setBarcodeInput('');
  };

  const handleOpenModal = (type: 'HANDOVER' | 'RETURN') => {
    setMovementType(type);
    setValidationError(null);
    setFormData({
      employeeId: employees[0]?.id || '',
      quantity: 1,
      docNumber: '',
      note: '',
      state: type === 'HANDOVER' ? 'NEW' : 'USED'
    });
    setSelectedItemId('');
    setBarcodeInput('');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedItemId || !formData.docNumber || formData.quantity <= 0) {
      setValidationError('يرجى ملء كافة البيانات المطلوبة والكمية');
      return;
    }

    const targetItem = items.find(i => i.id === selectedItemId);
    if (!targetItem) return;

    const qty = Math.floor(Number(formData.quantity));
    const isHandover = movementType === 'HANDOVER';
    
    // الرقابة الصارمة: منع استرداد أكثر مما هو في ذمة الموظف
    if (!isHandover) {
      const empCustodies = custodies.filter(c => c.employeeId === formData.employeeId && c.itemId === selectedItemId);
      const totalTaken = empCustodies.filter(c => c.type === 'HANDOVER').reduce((sum, c) => sum + c.quantity, 0);
      const totalReturned = empCustodies.filter(c => c.type === 'RETURN').reduce((sum, c) => sum + c.quantity, 0);
      const remainingWithEmp = totalTaken - totalReturned;

      if (qty > remainingWithEmp) {
        setValidationError(`خطأ في الاسترداد: الموظف في ذمته حالياً (${remainingWithEmp}) قطعة فقط. لا يمكن استلام (${qty}) منه.`);
        return;
      }
    } else {
      // فحص رصيد المخزن عند الصرف
      if (qty > targetItem.currentBalance) {
        setValidationError(`عجز مخزني: الرصيد المتاح من هذا الصنف هو (${Math.floor(targetItem.currentBalance)}) فقط.`);
        return;
      }
    }

    // حساب الرصيد الجديد للمخزن بناءً على الحالة
    let newCurrentBalance = targetItem.currentBalance;
    if (isHandover) {
      newCurrentBalance -= qty; // الصرف يقلل رصيد المخزن دائماً
    } else {
      // الاسترداد يزيد رصيد المخزن فقط إذا كانت الحالة (جديد أو مستعمل)
      // أما الهالك (SCRAP) فيعتبر خارج الرصيد الصالح للصرف
      if (formData.state !== 'SCRAP') {
        newCurrentBalance += qty;
      }
    }

    const newCustody: Custody = {
      id: generateId(),
      itemId: selectedItemId,
      employeeId: formData.employeeId,
      quantity: qty,
      state: formData.state,
      type: movementType,
      timestamp: new Date().toISOString(),
      performedBy: currentUser.username,
      docNumber: formData.docNumber,
      note: formData.note,
      balanceAfter: newCurrentBalance
    };

    setCustodies([newCustody, ...custodies]);
    setItems(items.map(it => it.id === targetItem.id ? { 
      ...it, 
      currentBalance: newCurrentBalance
    } : it));

    setShowModal(false);
  };

  const unreturnedCustody = useMemo(() => {
    const balances: Record<string, Record<string, number>> = {};
    custodies.forEach(c => {
      if (!balances[c.employeeId]) balances[c.employeeId] = {};
      const current = balances[c.employeeId][c.itemId] || 0;
      balances[c.employeeId][c.itemId] = c.type === 'HANDOVER' ? current + c.quantity : current - c.quantity;
    });

    const reportData: any[] = [];
    Object.entries(balances).forEach(([empId, itemBalances]) => {
      Object.entries(itemBalances).forEach(([itemId, qty]) => {
        if (qty > 0) {
          const item = items.find(i => i.id === itemId);
          const emp = employees.find(e => e.id === empId);
          reportData.push({
            id: `unret-${empId}-${itemId}`,
            employeeId: empId,
            employeeName: emp?.name || 'موظف مجهول',
            itemId: itemId,
            itemName: item?.name || 'صنف مجهول',
            itemCode: item?.code || '-',
            quantity: Math.floor(qty)
          });
        }
      });
    });
    return reportData;
  }, [custodies, items, employees]);

  const filteredData = useMemo(() => {
    if (viewMode === 'ALL') {
      return custodies.filter(c => {
        const item = items.find(i => i.id === c.itemId);
        const s = filterSearch.toLowerCase();
        const matchesSearch = (
          item?.name.toLowerCase().includes(s) || 
          c.docNumber.toLowerCase().includes(s) ||
          item?.code.toLowerCase().includes(s)
        );
        const matchesEmployee = filterEmployeeId === 'ALL' || c.employeeId === filterEmployeeId;
        return matchesSearch && matchesEmployee;
      });
    } else {
      return unreturnedCustody.filter(c => {
        const s = filterSearch.toLowerCase();
        const matchesSearch = (c.itemName.toLowerCase().includes(s) || c.itemCode.toLowerCase().includes(s));
        const matchesEmployee = filterEmployeeId === 'ALL' || c.employeeId === filterEmployeeId;
        return matchesSearch && matchesEmployee;
      });
    }
  }, [viewMode, custodies, unreturnedCustody, items, filterSearch, filterEmployeeId]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-10 font-['Cairo']">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-[2.5rem] border border-indigo-400/20 shadow-xl shadow-indigo-900/20">
             <UserCheck size={40} />
           </div>
           <div>
             <h2 className="text-4xl font-black text-white">إدارة ورقابة العُهد</h2>
             <p className="text-slate-400 font-bold mt-1 tracking-tight">النظام الموحد لمتابعة الذمم والعهد العينية - الشركة العربية</p>
           </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleOpenModal('HANDOVER')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
            <ArrowUp size={20} /> صرف عهدة
          </button>
          <button onClick={() => handleOpenModal('RETURN')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
            <ArrowDown size={20} /> استرداد عهدة
          </button>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[3rem] border border-slate-700/50 shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="relative group col-span-2">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" placeholder="بحث باسم الصنف أو الموظف أو المستند..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-white placeholder:text-slate-700"
            />
          </div>
          <div className="relative">
            <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-slate-200 appearance-none"
            >
              <option value="ALL">كل الموظفين</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
             <button onClick={() => setViewMode('ALL')} className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black transition-all ${viewMode === 'ALL' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>أرشيف الحركات</button>
             <button onClick={() => setViewMode('UNRETURNED')} className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black transition-all ${viewMode === 'UNRETURNED' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>العهد المتبقية حالياً</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-700/50">
          <table className="w-full text-right border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-800/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                {viewMode === 'ALL' ? (
                  <>
                    <th className="px-6 py-5 border-b border-slate-700">التاريخ</th>
                    <th className="px-6 py-5 border-b border-slate-700">رقم الإذن</th>
                    <th className="px-6 py-5 border-b border-slate-700">الصنف</th>
                    <th className="px-6 py-5 border-b border-slate-700">الموظف</th>
                    <th className="px-6 py-5 border-b border-slate-700">حالة الصنف</th>
                    <th className="px-6 py-5 border-b border-slate-700">نوع العملية</th>
                    <th className="px-6 py-5 border-b border-slate-700 text-center">الكمية</th>
                    <th className="px-6 py-5 border-b border-slate-700 text-emerald-400">رصيد المخزن بعد</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-5 border-b border-slate-700">الموظف المسؤول</th>
                    <th className="px-6 py-5 border-b border-slate-700">كود الصنف</th>
                    <th className="px-6 py-5 border-b border-slate-700">اسم الصنف</th>
                    <th className="px-6 py-5 border-b border-slate-700 text-center text-amber-500">الكمية في ذمة الموظف</th>
                    <th className="px-6 py-5 border-b border-slate-700 text-center">إجراء سريع</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredData.map((c: any) => {
                if (viewMode === 'ALL') {
                  const item = items.find(i => i.id === c.itemId);
                  const emp = employees.find(e => e.id === c.employeeId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-6 py-5 text-[10px] font-bold text-slate-400">{formatDateTime(c.timestamp)}</td>
                      <td className="px-6 py-5 font-black text-indigo-400 font-mono text-xs">{c.docNumber}</td>
                      <td className="px-6 py-5 font-black text-slate-100 text-xs">
                        {item?.name} <span className="text-[10px] text-slate-600 font-mono">({item?.code})</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-400 text-xs">{emp?.name}</td>
                      <td className="px-6 py-5">
                         <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                           c.state === 'NEW' ? 'bg-emerald-500/10 text-emerald-400' : 
                           c.state === 'USED' ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                         }`}>
                           {c.state === 'NEW' ? 'جديد' : c.state === 'USED' ? 'مستعمل' : 'هالك'}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black ${c.type === 'HANDOVER' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                          {c.type === 'HANDOVER' ? 'صرف عهدة' : 'استلام (رد)'}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-white text-lg text-center">{Math.floor(c.quantity)}</td>
                      <td className="px-6 py-5 font-black text-emerald-400 text-xl text-center">{Math.floor(c.balanceAfter)}</td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="px-6 py-5 font-black text-slate-100">{c.employeeName}</td>
                      <td className="px-6 py-5 font-mono text-indigo-400 text-xs">{c.itemCode}</td>
                      <td className="px-6 py-5 font-bold text-slate-200">{c.itemName}</td>
                      <td className="px-6 py-5 font-black text-amber-500 text-2xl text-center bg-amber-500/5">{Math.floor(c.quantity)}</td>
                      <td className="px-6 py-5 text-center">
                         <button onClick={() => {
                            setMovementType('RETURN');
                            setFormData({
                              employeeId: c.employeeId,
                              quantity: c.quantity,
                              docNumber: '',
                              note: `استلام متبقي من ${c.itemName}`,
                              state: 'USED'
                            });
                            setSelectedItemId(c.itemId);
                            setBarcodeInput(c.itemCode);
                            setShowModal(true);
                         }} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-md">
                           <RotateCcw size={16} /> استلام فوري
                         </button>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-4xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className={`p-10 border-b border-slate-700/50 flex justify-between items-center ${movementType === 'HANDOVER' ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl shadow-xl ${movementType === 'HANDOVER' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {movementType === 'HANDOVER' ? <ArrowUp size={32} /> : <ArrowDown size={32} />}
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white">{movementType === 'HANDOVER' ? 'تحرير إذن صرف عهدة' : 'تحرير إذن استلام عهدة'}</h3>
                   <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">تتبع دقيق لحالات المعدات (جديد/مستعمل/هالك)</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white border border-slate-700 transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              
              {validationError && (
                <div className="p-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl flex items-center gap-4 text-rose-500 animate-bounce">
                   <AlertCircle size={32} />
                   <span className="text-lg font-black">{validationError}</span>
                </div>
              )}

              <div className="space-y-4 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-indigo-400" /> تعريف أطراف العملية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 mr-2 uppercase">مسح الباركود</label>
                    <div className="relative">
                      <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        ref={barcodeRef}
                        type="text" value={barcodeInput} 
                        onChange={(e) => handleBarcodeChange(e.target.value)}
                        placeholder="امسح الباركود..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-mono font-bold text-indigo-400 focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 mr-2 uppercase">اختيار الصنف</label>
                    <div className="relative">
                      <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <select 
                        required value={selectedItemId} 
                        onChange={(e) => handleItemSelect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-slate-200 appearance-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="">-- اختر الصنف بالاسم --</option>
                        {custodyItemsOnly.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Hash size={14} className="text-indigo-400" /> رقم السند</label>
                  <input required type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-mono text-xl font-black text-white focus:ring-2 focus:ring-indigo-500/50" placeholder="0000" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={14} className="text-indigo-400" /> الموظف</label>
                  <select required value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/50">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14} className="text-indigo-400" /> حالة المعدة في هذا الإذن</label>
                  <select required value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value as CustodyState})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/50">
                    <option value="NEW">جديد (New)</option>
                    <option value="USED">مستعمل (Used)</option>
                    <option value="SCRAP">هالك / تالف (Scrap)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الكمية</label>
                  <input required type="number" step="1" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Math.floor(Number(e.target.value))})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-black text-white text-2xl focus:ring-2 focus:ring-indigo-500/50 shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ملاحظات الذمة</label>
                  <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none text-slate-200 font-bold min-h-[100px]" placeholder="مثلاً: سبب الاستهلاك أو تفاصيل تقنية..." />
                </div>
              </div>
              <button type="submit" className={`w-full py-6 rounded-[2.5rem] font-black text-xl text-white transition-all shadow-2xl active:scale-[0.98] ${movementType === 'HANDOVER' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                {movementType === 'HANDOVER' ? 'اعتماد صرف العهدة' : 'اعتماد استلام المرتجع'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CustodyManagement;
