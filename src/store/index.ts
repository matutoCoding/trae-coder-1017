import type {
  Field,
  PlantingBatch,
  Harvest,
  Inventory,
  Customer,
  Order,
  Shipment,
  Return,
  PriceRecord,
} from '@/types';
import {
  initialFields,
  initialBatches,
  initialHarvests,
  initialInventory,
  initialCustomers,
  initialOrders,
  initialShipments,
  initialReturns,
  initialPrices,
  lossStats,
  monthlyReports,
  festivalForecasts as festivalPredictions,
} from '@/data/mockData';
import { create } from 'zustand';

export interface AppStats {
  totalFields: number;
  growingArea: number;
  monthlyHarvest: number;
  pendingOrders: number;
  inTransitShipments: number;
  coldChainWarnings: number;
  activeCustomers: number;
  monthlyRevenue: number;
}

interface AppState {
  fields: Field[];
  batches: PlantingBatch[];
  harvests: Harvest[];
  inventory: Inventory[];
  customers: Customer[];
  orders: Order[];
  shipments: Shipment[];
  returns: Return[];
  prices: PriceRecord[];
  lossStats: any[];
  monthlyReports: any[];
  festivalPredictions: any[];

  updateFieldStatus: (id: string, status: Field['status']) => void;
  addHarvest: (harvest: Harvest) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  addOrder: (order: Order) => void;
  addReturn: (returnItem: Return) => void;
  updateShipmentStatus: (
    id: string,
    status: Shipment['status'],
    arrivedAt?: string,
  ) => void;
  getStats: () => AppStats;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: initialFields,
  batches: initialBatches,
  harvests: initialHarvests,
  inventory: initialInventory,
  customers: initialCustomers,
  orders: initialOrders,
  shipments: initialShipments,
  returns: initialReturns,
  prices: initialPrices,
  lossStats,
  monthlyReports,
  festivalPredictions,

  updateFieldStatus: (id, status) =>
    set((state) => ({
      fields: state.fields.map((f) =>
        f.id === id ? { ...f, status } : f,
      ),
    })),

  addHarvest: (harvest) =>
    set((state) => ({
      harvests: [...state.harvests, harvest],
    })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status } : o,
      ),
    })),

  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),

  addReturn: (returnItem) =>
    set((state) => ({
      returns: [...state.returns, returnItem],
    })),

  updateShipmentStatus: (id, status, arrivedAt) =>
    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === id ? { ...s, status, arrivedAt } : s,
      ),
    })),

  getStats: () => {
    const {
      fields,
      harvests,
      orders,
      shipments,
      customers,
      monthlyReports,
    } = get();

    const totalFields = fields.length;

    const growingArea = fields
      .filter((f) => f.status === 'growing' || f.status === 'harvesting')
      .reduce((sum, f) => sum + f.area, 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyHarvest = harvests
      .filter((h) => h.harvestedAt.startsWith(currentMonth))
      .reduce((sum, h) => sum + h.quantity, 0);

    const pendingOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'picking',
    ).length;

    const inTransitShipments = shipments.filter(
      (s) => s.status === 'in_transit',
    ).length;

    const coldChainWarnings = shipments.filter((s) =>
      s.tempLogs.some(
        (log) => log.temperature > 4 || log.temperature < 0,
      ),
    ).length;

    const activeCustomers = customers.filter(
      (c) => c.status === 'active',
    ).length;

    const monthlyRevenue =
      monthlyReports.length > 0
        ? monthlyReports[monthlyReports.length - 1].revenue
        : 0;

    return {
      totalFields,
      growingArea,
      monthlyHarvest,
      pendingOrders,
      inTransitShipments,
      coldChainWarnings,
      activeCustomers,
      monthlyRevenue,
    };
  },
}));
