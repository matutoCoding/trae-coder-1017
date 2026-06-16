export type FieldStatus = 'idle' | 'growing' | 'harvesting' | 'fallow';
export type BatchStatus = 'planned' | 'planted' | 'growing' | 'ready' | 'harvesting' | 'harvested' | 'completed';
export type OrderStatus = 'pending' | 'confirmed' | 'picking' | 'shipped' | 'completed' | 'cancelled' | 'returned';
export type ShipmentStatus = 'pending' | 'departed' | 'in_transit' | 'arrived' | 'completed';
export type InventoryStatus = 'precooling' | 'stored' | 'allocated' | 'shipped' | 'sold' | 'expired';
export type CustomerType = 'funeral_home' | 'flower_shop' | 'distributor' | 'retail';
export type CustomerLevel = 'A' | 'B' | 'C' | 'D';
export type FlowerVariety = 'chrysanthemum' | 'lily' | 'carnation' | 'rose' | 'gladiolus';
export type FlowerGrade = 'A' | 'B' | 'C';

export interface TrendPoint {
  month: string;
  yield: number;
}

export interface PlantingHistory {
  batchId: string;
  variety: string;
  breed: string;
  plantedAt: string;
  harvestedAt: string;
  yield: number;
  disease?: string;
}

export interface Field {
  id: string;
  code: string;
  name: string;
  area: number;
  location: string;
  soilType: string;
  irrigation: string;
  mainVariety: string;
  status: FieldStatus;
  plantedAt?: string | null;
  harvestAt?: string | null;
  miniTrend?: TrendPoint[];
  plantingHistory?: PlantingHistory[];
}

export interface PlantingBatch {
  id: string;
  fieldId: string;
  variety: FlowerVariety;
  breed: string;
  area: number;
  plantedAt: string;
  expectedHarvestAt: string;
  forecastYield: number;
  season: string;
  status: BatchStatus;
}

export interface Harvest {
  id: string;
  batchId: string;
  fieldId: string;
  harvestedAt: string;
  quantity: number;
  staff: string;
  gradeAQty: number;
  gradeBQty: number;
  gradeCQty: number;
  defectiveQty: number;
}

export interface Inventory {
  id: string;
  harvestId: string;
  variety: string;
  grade: FlowerGrade;
  quantity: number;
  preCooledAt: string;
  preCoolTemp: number;
  preCoolDuration: number;
  preservative: string;
  location: string;
  status: InventoryStatus;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  contact: string;
  phone: string;
  address: string;
  level: CustomerLevel;
  creditLimit: number;
  paymentTerms: number;
  usedCredit: number;
  status: 'active' | 'inactive';
  totalPurchases?: number;
  joinDate?: string;
}

export interface OrderItem {
  id: string;
  variety: string;
  grade: FlowerGrade;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  createdAt: string;
  deliveryDate: string;
  deliveryAddress: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  remarks?: string;
}

export interface TempLog {
  time: string;
  timestamp?: string;
  temperature: number;
  humidity: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  vehicleNo: string;
  driver: string;
  departedAt?: string;
  estimatedArrival?: string;
  arrivedAt?: string;
  status: ShipmentStatus;
  tempLogs: TempLog[];
  route?: string;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  quantity: number;
  amount: number;
  processedAt: string;
  disposal: 'refund' | 'replace' | 'writeoff';
}

export interface PriceRecord {
  id: string;
  date: string;
  variety: string;
  grade: FlowerGrade;
  price: number;
  marketAvg: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface LossData {
  month: string;
  planting: number;
  harvest: number;
  grading: number;
  coldChain: number;
  returns: number;
}

export interface MonthlyReport {
  month: string;
  production: number;
  sales: number;
  inventory: number;
  revenue: number;
}

export interface FestivalForecast {
  festival: string;
  festivalDate: string;
  demandForecast: number;
  availableSupply: number;
  shortage: number;
  plantingAdvice: string;
  plantingWindow: {
    start: string;
    end: string;
  };
  varieties: {
    name: string;
    area: number;
  }[];
}
