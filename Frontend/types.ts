
export type Role = 'ADMIN' | 'MANAGER' | 'STOREKEEPER';

export type AppPermission = 
  | 'VIEW_DASHBOARD' 
  | 'VIEW_CODING' 
  | 'VIEW_MOVEMENTS' 
  | 'VIEW_CUSTODY' 
  | 'VIEW_INVENTORY' 
  | 'VIEW_REPORTS' 
  | 'VIEW_USERS' 
  | 'VIEW_SETTINGS'
  | 'ACTION_DELETE_MOVEMENTS'
  | 'ACTION_EDIT_MOVEMENTS'
  | 'ACTION_INVENTORY_SETTLE'
  | 'ACTION_MANAGE_YEAR'
  | 'ACTION_UI_CUSTOMIZATION';

export interface User {
  id: string;
  username: string;
  name: string; 
  password: string;
  role: Role;
  permissions: AppPermission[];
}

export interface Unit {
  id: string;
  name: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface Employee {
  id: string;
  name: string;
}

export type CustodyState = 'NEW' | 'USED' | 'SCRAP';

export interface Item {
  id: string;
  code: string; 
  name: string;
  unitId: string;
  openingBalance: number;
  initialState?: CustodyState; // الحالة الابتدائية لرصيد أول المدة
  currentBalance: number;
  minThreshold: number; 
  isThresholdEnabled: boolean; 
  isCustody: boolean; 
  createdAt: string;
}

export type MovementType = 'INWARD' | 'OUTWARD' | 'RETURN';

export interface Movement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  unitId: string;
  docNumber: string; 
  returnDocNumber?: string;
  returnedQuantity?: number;
  warehouseId?: string;
  supplierId?: string;
  employeeId: string;
  performedBy: string; 
  status: 'NORMAL' | 'PARTIAL_RETURN' | 'FULL_RETURN';
  timestamp: string;
  balanceAfter: number; 
  balanceAfterReturn?: number; 
  note?: string;
}

export interface Custody {
  id: string;
  itemId: string; 
  employeeId: string;
  quantity: number;
  state: CustodyState;
  type: 'HANDOVER' | 'RETURN' | 'SETTLEMENT'; 
  timestamp: string;
  performedBy: string;
  docNumber: string; 
  note?: string;
  balanceAfter?: number; 
}

export interface CustodyItem {
  id: string;
  code: string;
  name: string;
  description: string;
  openingBalance: number;
  currentBalance: number;
  deployedBalance: number;
}
