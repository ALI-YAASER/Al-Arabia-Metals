
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Search, RotateCcw, ArrowDown, ArrowUp, X, Check, 
  Barcode, Tag, Activity, Clock, ChevronLeft, User, Truck, 
  ClipboardList, Info, MessageSquare, Calendar, UserCheck, AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { 
  Item, Movement, MovementType, Unit, Warehouse, 
  Supplier, Employee, User as UserType 
} from '../types';
import { generateId, formatDateTime } from '../utils';

interface MovementsProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  units: Unit[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  employees: Employee[];
  currentUser: UserType;
}

const Movements: React.FC<MovementsProps> = ({ 
  items, setItems, movements, setMovements, units, warehouses, suppliers, employees, currentUser 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  
  const [movementType, setMovementType] = useState<MovementType>('INWARD');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState('');
  
  // دالة للحصول على التاريخ المحلي بتنسيق YYYY-MM-DD بدقة
  const getLocalToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalToday();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [activeMovementToReturn, setActiveMovementToReturn] = useState<Movement | null>(null);
  const [returnQtyInput, setReturnQtyInput] = useState(0);
  const [returnDocInput, setReturnDocInput] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    quantity: 0,
    docNumber: '',
    warehouseId: '',
    supplierId: '',
    employeeId: '',
    note: '',
  });

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('ar-EG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date());
  }, []);

  useEffect(() => {
    if (showModal && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [showModal]);

  const handleBarcodeChange = (val: string) => {
    setBarcodeInput(val);
    const found = items.find(i => i.code === val);
    if (found) setSelectedItemId(found.id);
    else setSelectedItemId('');
  };

  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const found = items.find(i => i.id === id);
    if (found) setBarcodeInput(found.code);
    else setBarcodeInput('');
  };

  const openModal = (type: MovementType) => {
    setMovementType(type);
    setStockError(null);
    setFormData({
      quantity: 0,
      docNumber: '',
      warehouseId: warehouses[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      employeeId: employees[0]?.id || '',
      note: '',
    });
    setSelectedItemId('');
    setBarcodeInput('');
    setShowModal(true);
  };

  const displayMovements = useMemo(() => {
    return movements.filter(m => {
      const item = items.find(it => it.id === m.itemId);
      const supplier = suppliers.find(s => s.id === m.supplierId);
      const emp = employees.find(e => e.id === m.employeeId);

      const matchesSearch = 
        item?.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
        item?.code.toLowerCase().includes(filterSearch.toLowerCase()) ||
        m.docNumber.toLowerCase().includes(filterSearch.toLowerCase()) ||
        supplier?.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        emp?.name.toLowerCase().includes(filterSearch.toLowerCase());

      const matchesType = filterType === 'ALL' || m.type === filterType;
      
      // استخراج تاريخ الحركة المحلي (YYYY-MM-DD) للمقارنة الدقيقة
      const mDateObj = new Date(m.timestamp);
      const mYear = mDateObj.getFullYear();
      const mMonth = String(mDateObj.getMonth() + 1).padStart(2, '0');
      const mDay = String(mDateObj.getDate()).padStart(2, '0');
      const mDateStr = `${mYear}-${mMonth}-${mDay}`;
      
      const matchesStart = !startDate || mDateStr >= startDate;
      const matchesEnd = !endDate || mDateStr <= endDate;
      
      return matchesSearch && matchesType && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movements, items, suppliers, employees, filterSearch, filterType, startDate, endDate]);

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(it => it.id === selectedItemId);
    if (!item) {
      alert('يرجى اختيار صنف صحيح');
      return;
    }

    const qty = Math.floor(Number(formData.quantity));
    
    if (movementType === 'OUTWARD' && qty > item.currentBalance) {
      setStockError(`عجز في المخزون! الرصيد المتاح حالياً هو (${Math.floor(item.currentBalance)}) فقط، ولا يمكن صرف كمية (${qty})`);
      return;
    }

    const newBalance = movementType === 'INWARD' ? item.currentBalance + qty : item.currentBalance - qty;

    const newMovement: Movement = {
      id: generateId(),
      itemId: selectedItemId,
      type: movementType,
      quantity: qty,
      unitId: item.unitId,
      docNumber: formData.docNumber,
      warehouseId: formData.warehouseId,
      supplierId: movementType === 'INWARD' ? formData.supplierId : undefined,
      employeeId: formData.employeeId,
      performedBy: currentUser.username,
      status: 'NORMAL',
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance,
      note: formData.note,
    };

    setMovements(prev => [newMovement, ...prev]);
    setItems(prev => prev.map(it => it.id === selectedItemId ? { ...it, currentBalance: newBalance } : it));
    setShowModal(false);
  };

  const submitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMovementToReturn) return;
    const m = activeMovementToReturn;
    const item = items.find(it => it.id === m.itemId);
    if (!item) return;

    const qty = Math.floor(Number(returnQtyInput));
    
    if (m.type === 'INWARD' && qty > item.currentBalance) {
      alert('لا يمكن رد كمية للمورد أكبر من الرصيد الحالي المتاح في المخزن');
      return;
    }

    const newBalance = m.type === 'INWARD' ? item.currentBalance - qty : item.currentBalance + qty;

    setMovements(prev => prev.map(move => move.id === m.id ? {
      ...move,
      status: qty >= move.quantity ? 'FULL_RETURN' : 'PARTIAL_RETURN',
      returnedQuantity: (move.returnedQuantity || 0) + qty,
      returnDocNumber: returnDocInput,
      balanceAfterReturn: newBalance,
      note: `${move.note || ''} [تم ارتجاع ${qty} بمستند ${returnDocInput}]`
    } : move));

    setItems(prev => prev.map(it => it.id === item.id ? { ...it, currentBalance: newBalance } : it));
    setShowReturnModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-[1800px] mx-auto font-['Cairo']">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-5 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-[2.5rem] border border-slate-700 shadow-xl">
             <ClipboardList size={40} />
           </div>
           <div>
             <h2 className="text-4xl font-black text-white">حركة المخازن والتشغيل</h2>
             <p className="text-slate-400 font-bold mt-1 tracking-tight">الشركة العربية لصهر وتشكيل المعادن</p>
           </div>
        </div>
        <div className="flex gap-4 no-print">
          <button onClick={() => openModal('INWARD')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-lg active:scale-95">
            <ArrowDown size={24} /> تسجيل وارد مخزني
          </button>
          <button onClick={() => openModal('OUTWARD')} className="bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-lg active:scale-95">
            <ArrowUp size={24} /> تسجيل منصرف تشغيلي
          </button>
        </div>
      </div>

      {/* لوحة الفلاتر الحديثة */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[3rem] border border-slate-700/50 shadow-2xl space-y-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          <div className="md:col-span-2 relative group">
            <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest block mb-2">بحث سريع شامل</label>
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" placeholder="بحث في السجلات والباركود والمستندات..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-14 pl-6 outline-none font-bold text-white placeholder:text-slate-700 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
          
          <div className="flex items-end gap-3 bg-slate-800/40 p-4 rounded-[2rem] border border-slate-700/50 md:col-span-2 group">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-sky-400 mr-2 uppercase flex items-center gap-1">
                <Calendar size={12}/> من تاريخ
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white font-black text-xs outline-none focus:border-sky-500/50 transition-colors" />
            </div>
            
            <div className="pb-3 text-slate-600">
               <ArrowRight size={16} />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-sky-400 mr-2 uppercase flex items-center gap-1">
                <Calendar size={12}/> إلى تاريخ
              </label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white font-black text-xs outline-none focus:border-sky-500/50 transition-colors" />
            </div>
          </div>

          <button 
            onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }} 
            className="bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-white font-black rounded-[2rem] py-4 h-[68px] flex flex-col items-center justify-center leading-tight shadow-md transition-all active:scale-95"
          >
             <span className="text-[10px] text-indigo-400 font-black">حركات اليوم</span>
             <span className="text-[11px] text-white opacity-80">{todayFormatted.split('،')[0]}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[3rem] border border-slate-700/50 shadow-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[1600px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
              <th className="px-6 py-6">التاريخ والوقت</th>
              <th className="px-6 py-6">كود الصنف</th>
              <th className="px-6 py-6">اسم الصنف</th>
              <th className="px-6 py-6">رقم السند</th>
              <th className="px-6 py-6 text-center">النوع</th>
              <th className="px-6 py-6">المورد / المستلم</th>
              <th className="px-6 py-6 text-center">الكمية</th>
              <th className="px-6 py-6 text-amber-500 text-center">المرتجع</th>
              <th className="px-6 py-6 text-emerald-400 text-center">الرصيد النهائي</th>
              <th className="px-6 py-6">المستخدم</th>
              <th className="px-6 py-6">ملاحظات</th>
              <th className="px-6 py-6 no-print text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {displayMovements.map((m) => {
              const item = items.find(it => it.id === m.itemId);
              const supplier = suppliers.find(s => s.id === m.supplierId);
              const emp = employees.find(e => e.id === m.employeeId);
              const isReturned = m.status !== 'NORMAL';
              const remaining = Math.floor(m.quantity - (m.returnedQuantity || 0));
              
              let rowStyle = {};
              if (isReturned) {
                 const baseColor = m.type === 'INWARD' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
                 const returnFlagColor = 'rgba(245, 158, 11, 0.2)'; 
                 rowStyle = { 
                   background: `linear-gradient(to left, ${baseColor} 50%, ${returnFlagColor} 50%)` 
                 };
              } else {
                 rowStyle = { 
                   backgroundColor: m.type === 'INWARD' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)' 
                 };
              }

              return (
                <tr key={m.id} style={rowStyle} className="transition-all group">
                  <td className="px-6 py-5 text-[10px] font-bold text-slate-400">{formatDateTime(m.timestamp)}</td>
                  <td className="px-6 py-5 font-mono text-sky-400 text-xs font-black">{item?.code}</td>
                  <td className="px-6 py-5 font-black text-slate-100 text-xs">{item?.name}</td>
                  <td className="px-6 py-5 font-mono text-xs text-slate-400">{m.docNumber}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${m.type === 'INWARD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'}`}>
                      {m.type === 'INWARD' ? 'وارد' : 'منصرف'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-300">
                    {m.type === 'INWARD' ? (supplier?.name || '-') : (emp?.name || '-')}
                  </td>
                  <td className="px-6 py-5 font-black text-white text-lg text-center">{Math.floor(m.quantity)}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-amber-500 font-black text-sm">{m.returnedQuantity ? Math.floor(m.returnedQuantity) : '-'}</span>
                        {m.returnedQuantity !== undefined && (
                            <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">الباقي: {remaining}</span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-emerald-400 text-2xl text-center">{Math.floor(m.balanceAfterReturn ?? m.balanceAfter)}</td>
                  <td className="px-6 py-5 text-[10px] font-bold text-slate-500">@{m.performedBy}</td>
                  <td className="px-6 py-5 max-w-[150px] truncate text-[10px] text-slate-600 italic">{m.note || '-'}</td>
                  <td className="px-6 py-5 text-center no-print">
                    {!isReturned && (
                      <button onClick={() => { setActiveMovementToReturn(m); setReturnQtyInput(m.quantity); setShowReturnModal(true); }} className="p-2.5 bg-white text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white border border-amber-500 transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                        <RotateCcw size={18}/>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {displayMovements.length === 0 && (
                <tr>
                    <td colSpan={12} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                            <Clock size={80}/>
                            <p className="text-2xl font-black italic">لا توجد حركات مسجلة للفترة المختارة</p>
                            <p className="text-xs font-bold text-slate-500">(نظام الرقابة اللحظية يعمل بشكل سليم)</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e293b] w-full max-w-4xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className={`p-10 border-b border-slate-700/50 flex justify-between items-center ${movementType === 'INWARD' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl shadow-xl ${movementType === 'INWARD' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {movementType === 'INWARD' ? <ArrowDown size={32} /> : <ArrowUp size={32} />}
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white">{movementType === 'INWARD' ? 'سند توريد مخزني' : 'سند صرف تشغيلي'}</h3>
                   <p className="text-slate-400 text-sm font-bold mt-1 tracking-widest uppercase">تاريخ اليوم: {todayFormatted}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white border border-slate-700"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveMovement} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              
              {stockError && (
                <div className="p-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl flex items-center gap-4 text-rose-500 animate-bounce">
                   <AlertOctagon size={32} />
                   <span className="text-lg font-black">{stockError}</span>
                </div>
              )}

              <div className="space-y-4 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-sky-400" /> منطقة تحديد الصنف والبيانات الفنية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 mr-2 uppercase">مسح الباركود (Barcode Scanner)</label>
                    <div className="relative">
                      <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        ref={barcodeRef}
                        type="text" value={barcodeInput} 
                        onChange={(e) => handleBarcodeChange(e.target.value)}
                        placeholder="امسح الباركود..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-mono font-bold text-sky-400 focus:ring-2 focus:ring-sky-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 mr-2 uppercase">اختيار الصنف بالاسم</label>
                    <div className="relative">
                      <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <select 
                        required value={selectedItemId} 
                        onChange={(e) => handleItemSelect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pr-12 pl-6 outline-none font-bold text-slate-200 appearance-none focus:ring-2 focus:ring-sky-500/50"
                      >
                        <option value="">-- اختر الصنف من القائمة --</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.code})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الكمية المطلوبة</label>
                  <input required type="number" step="1" value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Math.floor(Number(e.target.value))})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none text-2xl font-black text-white focus:ring-2 focus:ring-emerald-500/50 shadow-inner" placeholder="0" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم السند الرسمي</label>
                  <input required type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-mono text-xl text-white font-black" placeholder="DOC-000" />
                </div>

                {movementType === 'INWARD' ? (
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Truck size={14} className="text-sky-400"/> مورد الصنف (Supplier)</label>
                    <select required value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-200">
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} className="text-sky-400"/> المستلم / فني التشغيل</label>
                    <select required value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-200">
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-2 space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">ملاحظات إضافية</label>
                  <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-200 min-h-[100px]" placeholder="أضف أي تفاصيل تشغيلية أو فنية هنا..." />
                </div>
              </div>

              <button type="submit" className={`w-full py-6 rounded-[2.5rem] font-black text-xl text-white shadow-2xl transition-all active:scale-95 ${
                  movementType === 'INWARD' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}>
                تأكيد وترحيل السند للدفاتر
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

export default Movements;
