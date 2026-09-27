
import React, { useState } from 'react';
import { 
  ShieldCheck, Plus, Trash2, UserPlus, Lock, Shield, 
  Settings, CheckSquare, Square, Edit, User as UserIcon, Key
} from 'lucide-react';
import { User, Role, AppPermission } from '../types';
import { generateId } from '../utils';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const ALL_PERMISSIONS: { id: AppPermission; label: string; group: string }[] = [
  { id: 'VIEW_DASHBOARD', label: 'مشاهدة لوحة التحكم', group: 'عام' },
  { id: 'VIEW_CODING', label: 'تكويد الأصناف والمعدات', group: 'المخازن' },
  { id: 'VIEW_MOVEMENTS', label: 'حركات المخازن (وارد/صادر)', group: 'المخازن' },
  { id: 'VIEW_CUSTODY', label: 'إدارة العهد (صرف/استرداد)', group: 'المخازن' },
  { id: 'VIEW_INVENTORY', label: 'الجرد والتسويات اللحظية', group: 'المخازن' },
  { id: 'VIEW_REPORTS', label: 'مركز التقارير وإخلاء الطرف', group: 'عام' },
  { id: 'VIEW_USERS', label: 'إدارة مستخدمي النظام', group: 'النظام' },
  { id: 'VIEW_SETTINGS', label: 'إعدادات النظام والبيانات', group: 'النظام' },
  { id: 'ACTION_DELETE_MOVEMENTS', label: 'صلاحية حذف السجلات', group: 'رقابة' },
  { id: 'ACTION_EDIT_MOVEMENTS', label: 'صلاحية تعديل السجلات', group: 'رقابة' },
  { id: 'ACTION_INVENTORY_SETTLE', label: 'اعتماد التسوية الجردية', group: 'رقابة' },
  { id: 'ACTION_MANAGE_YEAR', label: 'إدارة قاعدة البيانات والنسخ', group: 'النظام' },
  { id: 'ACTION_UI_CUSTOMIZATION', label: 'تخصيص الواجهة والهوية', group: 'عام' },
];

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    name: '',
    role: 'STOREKEEPER',
    password: '',
    permissions: ['VIEW_DASHBOARD'],
  });

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setFormData(user);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name) return;

    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? (formData as User) : u));
    } else {
      const newUser: User = {
        id: generateId(),
        username: formData.username!,
        name: formData.name!,
        role: formData.role as Role,
        password: formData.password || '123456',
        permissions: formData.permissions as AppPermission[],
      };
      setUsers([...users, newUser]);
    }
    
    setShowModal(false);
    setEditUser(null);
    setFormData({ username: '', name: '', role: 'STOREKEEPER', password: '', permissions: ['VIEW_DASHBOARD'] });
  };

  const togglePermission = (p: AppPermission) => {
    const current = formData.permissions || [];
    if (current.includes(p)) {
      setFormData({...formData, permissions: current.filter(x => x !== p)});
    } else {
      setFormData({...formData, permissions: [...current, p]});
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-[2rem] border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
            <Shield size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white">إدارة حسابات النظام</h2>
            <p className="text-slate-400 font-bold mt-1">تخصيص الصلاحيات المفصلة والأسماء الوظيفية للمستخدمين</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditUser(null); setFormData({ username: '', name: '', role: 'STOREKEEPER', password: '', permissions: ['VIEW_DASHBOARD'] }); setShowModal(true); }}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-10 rounded-[1.5rem] flex items-center gap-3 transition-all shadow-2xl active:scale-95"
        >
          <UserPlus size={24} /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((u) => (
          <div key={u.id} className="bg-[#1e293b] p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl relative group overflow-hidden hover:border-indigo-500/30 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-indigo-400 shadow-inner">
                {u.name.charAt(0)}
              </div>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 
                u.role === 'MANAGER' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {u.role === 'ADMIN' ? 'مدير نظام' : u.role === 'MANAGER' ? 'مدير مخازن' : 'أمين مخزن'}
              </span>
            </div>

            <div className="space-y-1">
               <h4 className="text-2xl font-black text-white">{u.name}</h4>
               <p className="text-slate-500 font-bold text-xs flex items-center gap-2">
                 <UserIcon size={14} className="text-slate-600" /> الاسم البرمجي: <span className="text-indigo-400/80">@{u.username}</span>
               </p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
               <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black text-slate-600 uppercase w-full mb-1">صلاحيات سريعة:</span>
                  {u.permissions.slice(0, 3).map(p => (
                    <span key={p} className="text-[8px] font-black bg-slate-900 border border-slate-800 text-slate-500 px-2 py-1 rounded-lg">
                      {ALL_PERMISSIONS.find(ap => ap.id === p)?.label}
                    </span>
                  ))}
                  {u.permissions.length > 3 && <span className="text-[8px] font-black text-slate-700">+{u.permissions.length - 3} أخرى</span>}
               </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => handleOpenEdit(u)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 rounded-2xl font-black text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <Edit size={16} /> تعديل الحساب
              </button>
              {u.username !== 'admin' && (
                <button 
                  onClick={() => setDeleteUserId(u.id)}
                  className="p-3.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog 
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => { setUsers(users.filter(u => u.id !== deleteUserId)); setDeleteUserId(null); }}
        title="تأكيد حذف الحساب"
        message="هل أنت متأكد من حذف هذا الحساب؟ لن يتمكن الموظف من الدخول للنظام وسيتم إيقاف صلاحياته فوراً."
      />

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-5xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
               <div className="flex items-center gap-5">
                 <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                   {editUser ? <Edit size={28}/> : <UserPlus size={28} />}
                 </div>
                 <div>
                   <h3 className="text-3xl font-black text-white">{editUser ? 'تعديل بيانات الحساب' : 'إنشاء حساب مستخدم جديد'}</h3>
                   <p className="text-slate-400 text-sm font-bold mt-1">تحديد صلاحيات الوصول والبيانات الأمنية</p>
                 </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white border border-slate-700 transition-all shadow-lg">&times;</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               {/* Left: Basic Info */}
               <div className="p-10 lg:w-1/3 border-l border-slate-800/50 space-y-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">الاسم الوظيفي</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 outline-none font-bold text-white" placeholder="الاسم الكامل" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">اسم الدخول (Username)</label>
                      <input required type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono text-white" placeholder="username" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest flex items-center gap-2"><Key size={14}/> كلمة المرور</label>
                      <input required={!editUser} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 outline-none text-white" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">المسمى الوظيفي</label>
                      <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 outline-none font-bold text-slate-300 appearance-none">
                        <option value="STOREKEEPER">أمين مخزن</option>
                        <option value="MANAGER">مدير مخازن</option>
                        <option value="ADMIN">مدير نظام عام</option>
                      </select>
                    </div>
                  </div>
               </div>

               {/* Right: Detailed Permissions */}
               <div className="p-10 lg:w-2/3 space-y-8 overflow-y-auto bg-slate-900/10 custom-scrollbar">
                  <h4 className="text-xl font-black text-white flex items-center gap-3">
                    <ShieldCheck size={24} className="text-indigo-400" /> لوحة التحكم في الصلاحيات
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALL_PERMISSIONS.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`flex items-center justify-between p-5 rounded-3xl border transition-all text-right group ${
                          formData.permissions?.includes(p.id) 
                          ? 'bg-indigo-500/10 border-indigo-500/40' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`text-xs font-black ${formData.permissions?.includes(p.id) ? 'text-indigo-400' : 'text-slate-200'}`}>{p.label}</p>
                          <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">{p.group}</p>
                        </div>
                        <div className={`p-1 rounded-lg transition-all ${formData.permissions?.includes(p.id) ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-700'}`}>
                          {formData.permissions?.includes(p.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-10 p-6 bg-slate-800/30 rounded-[2rem] border border-slate-700 flex justify-between items-center">
                     <p className="text-sm font-bold text-slate-400">تأكد من مراجعة الصلاحيات الأمنية بعناية قبل الحفظ.</p>
                     <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                       حفظ البيانات الآن
                     </button>
                  </div>
               </div>
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

export default UserManagement;
