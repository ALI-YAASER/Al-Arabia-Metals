
import React, { useState, useEffect } from 'react';
import { 
  User, Item, Movement, Unit, Warehouse, Supplier, Employee, Custody 
} from './types';
import { 
  INITIAL_UNITS, INITIAL_WAREHOUSES, INITIAL_SUPPLIERS, 
  INITIAL_EMPLOYEES 
} from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import ItemCoding from './views/ItemCoding';
import Movements from './views/Movements';
import CustodyManagement from './views/CustodyManagement';
import BalancesView from './views/BalancesView';
import InventoryAudit from './views/InventoryAudit';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import UserManagement from './views/UserManagement';
import Login from './views/Login';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center p-10 text-center font-['Cairo']">
          <AlertOctagon size={80} className="text-rose-500 mb-6 animate-pulse" />
          <h2 className="text-3xl font-black text-white mb-4">عذراً، حدث خطأ فني غير متوقع</h2>
          <p className="text-slate-400 mb-8 max-w-md font-bold">يقوم النظام حالياً بحماية بياناتك من التلف. يرجى إعادة تشغيل البرنامج.</p>
          <button onClick={() => window.location.reload()} className="bg-sky-600 hover:bg-sky-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all">
            <RefreshCw size={20} /> إعادة تشغيل النظام فوراً
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const getStoredData = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [user, setUser] = useState<User | null>(() => getStoredData('alaria_user', null));
  const [bgImage, setBgImage] = useState<string>(() => localStorage.getItem('alaria_bg') || '');
  const [primaryColor, setPrimaryColor] = useState<string>(() => localStorage.getItem('alaria_primary') || '#facc15');
  const [serverUrl, setServerUrl] = useState<string>(() => localStorage.getItem('alaria_server_url') || 'Localhost');

  const [usersList, setUsersList] = useState<User[]>(() => getStoredData('alaria_users_list', [
    { 
      id: '1', 
      username: 'admin', 
      name: 'المدير العام', 
      password: 'admin', 
      role: 'ADMIN', 
      permissions: ['VIEW_DASHBOARD', 'VIEW_CODING', 'VIEW_MOVEMENTS', 'VIEW_CUSTODY', 'VIEW_INVENTORY', 'VIEW_REPORTS', 'VIEW_USERS', 'VIEW_SETTINGS', 'ACTION_DELETE_MOVEMENTS', 'ACTION_EDIT_MOVEMENTS', 'ACTION_INVENTORY_SETTLE', 'ACTION_MANAGE_YEAR', 'ACTION_UI_CUSTOMIZATION'] as any 
    }
  ]));

  const [items, setItems] = useState<Item[]>(() => getStoredData('alaria_items', []));
  const [movements, setMovements] = useState<Movement[]>(() => getStoredData('alaria_movements', []));
  const [custodies, setCustodies] = useState<Custody[]>(() => getStoredData('alaria_custody', []));
  const [units, setUnits] = useState<Unit[]>(() => getStoredData('alaria_units', INITIAL_UNITS));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => getStoredData('alaria_warehouses', INITIAL_WAREHOUSES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredData('alaria_suppliers', INITIAL_SUPPLIERS));
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredData('alaria_employees', INITIAL_EMPLOYEES));

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => localStorage.setItem('alaria_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('alaria_users_list', JSON.stringify(usersList)), [usersList]);
  useEffect(() => localStorage.setItem('alaria_items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('alaria_movements', JSON.stringify(movements)), [movements]);
  useEffect(() => localStorage.setItem('alaria_custody', JSON.stringify(custodies)), [custodies]);
  useEffect(() => localStorage.setItem('alaria_units', JSON.stringify(units)), [units]);
  useEffect(() => localStorage.setItem('alaria_warehouses', JSON.stringify(warehouses)), [warehouses]);
  useEffect(() => localStorage.setItem('alaria_suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('alaria_employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('alaria_bg', bgImage), [bgImage]);
  useEffect(() => localStorage.setItem('alaria_primary', primaryColor), [primaryColor]);
  useEffect(() => localStorage.setItem('alaria_server_url', serverUrl), [serverUrl]);

  if (!user) {
    return <Login onLogin={setUser} users={usersList} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard items={items} movements={movements} />;
      case 'item-coding': return <ItemCoding items={items} setItems={setItems} units={units} movements={movements} />;
      case 'movements': return <Movements items={items} setItems={setItems} movements={movements} setMovements={setMovements} units={units} warehouses={warehouses} suppliers={suppliers} employees={employees} currentUser={user} />;
      case 'custody': return <CustodyManagement items={items} custodies={custodies} setCustodies={setCustodies} employees={employees} currentUser={user} setItems={setItems} />;
      case 'balances': return <BalancesView items={items} movements={movements} custodies={custodies} />;
      case 'inventory': return <InventoryAudit items={items} setItems={setItems} movements={movements} setMovements={setMovements} custodies={custodies} setCustodies={setCustodies} currentUser={user} />;
      case 'reports': return <ReportsView items={items} setItems={setItems} movements={movements} setMovements={setMovements} custodies={custodies} setCustodies={setCustodies} employees={employees} units={units} currentUser={user} />;
      case 'users': return <UserManagement users={usersList} setUsers={setUsersList} />;
      case 'settings': return <SettingsView units={units} setUnits={setUnits} warehouses={warehouses} setWarehouses={setWarehouses} suppliers={suppliers} setSuppliers={setSuppliers} employees={employees} setEmployees={setEmployees} bgImage={bgImage} setBgImage={setBgImage} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} serverUrl={serverUrl} setServerUrl={setServerUrl} items={items} setItems={setItems} setMovements={setMovements} setCustodies={setCustodies} users={usersList} setUsers={setUsersList} />;
      default: return <Dashboard items={items} movements={movements} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-[#0f172a] text-slate-100 font-['Cairo'] overflow-hidden relative">
        {bgImage && (
          <div 
            className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          ></div>
        )}
        
        <div className="no-print z-10 h-full flex-shrink-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 z-10 h-full">
          <div className="no-print flex-shrink-0">
            <Header user={user} onLogout={() => setUser(null)} items={items} />
          </div>
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 print:p-0 print:overflow-visible">
            {renderContent()}
          </main>
          <footer className="h-8 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between px-6 no-print flex-shrink-0">
             <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> متصل بالشبكة: {serverUrl}</span>
               <span>|</span>
               <span>الشركة العربية لإدارة المعادن v4.0.0 Pro Desktop</span>
             </div>
             <div className="text-[9px] font-black text-slate-600">
                {new Date().toLocaleTimeString('ar-EG')}
             </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
