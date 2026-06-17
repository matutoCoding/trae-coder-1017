import type {
  Field,
  PlantingBatch,
  Harvest,
  Inventory,
  InventoryFlowRecord,
  Customer,
  Order,
  Shipment,
  Return,
  PriceRecord,
  TempLog,
  PaymentReminder,
  AfterSale,
  ReceivableBill,
  ProcurementSuggestion,
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
  inventoryFlow: InventoryFlowRecord[];
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
  afterSales: AfterSale[];
  receivableBills: ReceivableBill[];

  updateFieldStatus: (id: string, status: Field['status']) => void;
  addHarvest: (harvest: Harvest) => void;
  addInventoryItems: (items: Inventory[]) => void;
  updateInventoryStatus: (id: string, status: Inventory['status'], orderId?: string) => Inventory | null;
  getAvailableStock: (variety: string, grade: string) => number;
  allocateStock: (orderId: string, items: Order['items']) => { success: boolean; message: string; allocatedIds?: string[] };
  releaseStock: (orderId: string) => boolean;
  getInventoryStats: () => Array<{
    variety: string;
    grade: string;
    available: number;
    precooling: number;
    allocated: number;
    lowStock: boolean;
  }>;
  getInventoryFlowRecords: (variety?: string, grade?: string, orderId?: string, harvestId?: string) => InventoryFlowRecord[];
  addInventoryFlowRecord: (record: Omit<InventoryFlowRecord, 'id' | 'operatedAt'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => { order: Order | null; allocError?: string };
  addOrder: (order: Order) => { success: boolean; message: string; order?: Order };
  addReturn: (returnItem: Return) => void;
  addShipment: (shipment: Shipment) => void;
  createShipmentFromOrder: (orderId: string) => Shipment;
  getShipmentForOrder: (orderId: string) => Shipment | undefined;
  dispatchShipment: (shipmentId: string) => Shipment | null;
  batchDispatchShipments: (shipmentIds: string[], vehicleNo: string, driver: string) => Shipment[];
  completeShipment: (
    shipmentId: string,
    signedBy: string,
    signRemark?: string,
  ) => { success: boolean; hasAnomaly: boolean; shipment?: Shipment };
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
  createAfterSale: (afterSale: Omit<AfterSale, 'id' | 'createdAt'>) => AfterSale;
  processAfterSale: (id: string, result: string, returnToInventory: boolean) => AfterSale | null;
  getAfterSalesForOrder: (orderId: string) => AfterSale[];
  getAfterSalesForCustomer: (customerId: string) => AfterSale[];
  generateBillFromOrder: (order: Order) => ReceivableBill;
  getBillsForCustomer: (customerId: string) => ReceivableBill[];
  getProcurementSuggestions: () => ProcurementSuggestion[];
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
  inventoryFlow: [],
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
  afterSales: [],
  receivableBills: [],

  addInventoryFlowRecord: (record: Omit<InventoryFlowRecord, 'id' | 'operatedAt'>) => {
    const flowRecord: InventoryFlowRecord = {
      ...record,
      id: `IF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operatedAt: new Date().toISOString(),
    };
    set((state) => ({
      inventoryFlow: [flowRecord, ...state.inventoryFlow],
    }));
  },

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

  updateOrderStatus: (id, status) => {
    const { orders, customers, allocateStock, releaseStock, inventory } = get();
    const order = orders.find((o) => o.id === id);
    if (!order) return { order: null };

    const oldStatus = order.status;
    let allocatedIds: string[] | undefined;
    let allocError: string | undefined;

    if (status === 'picking' && oldStatus !== 'picking') {
      const result = allocateStock(id, order.items);
      if (!result.success) {
        return { order: { ...order } as Order, allocError: result.message };
      }
      allocatedIds = result.allocatedIds;
    }

    if ((status === 'cancelled' || status === 'returned') && (oldStatus === 'picking' || oldStatus === 'confirmed' || oldStatus === 'pending')) {
      releaseStock(id);
      const customer = customers.find((c) => c.id === order.customerId);
      if (customer) {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === order.customerId
              ? { ...c, usedCredit: Math.max(0, c.usedCredit - order.totalAmount) }
              : c
          ),
        }));
      }
      set((state) => ({
        receivableBills: state.receivableBills.filter((b) => b.orderId !== id),
      }));
    }

    const updated: Order = { ...order, status, allocatedInventoryIds: allocatedIds || order.allocatedInventoryIds };

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? updated : o,
      ),
    }));

    return { order: updated };
  },

  addOrder: (order) => {
    const { customers, receivableBills } = get();
    const customer = customers.find((c) => c.id === order.customerId);

    if (customer) {
      const remainingCredit = customer.creditLimit - customer.usedCredit;
      if (order.totalAmount > remainingCredit) {
        return {
          success: false,
          message: `客户额度不足！剩余额度 ${remainingCredit.toLocaleString()} 元，订单金额 ${order.totalAmount.toLocaleString()} 元，超出 ${(order.totalAmount - remainingCredit).toLocaleString()} 元`,
        };
      }

      const paymentTerms = customer.paymentTerms || 30;
      const billNo = `ZD${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(receivableBills.length + 1).padStart(3, '0')}`;
      const dueDate = new Date(new Date(order.createdAt).getTime() + paymentTerms * 86400000).toISOString().slice(0, 10);
      const bill: ReceivableBill = {
        id: `B${Date.now()}`,
        billNo,
        customerId: order.customerId,
        orderId: order.id,
        amount: order.totalAmount,
        paidAmount: 0,
        dueDate,
        createdAt: order.createdAt,
        status: 'unpaid',
      };

      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === order.customerId
            ? { ...c, usedCredit: c.usedCredit + order.totalAmount }
            : c
        ),
        orders: [...state.orders, order],
        receivableBills: [...state.receivableBills, bill],
      }));
    } else {
      set((state) => ({
        orders: [...state.orders, order],
      }));
    }

    return { success: true, message: '订单创建成功', order };
  },

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

  completeShipment: (shipmentId, signedBy, signRemark) => {
    const { shipments, orders, afterSales } = get();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return { success: false, hasAnomaly: false };

    const hasTempAnomaly = shipment.tempLogs.some(
      (log) => log.temperature > 4 || log.temperature < 0
    );

    const now = new Date().toISOString();
    const updatedShipment: Shipment = {
      ...shipment,
      status: 'completed',
      arrivedAt: shipment.arrivedAt || now,
      signedAt: now,
      signedBy,
      hasTempAnomaly,
      signRemark,
    };

    const orderUpdates: Partial<Order> = {
      signedAt: now,
      signedBy,
      hasTempAnomaly,
    };

    let newAfterSale: AfterSale | undefined;
    if (hasTempAnomaly) {
      const order = orders.find((o) => o.id === shipment.orderId);
      if (order) {
        newAfterSale = {
          id: `AS-${Date.now()}`,
          orderId: shipment.orderId,
          customerId: order.customerId,
          type: 'return',
          reason: '冷链运输温湿度异常',
          amount: order.totalAmount,
          quantity: order.items.reduce((s, i) => s + i.quantity, 0),
          status: 'pending',
          hasTempAnomaly: true,
          returnToInventory: false,
          createdAt: now,
        };
      }
    }

    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === shipmentId ? updatedShipment : s,
      ),
      orders: state.orders.map((o) =>
        o.id === shipment.orderId
          ? { ...o, ...orderUpdates }
          : o
      ),
      afterSales: newAfterSale ? [...state.afterSales, newAfterSale] : state.afterSales,
    }));

    return { success: true, hasAnomaly: hasTempAnomaly, shipment: updatedShipment };
  },

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

  updateInventoryStatus: (id, status, orderId) => {
    const { inventory, addInventoryFlowRecord } = get();
    const inv = inventory.find((i) => i.id === id);
    if (!inv) return null;

    const fromStatus = inv.status;
    const updated: Inventory = {
      ...inv,
      status,
      orderId: orderId || inv.orderId,
      updatedAt: new Date().toISOString(),
    };

    addInventoryFlowRecord({
      inventoryId: id,
      harvestId: inv.harvestId,
      variety: inv.variety,
      grade: inv.grade,
      quantity: inv.quantity,
      fromStatus,
      toStatus: status,
      orderId: orderId || inv.orderId,
    });

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
        i.status === 'stored'
      )
      .reduce((sum, i) => sum + i.quantity, 0);
  },

  allocateStock: (orderId, items) => {
    const { inventory, updateInventoryStatus } = get();
    const allocatedIds: string[] = [];

    for (const item of items) {
      const available = inventory.filter((i) =>
        i.variety === item.variety &&
        i.grade === item.grade &&
        i.status === 'stored'
      ).sort((a, b) => new Date(a.preCooledAt).getTime() - new Date(b.preCooledAt).getTime());

      let remaining = item.quantity;
      for (const inv of available) {
        if (remaining <= 0) break;
        if (inv.quantity <= remaining) {
          updateInventoryStatus(inv.id, 'allocated', orderId);
          allocatedIds.push(inv.id);
          remaining -= inv.quantity;
        } else {
          const splitId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const splitInv: Inventory = {
            ...inv,
            id: splitId,
            quantity: remaining,
            updatedAt: new Date().toISOString(),
          };
          const remainingInv: Inventory = {
            ...inv,
            quantity: inv.quantity - remaining,
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            inventory: state.inventory.map((i) =>
              i.id === inv.id ? remainingInv : i
            ).concat(splitInv),
          }));
          updateInventoryStatus(splitId, 'allocated', orderId);
          allocatedIds.push(splitId);
          remaining = 0;
        }
      }

      if (remaining > 0) {
        for (const allocId of allocatedIds) {
          const currentInv = get().inventory.find((i) => i.id === allocId);
          if (currentInv && currentInv.status === 'allocated') {
            updateInventoryStatus(allocId, 'stored', undefined);
          }
        }
        return { success: false, message: `${item.variety} ${item.grade}级 库存不足，缺${remaining}枝` };
      }
    }

    return { success: true, message: '库存分配成功', allocatedIds };
  },

  releaseStock: (orderId) => {
    const { inventory, updateInventoryStatus } = get();
    const allocated = inventory.filter((i) => i.orderId === orderId && i.status === 'allocated');

    if (allocated.length === 0) return false;

    allocated.forEach((inv) => {
      updateInventoryStatus(inv.id, 'stored', undefined);
    });

    return true;
  },

  getInventoryStats: () => {
    const { inventory } = get();
    const stats: Record<string, { variety: string; grade: string; available: number; precooling: number; allocated: number }> = {};

    inventory.forEach((inv) => {
      const key = `${inv.variety}-${inv.grade}`;
      if (!stats[key]) {
        stats[key] = { variety: inv.variety, grade: inv.grade, available: 0, precooling: 0, allocated: 0 };
      }
      if (inv.status === 'stored') stats[key].available += inv.quantity;
      else if (inv.status === 'precooling') stats[key].precooling += inv.quantity;
      else if (inv.status === 'allocated') stats[key].allocated += inv.quantity;
    });

    const LOW_STOCK_THRESHOLD = 500;
    return Object.values(stats).map((s) => ({
      ...s,
      lowStock: s.available < LOW_STOCK_THRESHOLD,
    }));
  },

  getInventoryFlowRecords: (variety, grade, orderId, harvestId) => {
    const { inventoryFlow } = get();
    return inventoryFlow.filter((r) => {
      const matchVariety = !variety || r.variety === variety;
      const matchGrade = !grade || r.grade === grade;
      const matchOrder = !orderId || r.orderId === orderId;
      const matchHarvest = !harvestId || r.harvestId === harvestId;
      return matchVariety && matchGrade && matchOrder && matchHarvest;
    });
  },

  createAfterSale: (afterSaleData) => {
    const afterSale: AfterSale = {
      ...afterSaleData,
      id: `AS-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      afterSales: [...state.afterSales, afterSale],
    }));
    return afterSale;
  },

  processAfterSale: (id, result, returnToInventory) => {
    const { afterSales, releaseStock, inventory, updateInventoryStatus, customers, orders, receivableBills } = get();
    const afterSale = afterSales.find((a) => a.id === id);
    if (!afterSale) return null;

    const now = new Date().toISOString();
    const updated: AfterSale = {
      ...afterSale,
      status: 'completed',
      processedAt: now,
      result,
      returnToInventory,
    };

    if (returnToInventory) {
      const order = orders.find((o) => o.id === afterSale.orderId);
      if (order) {
        const allocated = inventory.filter((i) => i.orderId === afterSale.orderId && i.status === 'allocated');
        allocated.forEach((inv) => {
          updateInventoryStatus(inv.id, 'stored', undefined);
        });
      }
    }

    const order = orders.find((o) => o.id === afterSale.orderId);
    if (order) {
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === afterSale.customerId
            ? { ...c, usedCredit: Math.max(0, c.usedCredit - afterSale.amount) }
            : c
        ),
        receivableBills: state.receivableBills.map((b) =>
          b.orderId === afterSale.orderId
            ? { ...b, status: 'paid' as const, paidAmount: b.amount - afterSale.amount }
            : b
        ),
      }));
    }

    set((state) => ({
      afterSales: state.afterSales.map((a) =>
        a.id === id ? updated : a
      ),
    }));

    return updated;
  },

  getAfterSalesForOrder: (orderId) => {
    return get().afterSales.filter((a) => a.orderId === orderId);
  },

  getAfterSalesForCustomer: (customerId) => {
    return get().afterSales.filter((a) => a.customerId === customerId);
  },

  generateBillFromOrder: (order) => {
    const { receivableBills, customers } = get();
    const customer = customers.find((c) => c.id === order.customerId);
    const paymentTerms = customer?.paymentTerms || 30;
    const billNo = `ZD${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(receivableBills.length + 1).padStart(3, '0')}`;
    const dueDate = new Date(new Date(order.createdAt).getTime() + paymentTerms * 86400000).toISOString().slice(0, 10);
    const bill: ReceivableBill = {
      id: `B${Date.now()}`,
      billNo,
      customerId: order.customerId,
      orderId: order.id,
      amount: order.totalAmount,
      paidAmount: 0,
      dueDate,
      createdAt: order.createdAt,
      status: 'unpaid',
    };
    set((state) => ({
      receivableBills: [...state.receivableBills, bill],
    }));
    return bill;
  },

  getBillsForCustomer: (customerId) => {
    const { receivableBills, orders } = get();
    const now = new Date().toISOString().slice(0, 10);
    return receivableBills
      .filter((b) => b.customerId === customerId)
      .map((b) => {
        const isOverdue = b.status === 'unpaid' && b.dueDate < now;
        return isOverdue ? { ...b, status: 'overdue' as const } : b;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getProcurementSuggestions: () => {
    const { inventory, orders } = get();
    const stats: Record<string, { variety: string; grade: string; available: number; precooling: number; upcomingDemand: number }> = {};

    inventory.forEach((inv) => {
      const key = `${inv.variety}-${inv.grade}`;
      if (!stats[key]) {
        stats[key] = { variety: inv.variety, grade: inv.grade, available: 0, precooling: 0, upcomingDemand: 0 };
      }
      if (inv.status === 'stored') stats[key].available += inv.quantity;
      else if (inv.status === 'precooling') stats[key].precooling += inv.quantity;
    });

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    orders.forEach((o) => {
      if (o.status === 'pending' || o.status === 'confirmed' || o.status === 'picking') {
        if (o.deliveryDate <= next7Days) {
          o.items.forEach((item) => {
            const key = `${item.variety}-${item.grade}`;
            if (!stats[key]) {
              stats[key] = { variety: item.variety, grade: item.grade, available: 0, precooling: 0, upcomingDemand: 0 };
            }
            stats[key].upcomingDemand += item.quantity;
          });
        }
      }
    });

    return Object.values(stats)
      .map((s) => {
        const gap = s.upcomingDemand - s.available - s.precooling;
        const suggestedQuantity = Math.max(0, Math.ceil(gap * 1.2));
        let urgency: 'high' | 'medium' | 'low' = 'low';
        let reason = '';
        if (gap > 0 && s.available < 200) {
          urgency = 'high';
          reason = `可售仅${s.available}枝，未来7天需${s.upcomingDemand}枝，预冷转入${s.precooling}枝，缺口${gap}枝`;
        } else if (gap > 0 && s.available < 500) {
          urgency = 'medium';
          reason = `可售${s.available}枝，未来需求${s.upcomingDemand}枝，预冷预计转入${s.precooling}枝，存在${gap}枝缺口`;
        } else if (s.available < 500) {
          urgency = 'low';
          reason = `当前可售${s.available}枝偏低，预冷中${s.precooling}枝即将转入`;
        }
        return {
          variety: s.variety,
          grade: s.grade as any,
          currentAvailable: s.available,
          precoolingIncoming: s.precooling,
          upcomingDemand: s.upcomingDemand,
          suggestedQuantity,
          urgency,
          reason,
        };
      })
      .filter((s) => s.urgency !== 'low' || s.currentAvailable < 500);
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
