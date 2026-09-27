
import React from 'react';
import { LayoutDashboard, Package, ArrowLeftRight, UserCheck, ClipboardList, Settings, ShieldAlert, FileBarChart, Layers } from 'lucide-react';

export const COLORS = {
  primary: '#facc15', 
  secondary: '#1e3a8a', 
  accent: '#fde047', 
  danger: '#ef4444', 
  bgDark: '#0a0f1d', 
  bgCard: '#161e31',
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER'] },
  { id: 'item-coding', label: 'تكويد الأصناف', icon: <Package size={20} />, roles: ['ADMIN', 'MANAGER'] },
  { id: 'movements', label: 'حركة المخازن', icon: <ArrowLeftRight size={20} />, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER'] },
  { id: 'custody', label: 'إدارة العهد', icon: <UserCheck size={20} />, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER'] },
  { id: 'balances', label: 'أرصدة الأصناف والحالات', icon: <Layers size={20} />, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER'] },
  { id: 'inventory', label: 'الجرد والتسوية', icon: <ClipboardList size={20} />, roles: ['ADMIN', 'MANAGER'] },
  { id: 'reports', label: 'مركز التقارير', icon: <FileBarChart size={20} />, roles: ['ADMIN', 'MANAGER'] },
  { id: 'users', label: 'إدارة المستخدمين', icon: <ShieldAlert size={20} />, roles: ['ADMIN'] },
  { id: 'settings', label: 'إعدادات النظام', icon: <Settings size={20} />, roles: ['ADMIN'] },
];

export const INITIAL_UNITS = [
  { id: '1', name: 'كيلو' },
  { id: '2', name: 'قطعة' },
  { id: '3', name: 'طن' },
];

export const INITIAL_WAREHOUSES = [
  { id: '1', name: 'مخزن الإنتاج' },
  { id: '2', name: 'مخزن الخردة' },
];

export const INITIAL_SUPPLIERS = [
  { id: '1', name: 'شركة النصر للمسبوكات', phone: '01012345678', address: 'القاهرة، مدينة نصر' },
];

export const INITIAL_EMPLOYEES = [
  { id: '1', name: 'أحمد جمال' },
  { id: '2', name: 'ياسر محمود' },
];
