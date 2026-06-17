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
  TempLog,
  PaymentReminder,
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

export interface WarningRecord {
  shipmentId: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
  handler?: string;
  remark?: string;
}

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
  warningRecords: WarningRecord[];
  paymentReminders: PaymentReminder[];

  updateFieldStatus: (id: string, status: Field['status']) => void;
  addHarvest: (harvest: Harvest) => void;
  addInventoryItems: (items: Inventory[]) => void;
  updateInventoryStatus: (id: string, status: Inventory['status']) => Inventory | null;
  getAvailableStock: (variety: string, grade: string) => number;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  addOrder: (order: Order) => void;
  addReturn: (returnItem: Return) => void;
  addShipment: (shipment: Shipment) => void;
  createShipmentFromOrder: (orderId: string) => Shipment;
  getShipmentForOrder: (orderId: string) => Shipment | undefined;
  dispatchShipment: (shipmentId: string) => Shipment | null;
  batchDispatchShipments: (shipmentIds: string[], vehicleNo: string, driver: string) => Shipment[];
  updateShipmentStatus: (
    id: string,
    status: Shipment['status'],
    arrivedAt?: string,
  ) => void;
  updateCustomerCredit: (
    customerId: string,
    newLimit: number,
    remark?: string,
  ) => Customer | null;
  addPaymentReminder: (
    customerId: string,
    message: string,
    amount: number,
  ) => PaymentReminder | null;
  getPaymentRemindersForCustomer: (customerId: string) => PaymentReminder[];
  resolveWarning: (
    shipmentId: string,
    resolution: string,
    handler: string,
    remark?: string,
  ) => boolean;
  getStats: () => AppStats;
  generateTempLogs: (startTime: string, hours: number) => TempLog[];
}

const VEHICLES = [
  { vehicleNo: '沪B·D8521', driver: '李师傅' },
  { vehicleNo: '沪B·E3769', driver: '王师傅' },
  { vehicleNo: '沪B·F5284', driver: '张师傅' },
  { vehicleNo: '沪B·G9035', driver: '刘师傅' },
];

