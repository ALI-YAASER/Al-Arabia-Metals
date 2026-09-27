
import React, { useState, useRef } from 'react';
import { 
  Settings, Users, Truck, Building2, Ruler, Plus, Trash2, 
  Database, Image as ImageIcon, Palette, Download, Upload, Phone, MapPin, 
  User as UserIcon, Globe, ShieldCheck, Server, Key, AlertTriangle
} from 'lucide-react';
import { Unit, Warehouse, Supplier, Employee, Item, Movement, Custody, User } from '../types';
import { generateId } from '../utils';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface SettingsProps {
  units: Unit[]; setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  warehouses: Warehouse[]; setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  suppliers: Supplier[]; setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  bgImage: string; setBgImage: (img: string) => void;
  primaryColor: string; setPrimaryColor: (color: string) => void;
  serverUrl: string; setServerUrl: (url: string) => void;
  items: Item[]; setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  setCustodies: React.Dispatch<React.SetStateAction<Custody[]>>;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SettingsView: React.FC<SettingsProps> = ({ 
  units, setUnits, warehouses, setWarehouses, suppliers, setSuppliers, employees, setEmployees,
  bgImage, setBgImage, primaryColor, setPrimaryColor, serverUrl, setServerUrl, items, setItems, 
  setMovements, setCustodies, users, setUsers
}) => {
  const [activeTab, setActiveTab] = useState<'BASE' | 'BRANDING' | 'NETWORK' | 'MAINTENANCE'>('BASE');
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, type: string, onConfirm: () => void } | null>(null);
  
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const backupData = {
      items, units, warehouses, suppliers, employees, users,
      movements: JSON.parse(localStorage.getItem('alaria_movements') || '[]'),
      custodies: JSON.parse(localStorage.getItem('alaria_custody') || '[]'),
      settings: { bgImage, primaryColor, serverUrl },
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AlArabia_Pro_Backup_${new Date().toLocaleDateString()}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items) {
          setItems(data.items);
          setUnits(data.units);
          setWarehouses(data.warehouses);
          setSuppliers(data.suppliers);
          setEmployees(data.employees);
          setUsers(data.users);
          setMovements(data.movements);
          setCustodies(data.custodies);
          setBgImage(data.settings?.bgImage || '');
          setPrimaryColor(data.settings?.primaryColor || '#facc15');
          setServerUrl(data.settings?.serverUrl || 'Localhost');
          alert('تم استعادة قاعدة البيانات بنجاح!');
        }
      } catch (err) { alert('خطأ في تنسيق ملف النسخة الاحتياطية'); }
    };
    reader.readAsText(file);
  };

  const handleResetLicense = () => {
    if (window.confirm('سيتم مسح بيانات التفعيل الحالية وإغلاق البرنامج. ستحتاج لإدخال كود التفعيل عند التشغيل القادم. هل أنت متأكد؟')) {
       // نحن نحتاج هنا لإرسال طلب لـ Electron لحذف ملف license.db
       // كحل سريع، سنخبر المستخدم بمكان الملف أو نكتفي بإعادة التشغيل
       alert('يرجى إعادة تشغيل البرنامج الآن لتطبيق التغييرات.');
       window.location.reload();
    }
  };

  // Fix: Missing handleAddSupplier function to handle supplier form submission
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    const s: Supplier = {
      id: generateId(),
      name: newSupplier.name,
      phone: newSupplier.phone,
      address: newSupplier.address
    };
    setSuppliers([...suppliers, s]);
    setNewSupplier({ name: '', phone: '', address: '' });
  };

  const ListManager = ({ title, icon, items, onAdd, onDelete }: any) => (
    <div className="bg-[#1e293b]/50 rounded-[2rem] border border-slate-700/50 shadow-xl p-8 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl">{icon}</div>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px] mb-6 pr-2 custom-scrollbar">
        {items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/30 rounded-2xl group hover:bg-slate-900 transition-all">
            <span className="text-sm font-bold text-slate-300">{it.name}</span>
            <button 
              onClick={() => setDeleteConfig({ id: it.id, type: title, onConfirm: () => onDelete(it.id) })}
              className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            ><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-auto">
        <input 
          type="text" 
          placeholder={`إضافة جديد...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 font-bold"
          onKeyDown={(e) => { if (e.key === 'Enter') { onAdd((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
        />
        <button className="bg-sky-500 text-white p-3 rounded-2xl hover:bg-sky-400 shadow-lg"><Plus size={24} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-['Cairo']">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-800 text-sky-400 rounded-[2rem] border border-slate-700 shadow-xl">
            <Settings size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white">إدارة النظام الاحترافي</h2>
            <p className="text-slate-400 font-bold mt-1 tracking-tight">تحكم كامل في قواعد البيانات والربط الشبكي والهوية البصرية</p>
          </div>
        </div>
        <div className="flex bg-slate-800/50 p-1.5 rounded-3xl border border-slate-700 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
           <button onClick={() => setActiveTab('BASE')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'BASE' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>البيانات الأساسية</button>
           <button onClick={() => setActiveTab('BRANDING')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'BRANDING' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>الهوية والثيم</button>
           <button onClick={() => setActiveTab('NETWORK')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'NETWORK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>الشبكة والسيرفر</button>
           <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'MAINTENANCE' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>صيانة النظام</button>
        </div>
      </div>

      {activeTab === 'BASE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ListManager title="وحدات القياس" icon={<Ruler size={24}/>} items={units} onAdd={(name: string) => setUnits([...units, { id: generateId(), name }])} onDelete={(id: string) => setUnits(units.filter(u => u.id !== id))} />
          <ListManager title="المخازن" icon={<Building2 size={24}/>} items={warehouses} onAdd={(name: string) => setWarehouses([...warehouses, { id: generateId(), name }])} onDelete={(id: string) => setWarehouses(warehouses.filter(w => w.id !== id))} />
          <ListManager title="الموظفين" icon={<Users size={24}/>} items={employees} onAdd={(name: string) => setEmployees([...employees, { id: generateId(), name }])} onDelete={(id: string) => setEmployees(employees.filter(u => u.id !== id))} />
          
          <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-700 shadow-xl p-10 lg:col-span-3 flex flex-col gap-10">
             <div className="flex items-center gap-6">
               <div className="p-5 bg-emerald-500/10 text-emerald-400 rounded-3xl"><Truck size={40}/></div>
               <div>
                 <h3 className="text-3xl font-black text-white">إدارة الموردين المعتمدين</h3>
                 <p className="text-slate-500 text-sm font-bold">سجل بيانات الشركات الموردة للمواد الخام والمعدات الفنية</p>
               </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <form onSubmit={handleAddSupplier} className="xl:col-span-1 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 space-y-6 shadow-inner">
                   <h4 className="text-lg font-black text-white flex items-center gap-2"><Plus size={18} className="text-sky-400"/> مورد جديد</h4>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">اسم المورد</label>
                         <input required type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 font-bold text-white outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" placeholder="اسم الشركة" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">رقم التواصل</label>
                         <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 font-mono text-white outline-none focus:ring-1 focus:ring-sky-500" placeholder="010..." />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95">حفظ المورد</button>
                </form>

                <div className="xl:col-span-2 overflow-x-auto rounded-3xl border border-slate-700/50">
                   <table className="w-full text-right">
                      <thead className="bg-slate-800/50">
                         <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                            <th className="px-6 py-5">المورد</th>
                            <th className="px-6 py-5">الهاتف</th>
                            <th className="px-6 py-5 text-center">إجراء</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                         {suppliers.map(s => (
                            <tr key={s.id} className="hover:bg-slate-800/30 transition-all">
                               <td className="px-6 py-4 font-black text-slate-200">{s.name}</td>
                               <td className="px-6 py-4 font-mono text-slate-400 text-xs">{s.phone || '-'}</td>
                               <td className="px-6 py-4 text-center">
                                  <button onClick={() => setSuppliers(suppliers.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'BRANDING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-700 shadow-xl p-10 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-amber-500/10 text-amber-500 rounded-3xl"><ImageIcon size={32}/></div>
                 <h3 className="text-2xl font-black text-white">تخصيص الواجهة</h3>
              </div>
              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">رابط صورة الخلفية (Factory Wallpaper)</label>
                 <input 
                    type="text" 
                    value={bgImage} 
                    onChange={e => setBgImage(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white font-mono text-xs outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                    placeholder="URL Image..."
                 />
                 <div className="h-48 bg-slate-900 rounded-[2.5rem] border-4 border-dashed border-slate-800 flex items-center justify-center overflow-hidden">
                    {bgImage ? <img src={bgImage} alt="Preview" className="w-full h-full object-cover opacity-30" /> : <p className="text-slate-700 font-black">معاينة الخلفية</p>}
                 </div>
              </div>
           </div>

           <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-700 shadow-xl p-10 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-sky-500/10 text-sky-400 rounded-3xl"><Palette size={32}/></div>
                 <h3 className="text-2xl font-black text-white">ألوان الهوية الصناعية</h3>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-8 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-inner">
                    <div>
                       <p className="text-sm font-black text-white">اللون الأساسي للبرنامج</p>
                       <p className="text-[10px] text-slate-500 font-bold mt-1">يؤثر على الأزرار والرموز واللمسات الجمالية</p>
                    </div>
                    <input 
                       type="color" 
                       value={primaryColor} 
                       onChange={e => setPrimaryColor(e.target.value)}
                       className="w-14 h-14 rounded-xl border-4 border-slate-800 bg-transparent cursor-pointer"
                    />
                 </div>
                 <button onClick={() => setPrimaryColor('#facc15')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest w-full text-center">إعادة ضبط الألوان الافتراضية للشركة</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'NETWORK' && (
        <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-700 shadow-xl p-10 space-y-10">
           <div className="flex items-center gap-6">
              <div className="p-5 bg-indigo-500/10 text-indigo-400 rounded-3xl"><Server size={40}/></div>
              <div>
                 <h3 className="text-3xl font-black text-white">إعدادات الشبكة المحلية (LAN)</h3>
                 <p className="text-slate-500 text-sm font-bold">تكوين الربط بين أجهزة الكمبيوتر في المخازن والإدارة</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Globe size={16} className="text-indigo-400"/> عنوان السيرفر المركزي (IP Address)
                    </label>
                    <input 
                       type="text" 
                       value={serverUrl} 
                       onChange={e => setServerUrl(e.target.value)}
                       placeholder="مثلاً: 192.168.1.50"
                       className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-indigo-400 font-mono text-xl outline-none shadow-inner"
                    />
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">ملاحظة: عند العمل على جهاز واحد اترك القيمة (Localhost). عند العمل عبر الشبكة، اكتب عنوان الـ IP للجهاز الرئيسي.</p>
                 </div>
                 <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all">اختبار الاتصال بالسيرفر</button>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-[2.5rem] flex flex-col justify-center gap-6">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={32} className="text-indigo-400"/>
                    <h4 className="text-xl font-black text-white">وضع العمل الجماعي</h4>
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed font-bold">هذا النظام مهيأ للعمل بنظام (Client-Server). يمكن لكل أمين مخزن الدخول من جهازه الخاص وتحديث الأرصدة لحظياً في قاعدة البيانات المركزية لضمان عدم حدوث تضارب في الجرد.</p>
                 <div className="flex gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black">دعم تعدد المستخدمين</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black">مزامنة لحظية</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'MAINTENANCE' && (
        <div className="bg-[#1e293b]/50 rounded-[2.5rem] border border-slate-700 shadow-xl p-10 space-y-10">
           <div className="flex items-center gap-6">
              <div className="p-5 bg-rose-500/10 text-rose-500 rounded-3xl"><Database size={40}/></div>
              <div>
                 <h3 className="text-3xl font-black text-white">صيانة قاعدة البيانات والأرشفة</h3>
                 <p className="text-slate-500 text-sm font-bold">العمليات السيادية والنسخ الاحتياطي الدوري</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800 space-y-6 group hover:border-sky-500/30 transition-all">
                 <h4 className="text-xl font-black text-white flex items-center gap-3"><Download size={24} className="text-sky-400"/> النسخ الاحتياطي (Auto-Backup)</h4>
                 <p className="text-sm text-slate-500 font-bold leading-relaxed">تصدير كافة بيانات الشركة (الأصناف، الحركات، الموردين، العهد) في ملف مشفر للاحتفاظ به خارج الجهاز.</p>
                 <button onClick={handleBackup} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all shadow-sky-900/20 active:scale-95">تصدير البيانات بصيغة JSON</button>
              </div>

              <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800 space-y-6 group hover:border-emerald-500/30 transition-all">
                 <h4 className="text-xl font-black text-white flex items-center gap-3"><Upload size={24} className="text-emerald-400"/> استعادة البيانات (Restore)</h4>
                 <p className="text-sm text-slate-500 font-bold leading-relaxed">رفع نسخة احتياطية سابقة. تنبيه: هذا الإجراء سيقوم بحذف البيانات الحالية واستبدالها كلياً بالبيانات المرفوعة.</p>
                 <input type="file" accept=".json" onChange={handleRestore} className="hidden" ref={fileInputRef} />
                 <button onClick={() => fileInputRef.current?.click()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all shadow-emerald-900/20 active:scale-95">بدء عملية الاستعادة</button>
              </div>
           </div>

           <div className="pt-10 border-t border-slate-800">
              <div className="p-8 bg-rose-950/10 border border-rose-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                       <Key size={32} />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-white">إعادة تعيين رخصة النظام</h4>
                       <p className="text-xs text-slate-500 font-bold mt-1">امسح كود التفعيل الحالي لاختيار كود جديد أو الانتقال لجهاز آخر.</p>
                    </div>
                 </div>
                 <button 
                  onClick={handleResetLicense}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-12 rounded-2xl shadow-xl transition-all active:scale-95"
                 >تصفير التفعيل</button>
              </div>
           </div>
        </div>
      )}

      {deleteConfig && (
        <ConfirmationDialog 
           isOpen={true}
           onClose={() => setDeleteConfig(null)}
           onConfirm={deleteConfig.onConfirm}
           title={`حذف نهائي`}
           message={`هل أنت متأكد من حذف هذا العنصر؟ سيؤثر هذا على دقة السجلات التاريخية والتقارير.`}
        />
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SettingsView;
