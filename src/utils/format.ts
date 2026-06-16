import type {
  FieldStatus,
  BatchStatus,
  OrderStatus,
  ShipmentStatus,
  InventoryStatus,
  CustomerType,
  CustomerLevel,
  FlowerVariety,
  FlowerGrade,
} from '../types';

export const formatDate = (
  date: string | Date | number | null | undefined,
  fmt: string = 'YYYY-MM-DD'
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  return fmt
    .replace(/YYYY/g, String(year))
    .replace(/MM/g, String(month).padStart(2, '0'))
    .replace(/DD/g, String(day).padStart(2, '0'))
    .replace(/HH/g, String(hours).padStart(2, '0'))
    .replace(/mm/g, String(minutes).padStart(2, '0'))
    .replace(/ss/g, String(seconds).padStart(2, '0'));
};

export const formatMoney = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '¥0.00';
  const n = Number(num);
  if (isNaN(n)) return '¥0.00';
  return '¥' + formatNum(n.toFixed(2));
};

export const formatNum = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  const parts = String(n).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export const getDaysBetween = (
  d1: string | Date | number | null | undefined,
  d2: string | Date | number | null | undefined
): number => {
  if (!d1 || !d2) return 0;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (
  date: string | Date | number | null | undefined,
  n: number
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + n);
  return formatDate(d, 'YYYY-MM-DD');
};

const fieldStatusMap: Record<FieldStatus, string> = {
  idle: '空闲',
  growing: '生长中',
  harvesting: '采收中',
  fallow: '休耕',
};

const batchStatusMap: Record<BatchStatus, string> = {
  planned: '计划中',
  planted: '已定植',
  growing: '生长中',
  ready: '待采收',
  harvesting: '采收中',
  harvested: '已采收',
  completed: '已完成',
};

const orderStatusMap: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  picking: '备货中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  returned: '已退货',
};

const shipmentStatusMap: Record<ShipmentStatus, string> = {
  pending: '待发运',
  departed: '已发车',
  in_transit: '运输中',
  arrived: '已到达',
  completed: '已签收',
};

const inventoryStatusMap: Record<InventoryStatus, string> = {
  precooling: '预冷中',
  stored: '在库',
  allocated: '已分配',
  shipped: '已出库',
  sold: '已售出',
  expired: '已过期',
};

const customerTypeMap: Record<CustomerType, string> = {
  funeral_home: '殡仪馆',
  flower_shop: '花店',
  distributor: '经销商',
  retail: '零售',
};

const customerLevelMap: Record<CustomerLevel, string> = {
  A: 'A级',
  B: 'B级',
  C: 'C级',
  D: 'D级',
};

const varietyMap: Record<FlowerVariety, string> = {
  chrysanthemum: '菊花',
  lily: '百合',
  rose: '玫瑰',
  carnation: '康乃馨',
  gladiolus: '唐菖蒲',
};

const gradeMap: Record<FlowerGrade, string> = {
  A: 'A级',
  B: 'B级',
  C: 'C级',
};

export const getStatusText = (
  status: string,
  type?: 'field' | 'batch' | 'order' | 'shipment' | 'inventory' | 'customerType' | 'customerLevel' | 'variety' | 'grade'
): string => {
  if (!status) return '';
  switch (type) {
    case 'field':
      return fieldStatusMap[status as FieldStatus] || status;
    case 'batch':
      return batchStatusMap[status as BatchStatus] || status;
    case 'order':
      return orderStatusMap[status as OrderStatus] || status;
    case 'shipment':
      return shipmentStatusMap[status as ShipmentStatus] || status;
    case 'inventory':
      return inventoryStatusMap[status as InventoryStatus] || status;
    case 'customerType':
      return customerTypeMap[status as CustomerType] || status;
    case 'customerLevel':
      return customerLevelMap[status as CustomerLevel] || status;
    case 'variety':
      return varietyMap[status as FlowerVariety] || status;
    case 'grade':
      return gradeMap[status as FlowerGrade] || status;
    default:
      return (
        fieldStatusMap[status as FieldStatus] ||
        batchStatusMap[status as BatchStatus] ||
        orderStatusMap[status as OrderStatus] ||
        shipmentStatusMap[status as ShipmentStatus] ||
        inventoryStatusMap[status as InventoryStatus] ||
        customerTypeMap[status as CustomerType] ||
        customerLevelMap[status as CustomerLevel] ||
        varietyMap[status as FlowerVariety] ||
        gradeMap[status as FlowerGrade] ||
        status
      );
  }
};

export const getStatusColor = (
  status: string,
  type?: 'field' | 'batch' | 'order' | 'shipment' | 'inventory'
): string => {
  const colors: Record<string, Record<string, string>> = {
    field: {
      idle: 'bg-gray-100 text-gray-800',
      growing: 'bg-green-100 text-green-800',
      harvesting: 'bg-orange-100 text-orange-800',
      fallow: 'bg-yellow-100 text-yellow-800',
    },
    batch: {
      planned: 'bg-gray-100 text-gray-800',
      planted: 'bg-blue-100 text-blue-800',
      growing: 'bg-green-100 text-green-800',
      ready: 'bg-orange-100 text-orange-800',
      harvested: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-purple-100 text-purple-800',
    },
    order: {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      picking: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-purple-100 text-purple-800',
    },
    shipment: {
      pending: 'bg-gray-100 text-gray-800',
      departed: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-orange-100 text-orange-800',
      arrived: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
    },
    inventory: {
      precooling: 'bg-blue-100 text-blue-800',
      stored: 'bg-green-100 text-green-800',
      allocated: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-orange-100 text-orange-800',
      sold: 'bg-purple-100 text-purple-800',
      expired: 'bg-red-100 text-red-800',
    },
  };

  if (type && colors[type]) {
    return colors[type][status] || 'bg-gray-100 text-gray-800';
  }

  for (const t of Object.keys(colors)) {
    if (colors[t][status]) return colors[t][status];
  }
  return 'bg-gray-100 text-gray-800';
};

export const formatPercent = (
  n: number | string | null | undefined,
  decimals: number = 1
): string => {
  if (n === null || n === undefined || n === '') return '0%';
  const num = Number(n);
  if (isNaN(num)) return '0%';
  return num.toFixed(decimals) + '%';
};