const PRE_COOL_LOCATIONS = ['冷库A-01', '冷库A-02', '冷库A-03', '冷库B-01', '冷库B-02', '冷库C-01'];

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
  warningRecords: [],
  paymentReminders: [],

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

  addInventoryItems: (items) =>
    set((state) => ({
      inventory: [...state.inventory, ...items],
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

  addShipment: (shipment) =>
    set((state) => ({
      shipments: [...state.shipments, shipment],
    })),

  generateTempLogs: (startTime: string, hours: number) => {
    const logs: TempLog[] = [];
    const start = new Date(startTime);
    const totalPoints = hours * 6;
    let baseTemp = 2.5;
    let baseHumidity = 82;

    for (let i = 0; i < totalPoints; i++) {
      const time = new Date(start.getTime() + i * 10 * 60000);
      const tempVariation = (Math.sin(i * 0.3) + Math.cos(i * 0.5)) * 0.8;
      const humVariation = (Math.sin(i * 0.4) + Math.cos(i * 0.2)) * 3;
      let temp = baseTemp + tempVariation + (Math.random() - 0.5) * 0.6;
      let humidity = Math.max(65, Math.min(95, baseHumidity + humVariation + (Math.random() - 0.5) * 5));

      if (i > 50 && i < 58 && Math.random() > 0.5) {
        temp = 4.5 + Math.random() * 2;
      }

      logs.push({
        time: time.toISOString().slice(0, 16).replace('T', ' '),
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(0)),
      });
    }
    return logs;
  },

  createShipmentFromOrder: (orderId) => {
    const { orders, shipments, generateTempLogs } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const usedVehicles = shipments.map((s) => s.vehicleNo);
    const availableVehicle = VEHICLES.find((v) => !usedVehicles.includes(v.vehicleNo)) || VEHICLES[0];
    const now = new Date();
    const estimatedHours = 3 + Math.floor(Math.random() * 5);
    const estArrival = new Date(now.getTime() + estimatedHours * 3600000);

    const newShipment: Shipment = {
      id: `SH-${Date.now()}`,
      orderId,
      vehicleNo: availableVehicle.vehicleNo,
      driver: availableVehicle.driver,
      departedAt: now.toISOString(),
      estimatedArrival: estArrival.toISOString(),
      status: 'departed',
      tempLogs: generateTempLogs(now.toISOString(), estimatedHours + 1),
      route: order.deliveryAddress,
    };

    return newShipment;
  },

  dispatchShipment: (shipmentId) => {
    const { shipments, generateTempLogs } = get();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    const now = new Date();
    const estimatedHours = 3 + Math.floor(Math.random() * 5);
    const estArrival = new Date(now.getTime() + estimatedHours * 3600000);

    const updated: Shipment = {
      ...shipment,
      departedAt: now.toISOString(),
      estimatedArrival: estArrival.toISOString(),
      status: 'departed' as const,
      tempLogs: generateTempLogs(now.toISOString(), estimatedHours + 1),
    };

    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === shipmentId ? updated : s,
      ),
    }));

    return updated;
  },

  updateShipmentStatus: (id, status, arrivedAt) =>
    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === id ? { ...s, status, arrivedAt: arrivedAt || s.arrivedAt } : s,
      ),
    })),

  updateCustomerCredit: (customerId, newLimit, remark) => {
    const customer = get().customers.find((c) => c.id === customerId);
    if (!customer) return null;

    const updated: Customer = {
      ...customer,
      creditLimit: newLimit,
    };

    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? updated : c,
      ),
    }));

    return updated;
  },

  addPaymentReminder: (customerId, message, amount) => {
    const customer = get().customers.find((c) => c.id === customerId);
    if (!customer) return null;

    const reminder: PaymentReminder = {
      id: `PR-${Date.now()}`,
      customerId,
      amount,
      message,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    set((state) => ({
      paymentReminders: [...state.paymentReminders, reminder],
    }));

    console.log(`[催款提醒] 已向 ${customer.name} 发送催款通知，金额 ¥${amount.toLocaleString()}：${message}`);
    return reminder;
  },

  getPaymentRemindersForCustomer: (customerId) => {
    return get().paymentReminders
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  getShipmentForOrder: (orderId) => {
    return get().shipments.find((s) => s.orderId === orderId);
  },

  batchDispatchShipments: (shipmentIds, vehicleNo, driver) => {
    const { shipments, generateTempLogs } = get();
    const now = new Date();
    const updated: Shipment[] = [];

    shipmentIds.forEach((id) => {
      const shipment = shipments.find((s) => s.id === id);
      if (shipment && shipment.status === 'pending') {
        const estimatedHours = 3 + Math.floor(Math.random() * 5);
        const estArrival = new Date(now.getTime() + estimatedHours * 3600000);

        const updatedShipment: Shipment = {
          ...shipment,
          vehicleNo,
          driver,
          departedAt: now.toISOString(),
          estimatedArrival: estArrival.toISOString(),
          status: 'departed',
          tempLogs: generateTempLogs(now.toISOString(), estimatedHours + 1),
        };
        updated.push(updatedShipment);
      }
    });

    set((state) => ({
      shipments: state.shipments.map((s) => {
        const found = updated.find((u) => u.id === s.id);
        return found || s;
      }),
    }));

    return updated;
  },

  updateInventoryStatus: (id, status) => {
    const inventory = get().inventory.find((i) => i.id === id);
    if (!inventory) return null;

    const updated: Inventory = { ...inventory, status };

    set((state) => ({
      inventory: state.inventory.map((i) =>
        i.id === id ? updated : i,
      ),
    }));

    return updated;
  },

  getAvailableStock: (variety, grade) => {
    return get()
      .inventory.filter((i) =>
        i.variety === variety &&
        i.grade === grade &&
        (i.status === 'stored' || i.status === 'precooling')
      )
      .reduce((sum, i) => sum + i.quantity, 0);
  },

  resolveWarning: (shipmentId, resolution, handler, remark) => {
    const shipment = get().shipments.find((s) => s.id === shipmentId);
    if (!shipment) return false;

    const now = new Date().toISOString();
    const record = {
      shipmentId,
      resolved: true,
      resolvedAt: now,
      resolution,
      handler,
      remark,
    };

    set((state) => ({
      warningRecords: [
        ...state.warningRecords.filter((w) => w.shipmentId !== shipmentId),
        record,
      ],
    }));

    return true;
  },

  getStats: () => {
    const {
      fields,
      harvests,
      orders,
      shipments,
      customers,
      monthlyReports,
      warningRecords,
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
      (s) => s.status === 'in_transit' || s.status === 'departed',
    ).length;

    const unresolvedWarningIds = warningRecords
      .filter((w) => !w.resolved)
      .map((w) => w.shipmentId);
    const coldChainWarnings = shipments.filter((s) =>
      !unresolvedWarningIds.includes(s.id) &&
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
