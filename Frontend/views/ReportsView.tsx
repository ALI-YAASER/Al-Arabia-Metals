
import React, { useState, useMemo } from 'react';
import { 
  FileText, Printer, Search, Calendar, Package, UserCheck, 
  ArrowDownLeft, ArrowUpRight, LayoutGrid, FilePieChart, ClipboardList, Clock, 
  Hash, User, ListFilter, TrendingUp, TrendingDown, Layers, History, 
  FileSpreadsheet, AlertTriangle, UserMinus, ShieldCheck, UserCog, ArrowRightLeft,
  RotateCcw, Info, ArrowRight
} from 'lucide-react';
import { Item, Movement, Custody, Employee, Unit, User as UserType, CustodyState } from '../types';
import { formatDateTime, exportToExcel } from '../utils';

interface ReportsProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  custodies: Custody[];
  setCustodies: React.Dispatch<React.SetStateAction<Custody[]>>;
  employees: Employee[];
  units: Unit[];
  currentUser: UserType;
}

type ReportType = 'INVENTORY_ARCHIVE' | 'STOCK_LEDGER' | 'EMPLOYEE_CLEARANCE' | 'STOCK_ALERTS';

const ReportsView: React.FC<ReportsProps> = ({ 
  items, setItems, movements, setMovements, custodies, setCustodies, employees, units, currentUser 
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('STOCK_LEDGER');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  // منطق تصفية التاريخ الموحد المصلح (يدعم تصفية يوم واحد بشكل صحيح تماماً)
  const filterByDateRange = (timestamp: string) => {
    // استخراج التاريخ المحلي من الـ timestamp لضمان مطابقة دقيقة مع الـ input
    const d = new Date(timestamp);
    const localYear = d.getFullYear();
    const localMonth = String(d.getMonth() + 1).padStart(2, '0');
    const localDay = String(d.getDate()).padStart(2, '0');
    const entryDate = `${localYear}-${localMonth}-${localDay}`;
    
    const matchesStart = !startDate || entryDate >= startDate;
    const matchesEnd = !endDate || entryDate <= endDate;
    return matchesStart && matchesEnd;
  };

  // 1. Inventory Archive logic
  const inventoryArchive = useMemo(() => {
    const allSettlements = [
      ...movements.filter(m => m.note?.includes('تسوية جردية')).map(m => ({...m, source: 'STORAGE'})),
      ...custodies.filter(c => c.type === 'SETTLEMENT').map(c => ({...c, source: 'CUSTODY'}))
    ];

    return allSettlements.filter(s => {
      const item = items.find(i => i.id === s.itemId);
      const matchesDate = filterByDateRange(s.timestamp);
      const matchesItem = !filterItemId || s.itemId === filterItemId;
      const matchesSearch = !searchTerm || item?.name.toLowerCase().includes(searchTerm.toLowerCase()) || item?.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesItem && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [movements, custodies, startDate, endDate, filterItemId, searchTerm, items]);

  // 2. Advanced Stock Ledger logic
  const stockLedger = useMemo(() => {
    if (!filterItemId) return { transactions: [], initialBalance: 0, openingAtDate: 0 };
    
    const item = items.find(i => i.id === filterItemId);
    if (!item) return { transactions: [], initialBalance: 0, openingAtDate: 0 };

    let allEntries: any[] = [];
    movements.filter(m => m.itemId === filterItemId).forEach(m => {
      allEntries.push({
        timestamp: m.timestamp,
        docNumber: m.docNumber,
        actionName: m.type === 'INWARD' ? 'وارد مخزني' : 'صرف مخزني',
        in: m.type === 'INWARD' ? m.quantity : 0,
        out: m.type === 'OUTWARD' ? m.quantity : 0,
        user: m.performedBy,
        note: m.note,
        isReturn: false
      });
      if (m.returnedQuantity && m.returnedQuantity > 0) {
        allEntries.push({
          timestamp: m.timestamp,
          docNumber: m.returnDocNumber || `R-${m.docNumber}`,
          actionName: m.type === 'INWARD' ? 'مرتجع وارد (رد لمورد)' : 'مرتجع منصرف (رد لمخزن)',
          in: m.type === 'OUTWARD' ? m.returnedQuantity : 0,
          out: m.type === 'INWARD' ? m.returnedQuantity : 0,
          user: m.performedBy,
          note: `مرتجع مرتبط بالسند رقم ${m.docNumber}`,
          isReturn: true,
          originalDoc: m.docNumber
        });
      }
    });

    custodies.filter(c => c.itemId === filterItemId).forEach(c => {
      let inQty = 0; let outQty = 0; let action = '';
      if (c.type === 'HANDOVER') { outQty = c.quantity; action = 'صرف عهدة'; }
      else if (c.type === 'RETURN') { inQty = c.quantity; action = 'استرداد عهدة'; }
      else if (c.type === 'SETTLEMENT') {
        const isSurplus = c.note?.includes('زيادة');
        if (isSurplus) inQty = c.quantity; else outQty = c.quantity;
        action = 'تسوية جردية (عهدة)';
      }
      allEntries.push({ timestamp: c.timestamp, docNumber: c.docNumber, actionName: action, in: inQty, out: outQty, user: c.performedBy, note: c.note, isReturn: false });
    });

    allEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let currentBalance = Math.floor(item.openingBalance);
    let openingAtDate = currentBalance;
    const ledger: any[] = [];

    ledger.push({
      timestamp: item.createdAt || new Date(0).toISOString(),
      docNumber: 'OPEN-INV',
      actionName: 'رصيد أول المدة',
      in: Math.floor(item.openingBalance),
      out: 0,
      balance: Math.floor(item.openingBalance),
      user: 'System',
      note: 'الرصيد الافتتاحي عند تسجيل الصنف'
    });

    allEntries.forEach(entry => {
      currentBalance = currentBalance + Math.floor(entry.in) - Math.floor(entry.out);
      if (startDate && entry.timestamp.split('T')[0] < startDate) openingAtDate = currentBalance;
      ledger.push({ ...entry, balance: Math.floor(currentBalance) });
    });

    let filteredLedger = ledger.filter(l => {
      if (l.docNumber === 'OPEN-INV') return !startDate;
      return filterByDateRange(l.timestamp);
    });

    if (startDate) {
      filteredLedger.unshift({
        timestamp: startDate,
        docNumber: 'PERIOD-START',
        actionName: 'رصيد أول الفترة (منقول)',
        in: 0,
        out: 0,
        balance: Math.floor(openingAtDate),
        user: 'System',
        note: `الرصيد التراكمي في المخزن حتى تاريخ ${startDate}`
      });
    }

    return { transactions: filteredLedger, initialBalance: item.openingBalance, openingAtDate };
  }, [filterItemId, movements, custodies, items, startDate, endDate]);

  // 3. Employee Clearance logic
  const employeeClearanceData = useMemo(() => {
    if (!filterEmployeeId) return null;
    const emp = employees.find(e => e.id === filterEmployeeId);
    const empCustodies = custodies.filter(c => c.employeeId === filterEmployeeId);
    const summary: Record<string, any> = {};
    empCustodies.forEach(c => {
      const item = items.find(i => i.id === c.itemId);
      if (!item) return;
      const key = c.itemId;
      if (!summary[key]) summary[key] = { name: item.name, code: item.code, out: 0, in: 0, net: 0, returnsDetail: { NEW: 0, USED: 0, SCRAP: 0 } };
      if (c.type === 'HANDOVER') summary[key].out += c.quantity;
      else if (c.type === 'RETURN') {
        summary[key].in += c.quantity;
        if (c.state === 'NEW') summary[key].returnsDetail.NEW += c.quantity;
        else if (c.state === 'USED') summary[key].returnsDetail.USED += c.quantity;
        else if (c.state === 'SCRAP') summary[key].returnsDetail.SCRAP += c.quantity;
      }
      summary[key].net = summary[key].out - summary[key].in;
    });
    return { employee: emp, items: Object.values(summary).filter(i => i.out > 0) };
  }, [filterEmployeeId, custodies, items, employees]);

  // 4. Detailed Dead Stock Logic
  const deadStockData = useMemo(() => {
    return items.map(item => {
      const itemMoves = movements.filter(m => m.itemId === item.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastMoveDate = itemMoves.length > 0 ? itemMoves[0].timestamp : item.createdAt;
      const daysSinceLastMove = Math.floor((new Date().getTime() - new Date(lastMoveDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        lastMoveDate,
        daysSinceLastMove,
        isDead: daysSinceLastMove >= 90
      };
    }).filter(i => i.isDead).sort((a,b) => b.daysSinceLastMove - a.daysSinceLastMove);
  }, [items, movements]);

  const handleExport = () => {
    let rows: any[][] = [
      ["الشركة العربية لصهر وتشكيل المعادن"],
      []
    ];
    let fileName = "تقرير_العربية";

    if (activeReport === 'STOCK_LEDGER') {
      const item = items.find(i => i.id === filterItemId);
      fileName = `سجل_حركة_${item?.name || 'صنف'}`;
      rows[1] = ["تقرير سجل حركة صنف تفصيلي (Stock Ledger)"];
      rows.push(["بيان الصنف:", item?.name || '-', "الكود:", item?.code || '-']);
      rows.push(["الفترة من تاريخ:", startDate || 'البداية', "إلى تاريخ:", endDate || 'اليوم']);
      rows.push([]);
      rows.push(["التاريخ والوقت", "رقم السند", "بيان الحركة", "وارد (+)", "صادر (-)", "الرصيد التراكمي", "المستخدم", "ملاحظات"]);
      
      stockLedger.transactions.forEach(l => {
        rows.push([
          formatDateTime(l.timestamp),
          l.docNumber,
          l.actionName,
          l.in || 0,
          l.out || 0,
          l.balance,
          l.user,
          l.note || '-'
        ]);
      });
    } 
    else if (activeReport === 'EMPLOYEE_CLEARANCE' && employeeClearanceData) {
      fileName = `إخلاء_طرف_${employeeClearanceData.employee?.name}`;
      rows[1] = ["محضر إخلاء طرف نهائي (رقابة العُهد والذمم)"];
      rows.push(["اسم الموظف المسئول:", employeeClearanceData.employee?.name || '-']);
      rows.push(["تاريخ استخراج التقرير:", new Date().toLocaleDateString('ar-EG')]);
      rows.push([]);
      rows.push(["كود الصنف", "اسم الصنف والمعدة", "إجمالي المستلم", "مرتجع (جديد)", "مرتجع (مستعمل)", "مرتجع (هالك)", "الصافي المتبقي بالذمة"]);
      
      employeeClearanceData.items.forEach(i => {
        rows.push([
          i.code,
          i.name,
          i.out,
          i.returnsDetail.NEW,
          i.returnsDetail.USED,
          i.returnsDetail.SCRAP,
          i.net
        ]);
      });
      rows.push([]);
      rows.push(["توقيع الموظف المقر بصحة البيانات:", ".........................................."]);
    }
    else if (activeReport === 'INVENTORY_ARCHIVE') {
      fileName = "أرشيف_التسويات_الجردية";
      rows[1] = ["أرشيف التسويات الجردية المعتمدة"];
      rows.push(["الفترة من تاريخ:", startDate || 'البداية', "إلى تاريخ:", endDate || 'اليوم']);
      rows.push([]);
      rows.push(["تاريخ التسوية", "رقم المحضر", "بيان الصنف", "نطاق الجرد", "الفرق (زيادة/عجز)", "المسؤول عن الاعتماد"]);
      
      inventoryArchive.forEach(s => {
        const item = items.find(i => i.id === s.itemId);
        const isSurplus = s.note?.includes('زيادة');
        rows.push([
          formatDateTime(s.timestamp),
          s.docNumber,
          item?.name || '-',
          s.source === 'CUSTODY' ? 'ذمة موظف' : 'رصيد مخزن',
          (isSurplus ? '+' : '-') + s.quantity,
          s.performedBy
        ]);
      });
    }
    else if (activeReport === 'STOCK_ALERTS') {
      fileName = "تقرير_الأصناف_الراكده";
      rows[1] = ["تقرير الأصناف الراكدة (تجاوزت 90 يوم بدون حركة)"];
      rows.push(["تاريخ الحصر:", new Date().toLocaleDateString('ar-EG')]);
      rows.push([]);
      rows.push(["كود الصنف", "اسم الصنف والمعدة", "تاريخ آخر حركة", "مدة الركود (يوم)", "الرصيد المعطل حالياً"]);
      
      deadStockData.forEach(i => {
        rows.push([
          i.code,
          i.name,
          formatDateTime(i.lastMoveDate),
          i.daysSinceLastMove,
          i.currentBalance
        ]);
      });
    }

    exportToExcel(rows, fileName);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let content = '';
    
    if (activeReport === 'STOCK_LEDGER') {
        const item = items.find(i => i.id === filterItemId);
        const rows = stockLedger.transactions.map(l => `<tr><td>${formatDateTime(l.timestamp)}</td><td>${l.docNumber}</td><td>${l.actionName}</td><td>${l.in || '-'}</td><td>${l.out || '-'}</td><td style="font-weight:900">${l.balance}</td><td>${l.user}</td></tr>`).join('');
        content = `<div style="text-align:center; border-bottom:4px double #000; padding-bottom:15px; margin-bottom:20px;"><h1>سجل حركة صنف تفصيلي (Ledger)</h1><h2>الشركة العربية لصهر وتشكيل المعادن</h2><div>الفترة من: ${startDate || 'البداية'} إلی: ${endDate || 'اليوم'}</div></div><table border="1" style="width:100%; border-collapse:collapse; text-align:center;"><thead><tr style="background:#f2f2f2"><th>التاريخ</th><th>رقم المستند</th><th>بيان الحركة</th><th>وارد</th><th>صادر</th><th>الرصيد</th><th>المستخدم</th></tr></thead><tbody>${rows}</tbody></table>`;
    } 
    else if (activeReport === 'EMPLOYEE_CLEARANCE' && employeeClearanceData) {
        const rows = employeeClearanceData.items.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${Math.floor(i.out)}</td><td>${i.returnsDetail.NEW}</td><td>${i.returnsDetail.USED}</td><td>${i.returnsDetail.SCRAP}</td><td style="font-weight:900; color:red">${Math.floor(i.net)}</td></tr>`).join('');
        content = `<div style="text-align:center; border-bottom:4px double #000; padding-bottom:15px; margin-bottom:30px"><h1>محضر إخلاء طرف نهائي</h1><h2>الشركة العربية لصهر وتشكيل المعادن</h2><div>الموظف: <b>${employeeClearanceData.employee?.name}</b></div></div><table border="1" style="width:100%; border-collapse:collapse; text-align:center;"><thead><tr style="background:#f2f2f2"><th rowspan="2">الكود</th><th rowspan="2">الصنف</th><th rowspan="2">إجمالي المسلم</th><th colspan="3">المرتجع التفصيلي</th><th rowspan="2">الصافي</th></tr><tr style="background:#fafafa"><th>جديد</th><th>مستعمل</th><th>هالك</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:50px; display:grid; grid-template-columns: 1fr 1fr 1fr; text-align:center"><div>توقيع الموظف</div><div>أمين المخزن</div><div>المدير العام</div></div>`;
    }
    else if (activeReport === 'STOCK_ALERTS') {
        const rows = deadStockData.map(i => `
            <tr>
              <td style="font-family:monospace">${i.code}</td>
              <td style="text-align:right"><b>${i.name}</b></td>
              <td>${formatDateTime(i.lastMoveDate)}</td>
              <td style="font-weight:900; color:#991b1b">${i.daysSinceLastMove} يوم</td>
              <td style="font-size:16px; font-weight:bold">${Math.floor(i.currentBalance)}</td>
              <td style="font-size:10px">${i.isCustody ? 'صنف عهدة' : 'مخزون عام'}</td>
            </tr>
        `).join('');
        content = `
            <div style="text-align:center; border-bottom:4px double #000; padding-bottom:15px; margin-bottom:30px">
              <h1 style="margin:0">تقرير الأصناف الراكدة (Dead Stock Report)</h1>
              <h2 style="margin:5px 0">الشركة العربية لصهر وتشكيل المعادن</h2>
              <div style="margin-top:10px; font-size:14px;">تاريخ الاستخراج: <b>${new Date().toLocaleDateString('ar-EG')}</b></div>
            </div>
            <p style="font-weight:bold; color:#991b1b">تنبيه: القائمة أدناه تشمل كافة الأصناف والمعدات التي لم يتم تسجيل أي حركة سحب أو توريد عليها منذ أكثر من 90 يوماً متواصلة:</p>
            <table border="1" style="width:100%; border-collapse:collapse; text-align:center; font-family:'Cairo'">
              <tr style="background:#fee2e2; font-size:12px">
                <th>كود الصنف</th>
                <th>اسم الصنف والمعدة</th>
                <th>تاريخ آخر حركة</th>
                <th>مدة الركود باليوم</th>
                <th>الرصيد المعطل حالياً</th>
                <th>نطاق الصنف</th>
              </tr>
              ${rows}
            </table>
            <div style="margin-top:80px; display:grid; grid-template-columns: 1fr 1fr 1fr; text-align:center; font-weight:bold">
               <div>أمين المخزن المختص<br/><br/>...........................</div>
               <div>مدير المشتريات والمخازن<br/><br/>...........................</div>
               <div>المدير المالي / العام<br/><br/>...........................</div>
            </div>
        `;
    }
    else if (activeReport === 'INVENTORY_ARCHIVE') {
        const rows = inventoryArchive.map(s => {
          const item = items.find(i => i.id === s.itemId);
          const isSurplus = s.note?.includes('زيادة');
          return `<tr><td>${formatDateTime(s.timestamp)}</td><td style="font-weight:bold">${s.docNumber}</td><td>${item?.name}</td><td>${s.source === 'CUSTODY' ? 'ذمة موظف' : 'رصيد مخزن'}</td><td style="color:${isSurplus ? 'green' : 'red'}">${isSurplus ? '+' : '-'}${s.quantity}</td><td>${s.performedBy}</td></tr>`;
        }).join('');
        content = `<div style="text-align:center; border-bottom:4px double #000; padding-bottom:15px; margin-bottom:30px"><h1>أرشيف التسويات الجردية المعتمدة</h1><h2>الشركة العربية لصهر وتشكيل المعادن</h2><div>الفترة من: ${startDate || 'البداية'} إلی: ${endDate || 'اليوم'}</div></div><table border="1" style="width:100%; border-collapse:collapse; text-align:center;"><thead><tr style="background:#f2f2f2"><th>التاريخ</th><th>المحضر</th><th>الصنف</th><th>النطاق</th><th>الفرق</th><th>المسؤول</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    printWindow.document.write(`<html dir="rtl"><head><title>تقرير الشركة العربية</title><style>@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'); body{font-family:'Cairo', sans-serif; padding:40px;} table{width:100%;} th,td{padding:10px; border:1px solid #000; font-size:12px;}</style></head><body>${content}<script>window.onload=()=>{window.print();window.close();}</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 font-['Cairo']">
      
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-900 text-white rounded-[2.5rem] shadow-2xl">
            <FilePieChart size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white">مركز التقارير والرقابة</h2>
            <p className="text-slate-400 font-bold mt-1 tracking-tight">الشركة العربية لصهر وتشكيل المعادن - نظام الرقابة الشاملة</p>
          </div>
        </div>

        <div className="flex bg-slate-800/50 p-1.5 rounded-3xl border border-slate-700 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
           {[
             { id: 'STOCK_LEDGER', label: 'سجل صنف (Ledger)', icon: <History size={16}/> },
             { id: 'INVENTORY_ARCHIVE', label: 'أرشيف الجرد', icon: <ClipboardList size={16}/> },
             { id: 'EMPLOYEE_CLEARANCE', label: 'إخلاء طرف موظف', icon: <UserMinus size={16}/> },
             { id: 'STOCK_ALERTS', label: 'الركود والنواقص', icon: <AlertTriangle size={16}/> },
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveReport(tab.id as ReportType)} className={`px-8 py-3.5 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 ${activeReport === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Advanced Filter Panel - تحسين الواجهة هنا */}
      <div className="bg-[#1e293b] p-8 rounded-[3.5rem] border border-slate-700/50 shadow-2xl flex flex-wrap items-end gap-6 no-print">
         <div className="flex-1 min-w-[300px] space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">تصفية سريعة بالصنف</label>
            <select value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pr-6 pl-6 font-black text-white outline-none focus:border-indigo-500/50 appearance-none shadow-inner">
               <option value="">-- كل الأصناف المسجلة --</option>
               {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
            </select>
         </div>
         
         <div className="flex items-end gap-3 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/50 group">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-sky-400 mr-2 uppercase block">من تاريخ:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-900 border-2 border-slate-800 rounded-xl py-2.5 px-3 text-white font-black text-xs outline-none focus:border-sky-500/50 transition-all" />
            </div>
            <div className="pb-3 text-slate-600 px-1">
               <ArrowRight size={16} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-sky-400 mr-2 uppercase block">إلى تاريخ:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border-2 border-slate-800 rounded-xl py-2.5 px-3 text-white font-black text-xs outline-none focus:border-sky-500/50 transition-all" />
            </div>
         </div>

         {activeReport === 'EMPLOYEE_CLEARANCE' && (
           <div className="flex-1 min-w-[280px]">
              <label className="text-[10px] font-black text-slate-500 mr-2 uppercase block mb-1">الموظف المسؤول:</label>
              <select value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pr-6 pl-6 font-black text-white outline-none">
                 <option value="">-- اختر الموظف لعمل كشف عهدة --</option>
                 {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
           </div>
         )}
         
         <div className="flex gap-4">
            <button onClick={handlePrint} className="bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl hover:bg-slate-100 transition-all border-2 border-slate-200 active:scale-95"><Printer size={20}/> طباعة</button>
            <button onClick={handleExport} className="bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl hover:bg-emerald-500 transition-all active:scale-95"><FileSpreadsheet size={20}/> تصدير Excel</button>
         </div>
      </div>

      {/* Main Report View */}
      <div className="min-h-[500px]">
        {activeReport === 'STOCK_LEDGER' && (
          <div className="space-y-6">
            {!filterItemId ? (
              <div className="bg-slate-800/30 p-24 rounded-[3.5rem] border-2 border-dashed border-slate-700 text-center"><History size={64} className="mx-auto text-slate-700 mb-6" /><h3 className="text-2xl font-black text-slate-400">يرجى اختيار صنف من القائمة العلوية لعرض سجل حركته التفصيلي</h3></div>
            ) : (
              <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-[3.5rem] border border-slate-700/50 shadow-2xl overflow-hidden">
                <table className="w-full text-right">
                  <thead><tr className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase border-b border-slate-700"><th className="px-8 py-6">التاريخ والوقت</th><th className="px-8 py-6">رقم المستند</th><th className="px-8 py-6">البيان</th><th className="px-8 py-6">وارد (+)</th><th className="px-8 py-6">صادر (-)</th><th className="px-8 py-6 text-indigo-400">الرصيد التراكمي</th><th className="px-8 py-6">المسؤول</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">{stockLedger.transactions.map((l, idx) => (<tr key={idx} className={`hover:bg-slate-800/40 transition-all ${l.isReturn ? 'bg-amber-500/5' : ''}`}><td className="px-8 py-6 text-[11px] font-bold text-slate-400">{formatDateTime(l.timestamp)}</td><td className="px-8 py-6 font-mono text-indigo-400 font-black">{l.docNumber}</td><td className="px-8 py-6 font-black text-xs">{l.actionName}</td><td className="px-8 py-6 font-black text-emerald-500">{l.in || '-'}</td><td className="px-8 py-6 font-black text-rose-500">{l.out || '-'}</td><td className="px-8 py-6 font-black text-white text-2xl">{l.balance}</td><td className="px-8 py-6 text-[10px] font-bold text-slate-500">@{l.user}</td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeReport === 'EMPLOYEE_CLEARANCE' && (
          <div className="animate-in fade-in">
             {!filterEmployeeId ? (
               <div className="bg-slate-800/30 p-24 rounded-[3.5rem] border-2 border-dashed border-slate-700 text-center"><UserMinus size={64} className="mx-auto text-slate-700 mb-6" /><h3 className="text-2xl font-black text-slate-400">اختر موظفاً لإصدار كشف عُهد وإخلاء طرف نهائي</h3></div>
             ) : (
               <div className="bg-[#1e293b]/80 rounded-[3.5rem] border border-slate-700/50 p-12 shadow-2xl">
                  <h3 className="text-3xl font-black text-white mb-10 pb-6 border-b border-slate-800">كشف ذمة الموظف: {employeeClearanceData?.employee?.name}</h3>
                  <table className="w-full text-right border-separate border-spacing-y-3">
                    <thead><tr className="text-slate-500 text-[10px] font-black uppercase text-center"><th className="px-4 py-2 text-right">الصنف والمعدة</th><th className="px-4 py-2 bg-slate-800/50">إجمالي المسلم</th><th className="px-4 py-2 text-emerald-400">مرتجع جديد</th><th className="px-4 py-2 text-sky-400">مرتجع مستعمل</th><th className="px-4 py-2 text-rose-400">مرتجع هالك</th><th className="px-4 py-2 bg-rose-500/10 text-rose-500">الصافي المتبقي بالذمة</th></tr></thead>
                    <tbody>{employeeClearanceData?.items.map((i, idx) => (<tr key={idx} className="bg-slate-900/40 hover:bg-slate-800"><td className="p-5 font-black text-slate-100">{i.name}</td><td className="p-5 text-center font-black text-slate-200">{Math.floor(i.out)}</td><td className="p-5 text-center font-bold text-emerald-500">{i.returnsDetail.NEW}</td><td className="p-5 text-center font-bold text-sky-500">{i.returnsDetail.USED}</td><td className="p-5 text-center font-bold text-rose-500">{i.returnsDetail.SCRAP}</td><td className="p-5 text-center"><span className={`px-5 py-2 rounded-xl text-2xl font-black ${i.net > 0 ? 'bg-rose-500 text-white shadow-lg' : 'bg-emerald-500/10 text-emerald-500'}`}>{Math.floor(i.net)}</span></td></tr>))}</tbody>
                  </table>
               </div>
             )}
          </div>
        )}

        {activeReport === 'INVENTORY_ARCHIVE' && (
           <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-[3.5rem] border border-slate-700/50 shadow-2xl overflow-hidden">
                <table className="w-full text-right">
                    <thead><tr className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase border-b border-slate-700"><th className="px-8 py-6">تاريخ التسوية</th><th className="px-8 py-6">رقم المحضر الرسمي</th><th className="px-8 py-6">بيان الصنف</th><th className="px-8 py-6">نطاق الجرد</th><th className="px-8 py-6 text-center">الفرق المكتشف</th><th className="px-8 py-6">المسؤول عن الاعتماد</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                        {inventoryArchive.map((s, idx) => {
                            const item = items.find(i => i.id === s.itemId);
                            const isSurplus = s.note?.includes('زيادة');
                            return (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                                    <td className="px-8 py-6 text-xs text-slate-400">{formatDateTime(s.timestamp)}</td>
                                    <td className="px-8 py-6 font-mono text-xs text-indigo-400 font-black">{s.docNumber}</td>
                                    <td className="px-8 py-6 font-black text-slate-100">{item?.name}</td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-slate-500">{s.source === 'CUSTODY' ? 'ذمة موظف' : 'رصيد مخزن'}</td>
                                    <td className="px-8 py-6 font-black text-2xl text-center">
                                       <span className={isSurplus ? 'text-emerald-500' : 'text-rose-500'}>{isSurplus ? '+' : '-'}{Math.floor(s.quantity)}</span>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-500">@{s.performedBy}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
           </div>
        )}

        {activeReport === 'STOCK_ALERTS' && (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
             <div className="bg-[#1e293b]/80 backdrop-blur-md rounded-[3.5rem] border-2 border-rose-500/20 shadow-2xl p-10">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-700/30">
                  <h3 className="text-3xl font-black text-rose-500 flex items-center gap-4 uppercase tracking-tighter">
                     <ShieldCheck size={40}/> الأصناف الراكدة (تجاوزت 90 يوم بدون حركة)
                  </h3>
                  <div className="bg-rose-500/10 text-rose-400 px-6 py-2 rounded-2xl font-black border border-rose-500/20">
                    إجمالي الركود: {deadStockData.length} صنف
                  </div>
                </div>
                
                {deadStockData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {deadStockData.map(i => (
                      <div key={i.id} className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-rose-500/40 transition-all relative overflow-hidden">
                         <div className="mb-4">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{i.code}</p>
                           <p className="text-xl font-black text-slate-100 group-hover:text-rose-400 transition-colors">{i.name}</p>
                         </div>
                         <div className="mt-6 space-y-4 pt-4 border-t border-slate-800/50">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">آخر حركة سحب:</span><span className="text-xs font-bold text-slate-300">{formatDateTime(i.lastMoveDate).split(' ')[0]}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">مدة الركود:</span><span className="text-2xl font-black text-rose-500">{i.daysSinceLastMove} <small className="text-[10px] text-slate-500 uppercase">يوم</small></span></div>
                            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl"><span className="text-[10px] font-black text-slate-400 uppercase">الرصيد المعطل حالياً:</span><span className="text-2xl font-black text-white">{Math.floor(i.currentBalance)}</span></div>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-600 italic font-black text-2xl opacity-20">لا توجد أصناف راكدة حالياً - كفاءة المخزون مثالية تماماً</div>
                )}
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ReportsView;
