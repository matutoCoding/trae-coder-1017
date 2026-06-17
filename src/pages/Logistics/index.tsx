import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  Thermometer,
  Droplets,
  AlertTriangle,
  MapPin,
  Navigation,
  Package,
  CheckCircle2,
  Clock,
  Phone,
  Eye,
  X,
  Flower2,
  Warehouse,
  ChevronRight,
  CircleDot,
  Check,
  ClipboardList,
  MessageSquare,
  Settings,
  Send,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/format';
import type { Shipment, Order, TempLog, ShipmentStatus } from '@/types';

const statusConfig: Record<
  ShipmentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: '待派单',
    badgeClass: 'bg-gray-100 text-gray-700',
    dotClass: 'bg-gray-400',
  },
  in_transit: {
    label: '在途',
    badgeClass: 'bg-sky-100 text-sky-700',
    dotClass: 'bg-sky-500',
  },
  departed: {
    label: '已发运',
    badgeClass: 'bg-blue-100 text-blue-700',
    dotClass: 'bg-blue-500',
  },
  arrived: {
    label: '已达',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-green-100 text-green-800',
    dotClass: 'bg-green-600',
  },
};

const getTempColor = (temp: number) => {
  if (temp > 4) return 'text-red-600';
  if (temp < 0) return 'text-blue-600';
  return 'text-emerald-600';
};

const getTempBgColor = (temp: number) => {
  if (temp > 4) return 'bg-red-50 border-red-200';
  if (temp < 0) return 'bg-blue-50 border-blue-200';
  return 'bg-emerald-50 border-emerald-200';
};

const getTempDotColor = (temp: number) => {
  if (temp > 4) return '#dc2626';
  if (temp < 0) return '#2563eb';
  return '#059669';
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDateTimeShort = (dateStr: string) => {
  const d = new Date(dateStr.replace(' ', 'T'));
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const calcDuration = (start?: string, end?: string) => {
  if (!start || !end) return '-';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h${mins}m`;
};

export default function LogisticsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    shipments,
    orders,
    customers,
    updateShipmentStatus,
    dispatchShipment,
    resolveWarning,
    warningRecords,
    getShipmentForOrder,
    batchDispatchShipments,
    completeShipment,
    getAfterSalesForOrder,
    createAfterSale,
  } = useAppStore();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    shipments.find((s) => s.status === 'in_transit' || s.status === 'departed') || shipments[0] || null,
  );
  const [drawerOpen, setDrawerOpen] = useState(!!shipments[0]);
  const [chartShipmentId, setChartShipmentId] = useState<string>(
    (shipments.find((s) => s.tempLogs.length > 0) || shipments[0])?.id || '',
  );
  const [warningShipment, setWarningShipment] = useState<Shipment | null>(null);
  const [showWarningPanel, setShowWarningPanel] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [contactShipment, setContactShipment] = useState<Shipment | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [resolution, setResolution] = useState('通知司机');
  const [handler, setHandler] = useState('调度员');
  const [remark, setRemark] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [schedDriverFilter, setSchedDriverFilter] = useState('all');
  const [schedVehicleFilter, setSchedVehicleFilter] = useState('all');
  const [schedRouteFilter, setSchedRouteFilter] = useState('all');
  const [schedStatusFilter, setSchedStatusFilter] = useState('all');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [batchVehicle, setBatchVehicle] = useState('');
  const [batchDriver, setBatchDriver] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signShipment, setSignShipment] = useState<Shipment | null>(null);
  const [signBy, setSignBy] = useState('');
  const [signRemark, setSignRemark] = useState('');

  useEffect(() => {
    const state = location.state as { orderId?: string } | null;
    if (state?.orderId) {
      const shipment = getShipmentForOrder(state.orderId);
      if (shipment) {
        setSelectedShipment(shipment);
        setChartShipmentId(shipment.id);
        setDrawerOpen(true);
        showToast(`已定位到配送单 ${shipment.vehicleNo}`);
      }
    }
  }, [location.state, getShipmentForOrder]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      setErrorToast(msg);
    } else {
      setSuccessToast(msg);
    }
  };

  const openSignModal = (shipment: Shipment) => {
    setSignShipment(shipment);
    setSignBy('');
    setSignRemark('');
    setShowSignModal(true);
  };

  const handleSign = () => {
    if (!signShipment || !signBy.trim()) {
      showToast('请输入签收人姓名', 'error');
      return;
    }

    const result = completeShipment(signShipment.id, signBy.trim(), signRemark.trim());
    if (result.success && result.shipment) {
      setShowSignModal(false);
      setSelectedShipment(result.shipment);
      if (result.hasAnomaly) {
        showToast('签收完成！已自动生成售后单，请前往订单页处理', 'error');
      } else {
        showToast(`配送单 ${signShipment.vehicleNo} 已签收完成`);
      }
    } else {
      showToast('签收失败', 'error');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayShipments = shipments.filter(
      (s) => s.departedAt && s.departedAt.slice(0, 10) === today,
    ).length;

    const inTransitCount = shipments.filter(
      (s) => s.status === 'in_transit' || s.status === 'departed',
    ).length;

    const normalCount = shipments.filter(
      (s) =>
        s.tempLogs.length > 0 &&
        !s.tempLogs.some((l) => l.temperature > 4 || l.temperature < 0),
    ).length;
    const totalWithLogs = shipments.filter((s) => s.tempLogs.length > 0).length;
    const normalRate =
      totalWithLogs > 0 ? Math.round((normalCount / totalWithLogs) * 100) : 100;

    const completedShipments = shipments.filter((s) => s.arrivedAt && s.departedAt);
    let avgDuration = 0;
    if (completedShipments.length > 0) {
      const totalMs = completedShipments.reduce(
        (sum, s) =>
          sum + (new Date(s.arrivedAt!).getTime() - new Date(s.departedAt!).getTime()),
        0,
      );
      avgDuration = Math.round(totalMs / completedShipments.length / 60000);
    }
    const avgHours = Math.floor(avgDuration / 60);
    const avgMins = avgDuration % 60;

    return {
      todayShipments,
      inTransitCount,
      normalRate,
      avgDurationStr: `${avgHours}h${avgMins}m`,
    };
  }, [shipments, today]);

  const unresolvedWarningIds = warningRecords
    .filter((w) => !w.resolved)
    .map((w) => w.shipmentId);
  const resolvedWarningIds = warningRecords
    .filter((w) => w.resolved)
    .map((w) => w.shipmentId);

  const warningShipments = useMemo(() => {
    return shipments
      .filter(
        (s) =>
          s.tempLogs.some((l) => l.temperature > 4 || l.temperature < 0) &&
          !resolvedWarningIds.includes(s.id),
      )
      .map((s) => {
        const latestLog = s.tempLogs[s.tempLogs.length - 1];
        const order = orders.find((o) => o.id === s.orderId);
        const isResolved = resolvedWarningIds.includes(s.id);
        return {
          shipment: s,
          latestTemp: latestLog?.temperature ?? 0,
          orderNo: order?.orderNo || '-',
          customer: customers.find((c) => c.id === order?.customerId)?.name || '-',
          isResolved,
        };
      });
  }, [shipments, orders, customers, resolvedWarningIds]);

  const getOrder = (orderId: string) => orders.find((o) => o.id === orderId);
  const getCustomer = (customerId: string) => customers.find((c) => c.id === customerId);

  const getCurrentTemp = (s: Shipment) =>
    s.tempLogs.length > 0 ? s.tempLogs[s.tempLogs.length - 1].temperature : 2.5;
  const getCurrentHumidity = (s: Shipment) =>
    s.tempLogs.length > 0 ? s.tempLogs[s.tempLogs.length - 1].humidity : 80;

  const handleDispatch = (s: Shipment) => {
    const updated = dispatchShipment(s.id);
    if (updated) {
      setSelectedShipment(updated);
      setChartShipmentId(updated.id);
      showToast(`配送单 ${updated.vehicleNo} 已发车，发车时间 ${new Date(updated.departedAt!).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    }
  };

  const handleViewDetail = (s: Shipment) => {
    setSelectedShipment(s);
    setDrawerOpen(true);
  };

  const handleWarningResolve = (s: Shipment) => {
    setWarningShipment(s);
    setShowWarningPanel(true);
    setResolution('通知司机');
    setHandler('调度员');
    setRemark('');
  };

  const handleConfirmResolve = () => {
    if (!warningShipment) return;
    const success = resolveWarning(warningShipment.id, resolution, handler, remark);
    if (success) {
      showToast(`配送单 ${warningShipment.vehicleNo} 温度异常已处理`);
      setShowWarningPanel(false);
      setWarningShipment(null);
    }
  };

  const handleContactDriver = (s: Shipment) => {
    setContactShipment(s);
    setShowContactPanel(true);
    setContactMessage('');
  };

  const handleSendMessage = () => {
    if (!contactShipment || !contactMessage.trim()) return;
    showToast(`已向 ${contactShipment.driver} 发送消息：${contactMessage.slice(0, 30)}${contactMessage.length > 30 ? '...' : ''}`);
    setShowContactPanel(false);
    setContactShipment(null);
    setContactMessage('');
  };

  const allDrivers = useMemo(() => {
    const drivers = new Set<string>();
    shipments.forEach((s) => s.driver && drivers.add(s.driver));
    return Array.from(drivers);
  }, [shipments]);

  const allVehicles = useMemo(() => {
    const vehicles = new Set<string>();
    shipments.forEach((s) => s.vehicleNo && vehicles.add(s.vehicleNo));
    return Array.from(vehicles);
  }, [shipments]);

  const allRoutes = useMemo(() => {
    const routes = new Set<string>();
    shipments.forEach((s) => s.route && routes.add(s.route));
    return Array.from(routes);
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchDriver = schedDriverFilter === 'all' || s.driver === schedDriverFilter;
      const matchVehicle = schedVehicleFilter === 'all' || s.vehicleNo === schedVehicleFilter;
      const matchRoute = schedRouteFilter === 'all' || s.route === schedRouteFilter;
      const matchStatus = schedStatusFilter === 'all' || s.status === schedStatusFilter;
      return matchDriver && matchVehicle && matchRoute && matchStatus;
    });
  }, [shipments, schedDriverFilter, schedVehicleFilter, schedRouteFilter, schedStatusFilter]);

  const pendingShipments = useMemo(() => {
    return filteredShipments.filter((s) => s.status === 'pending');
  }, [filteredShipments]);

  const handleBatchDispatch = () => {
    if (selectedPendingIds.length === 0) {
      showToast('请先选择待派单');
      return;
    }
    if (!batchVehicle || !batchDriver) {
      showToast('请选择车辆和司机');
      return;
    }
    const updated = batchDispatchShipments(selectedPendingIds, batchVehicle, batchDriver);
    if (updated.length > 0) {
      showToast(`已成功派单 ${updated.length} 单，车辆：${batchVehicle}，司机：${batchDriver}`);
      setSelectedPendingIds([]);
      setBatchVehicle('');
      setBatchDriver('');
      if (updated[0]) {
        setSelectedShipment(updated[0]);
        setChartShipmentId(updated[0].id);
      }
    }
  };

  const togglePendingSelect = (id: string) => {
    setSelectedPendingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    if (selectedPendingIds.length === pendingShipments.length) {
      setSelectedPendingIds([]);
    } else {
      setSelectedPendingIds(pendingShipments.map(s => s.id));
    }
  };

  const chartShipment = shipments.find((s) => s.id === chartShipmentId);
  const chartData = useMemo(() => {
    if (!chartShipment || chartShipment.tempLogs.length === 0) return [];
    return chartShipment.tempLogs.map((log) => ({
      time: formatDateTimeShort((log as any).timestamp || log.time),
      temperature: log.temperature,
      humidity: log.humidity,
      isOver: log.temperature > 4 || log.temperature < 0,
    }));
  }, [chartShipment]);

  const routeNodes = [
    { key: 'base', label: '花卉基地', icon: Flower2, type: 'start' },
    { key: 'transit1', label: '冷链中转1', icon: Warehouse, type: 'transit' },
    { key: 'transit2', label: '冷链中转2', icon: Warehouse, type: 'transit' },
    { key: 'customer', label: '客户地址', icon: MapPin, type: 'end' },
  ];

  const routeProgress = useMemo(() => {
    if (!selectedShipment) return { progress: 0, currentNode: 0 };
    if (selectedShipment.status === 'pending') return { progress: 5, currentNode: 0 };
    if (selectedShipment.status === 'completed') return { progress: 100, currentNode: 3 };
    if (selectedShipment.arrivedAt) return { progress: 90, currentNode: 3 };
    if (selectedShipment.departedAt) {
      const est = selectedShipment.estimatedArrival;
      if (est) {
        const total = new Date(est).getTime() - new Date(selectedShipment.departedAt).getTime();
        const elapsed = Date.now() - new Date(selectedShipment.departedAt).getTime();
        const pct = Math.min(Math.max(Math.round((elapsed / total) * 100), 10), 85);
        const node = pct < 30 ? 0 : pct < 60 ? 1 : pct < 85 ? 2 : 3;
        return { progress: pct, currentNode: node };
      }
    }
    return { progress: 50, currentNode: 1 };
  }, [selectedShipment]);

  const trackingTimeline = useMemo(() => {
    if (!selectedShipment) return [];
    const items: { key: string; label: string; time: string | null; done: boolean; current: boolean; icon: any }[] = [];
    const departedTime = selectedShipment.departedAt;
    const arrivedTime = selectedShipment.arrivedAt;
    const now = new Date();

    items.push({
      key: 'outbound',
      label: '已出库',
      time: departedTime ? formatTime(new Date(new Date(departedTime).getTime() - 1800000).toISOString()) : null,
      done: !!departedTime,
      current: false,
      icon: Package,
    });
    items.push({
      key: 'shipped',
      label: '已发运',
      time: departedTime ? formatTime(departedTime) : null,
      done: !!departedTime,
      current: !!departedTime && !arrivedTime,
      icon: Truck,
    });

    const coldChainNodes = ['冷链节点1（途中监测）', '冷链节点2（途中监测）', '冷链节点3（途中监测）'];
    coldChainNodes.forEach((label, idx) => {
      const offset = (idx + 1) * 5400000;
      const nodeTime = departedTime
        ? formatTime(new Date(new Date(departedTime).getTime() + offset).toISOString())
        : null;
      const isDone = departedTime && (!arrivedTime ? now.getTime() > new Date(departedTime).getTime() + offset : true);
      items.push({
        key: `cold_${idx}`,
        label,
        time: nodeTime,
        done: !!isDone,
        current: false,
        icon: Thermometer,
      });
    });

    items.push({
      key: 'arrived',
      label: '已到达',
      time: arrivedTime ? formatTime(arrivedTime) : null,
      done: !!arrivedTime,
      current: false,
      icon: MapPin,
    });
    items.push({
      key: 'signed',
      label: '已签收',
      time: arrivedTime ? formatTime(new Date(new Date(arrivedTime).getTime() + 1800000).toISOString()) : null,
      done: selectedShipment.status === 'completed',
      current: selectedShipment.status === 'arrived',
      icon: CheckCircle2,
    });

    return items;
  }, [selectedShipment]);

  const vehicleListColumns = [
    {
      key: 'shipmentNo',
      title: '配送单',
      render: (_: any, __: number, row: Shipment) => {
        const order = getOrder(row.orderId);
        return <span className="font-mono text-sm">{order?.orderNo || '-'}</span>;
      },
    },
  ];

  const trackingColumns = [
    {
      key: 'id',
      title: '配送单号',
      render: (row: any) => <span className="font-mono text-sm">{row.id}</span>,
    },
    {
      key: 'order',
      title: '关联订单',
      render: (row: any) => {
        const order = getOrder(row.orderId);
        return <span className="font-medium text-forest-900">{order?.orderNo || '-'}</span>;
      },
    },
    {
      key: 'vehicle',
      title: '车牌',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-mono">
          <Truck className="w-3 h-3" />
          {row.vehicleNo}
        </span>
      ),
    },
    {
      key: 'driver',
      title: '司机',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{row.driver}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      title: '客户',
      render: (row: any) => {
        const order = getOrder(row.orderId);
        const c = order ? getCustomer(order.customerId) : null;
        return <span className="text-sm">{c?.name || '-'}</span>;
      },
    },
    {
      key: 'departed',
      title: '发车时间',
      render: (row: any) => <span className="text-xs text-cream-500">{formatTime(row.departedAt)}</span>,
    },
    {
      key: 'estimated',
      title: '预计到达',
      render: (row: any) => <span className="text-xs text-cream-500">{formatTime(row.estimatedArrival)}</span>,
    },
    {
      key: 'arrived',
      title: '实际到达',
      render: (row: any) => <span className="text-xs text-cream-500">{formatTime(row.arrivedAt)}</span>,
    },
    {
      key: 'temperature',
      title: '当前温度',
      render: (row: any) => {
        const t = getCurrentTemp(row);
        return (
          <span className={cn('inline-flex items-center gap-1 font-semibold text-sm', getTempColor(t))}>
            <Thermometer className="w-3.5 h-3.5" />
            {t.toFixed(1)}℃
          </span>
        );
      },
    },
    {
      key: 'humidity',
      title: '当前湿度',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 text-sky-600 text-sm font-medium">
          <Droplets className="w-3.5 h-3.5" />
          {getCurrentHumidity(row).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: any) => {
        const cfg = statusConfig[row.status as ShipmentStatus];
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              cfg.badgeClass,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'action',
      title: '操作',
      render: (row: any) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <button
              onClick={() => handleDispatch(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors"
            >
              <Navigation className="w-3 h-3" />
              派单
            </button>
          )}
          <button
            onClick={() => handleViewDetail(row)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-forest-600 hover:bg-forest-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            详情
          </button>
        </div>
      ),
    },
  ];

  const renderWarningBar = () => {
    if (warningShipments.length === 0) return null;
    return (
      <div className="card-base p-4 bg-red-50/80 border border-red-200 animate-fadeInUp opacity-0" style={{ animationDelay: '200ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-red-800">
                冷链温度告警 · {warningShipments.length} 个异常
              </h4>
              <span className="text-xs text-red-600">需立即处理</span>
            </div>
            <div className="space-y-2">
              {warningShipments.map(({ shipment, latestTemp, orderNo, customer }) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between bg-white/70 rounded-lg p-2.5 border border-red-100"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs font-semibold text-red-700 flex-shrink-0">
                      {orderNo}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-mono flex-shrink-0">
                      <Truck className="w-3 h-3" />
                      {shipment.vehicleNo}
                    </span>
                    <span className="text-xs text-cream-600 truncate">{customer}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className={cn('text-sm font-bold flex items-center gap-1', getTempColor(latestTemp))}>
                      <Thermometer className="w-4 h-4" />
                      {latestTemp.toFixed(1)}℃
                    </span>
                    <button
                      onClick={() => handleWarningResolve(shipment)}
                      className="px-3 py-1 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      立即处理
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVehicleCard = (s: Shipment) => {
    const order = getOrder(s.orderId);
    const customer = order ? getCustomer(order.customerId) : null;
    const cfg = statusConfig[s.status as ShipmentStatus];
    const curTemp = getCurrentTemp(s);

    return (
      <div
        key={s.id}
        onClick={() => {
          setSelectedShipment(s);
        }}
        className={cn(
          'card-base p-3.5 cursor-pointer transition-all duration-200 animate-fadeInUp opacity-0',
          selectedShipment?.id === s.id
            ? 'ring-2 ring-forest-500 shadow-md -translate-y-0.5'
            : 'hover:-translate-y-0.5 hover:shadow-md',
        )}
        style={{ animationDelay: '250ms' }}
      >
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-forest-900">{s.vehicleNo}</p>
              <p className="text-xs text-cream-500">{s.driver}</p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
              cfg.badgeClass,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
            {cfg.label}
          </span>
        </div>

        <div className={cn('rounded-lg p-2.5 border mb-2.5 flex items-center justify-between', getTempBgColor(curTemp))}>
          <div className="flex items-center gap-2">
            <Thermometer className={cn('w-4 h-4', getTempColor(curTemp))} />
            <span className="text-xs text-cream-600">当前温度</span>
          </div>
          <span className={cn('text-base font-bold', getTempColor(curTemp))}>
            {curTemp.toFixed(1)}℃
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-cream-500 mb-3">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>预计到达 {formatTime(s.estimatedArrival)}</span>
        </div>

        <div className="flex gap-1.5">
          {s.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDispatch(s);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-forest-600 text-white text-xs font-medium hover:bg-forest-700 transition-colors"
            >
              <Navigation className="w-3 h-3" />
              派单
            </button>
          )}
          {(s.status === 'departed' || s.status === 'in_transit' || s.status === 'arrived') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openSignModal(s);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <Check className="w-3 h-3" />
              签收
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(s);
            }}
            className={cn(
              'flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
              s.status === 'pending'
                ? 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                : s.status === 'departed' || s.status === 'in_transit' || s.status === 'arrived'
                ? 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                : 'flex-1 bg-forest-50 text-forest-700 hover:bg-forest-100',
            )}
          >
            <Eye className="w-3 h-3" />
            详情
          </button>
        </div>
      </div>
    );
  };

  const renderDispatchArea = () => {
    const selOrder = selectedShipment ? getOrder(selectedShipment.orderId) : null;
    const selCustomer = selOrder ? getCustomer(selOrder.customerId) : null;
    const distance = selectedShipment
      ? selectedShipment.route?.includes('长途')
        ? '约 1,850 km'
        : selectedShipment.route?.includes('城际')
          ? '约 140 km'
          : '约 35 km'
      : '-';

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 card-base p-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-forest-600" />
              车辆列表
            </h3>
            <span className="text-xs text-cream-500">{shipments.length} 辆</span>
          </div>
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {shipments.map(renderVehicleCard)}
          </div>
        </div>

        <div className="xl:col-span-8 card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-forest-600" />
              模拟配送地图
            </h3>
            {selectedShipment && (
              <div className="flex items-center gap-2 text-xs text-cream-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  实时跟踪中
                </span>
                <span>进度 {routeProgress.progress}%</span>
              </div>
            )}
          </div>

          {selectedShipment ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-forest-50 to-sky-50 rounded-xl p-4 border border-forest-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-forest-800">
                        {selOrder?.orderNo || '-'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-sky-700 text-xs font-mono border border-sky-200">
                        <Truck className="w-3 h-3" />
                        {selectedShipment.vehicleNo}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-forest-900 truncate">
                      {selCustomer?.name || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-cream-500 mb-0.5">配送距离</p>
                      <p className="text-base font-bold text-chrysanthemum-600">{distance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-cream-500 mb-0.5">预计时长</p>
                      <p className="text-base font-bold text-forest-700">
                        {calcDuration(selectedShipment.departedAt, selectedShipment.estimatedArrival)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative bg-cream-50/50 rounded-xl p-6 border border-cream-200 min-h-[280px]">
                <div className="absolute inset-x-8 top-20 h-2 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-forest-500 to-sky-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${routeProgress.progress}%` }}
                  />
                </div>

                <div className="absolute top-[72px] h-6 w-6 -translate-x-1/2 transition-all duration-1000 ease-out z-20" style={{ left: `calc(${routeProgress.progress}% - 32px + 64px * ${routeProgress.progress / 100})` }}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping opacity-40" />
                    <div className="relative w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Truck className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start justify-between pt-2">
                  {routeNodes.map((node, idx) => {
                    const Icon = node.icon;
                    const isDone = idx <= routeProgress.currentNode;
                    const isCurrent = idx === routeProgress.currentNode;
                    return (
                      <div key={node.key} className="flex flex-col items-center flex-1 first:flex-initial last:flex-initial">
                        <div
                          className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-md transition-all duration-300 border-2',
                            isDone
                              ? node.type === 'start'
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-emerald-300'
                                : node.type === 'end'
                                  ? 'bg-gradient-to-br from-chrysanthemum-400 to-chrysanthemum-600 text-white border-chrysanthemum-300'
                                  : 'bg-gradient-to-br from-sky-400 to-sky-600 text-white border-sky-300'
                              : 'bg-white text-cream-300 border-cream-200',
                            isCurrent && 'ring-4 ring-forest-200 scale-110',
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <p
                          className={cn(
                            'text-xs font-semibold text-center',
                            isDone ? 'text-forest-800' : 'text-cream-400',
                          )}
                        >
                          {node.label}
                        </p>
                        <p className="text-[10px] text-cream-400 mt-0.5">
                          {isDone ? '已到达' : '待到达'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-dashed border-cream-200 flex items-center justify-between text-xs text-cream-500">
                  <div className="flex items-center gap-1.5">
                    <Flower2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>起点：花卉种植基地冷链中心</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-chrysanthemum-600" />
                    <span className="truncate max-w-[200px]">终点：{selCustomer?.address || selOrder?.deliveryAddress || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-cream-400">
              <div className="text-center">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">请选择左侧车辆查看配送路线</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChartArea = () => {
    const latestLog = chartShipment && chartShipment.tempLogs.length > 0
      ? chartShipment.tempLogs[chartShipment.tempLogs.length - 1]
      : null;
    const updateTime = latestLog ? (latestLog as any).timestamp || latestLog.time : '-';

    return (
      <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-forest-600" />
            温湿度实时监控
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream-500">选择配送单：</span>
            <select
              value={chartShipmentId}
              onChange={(e) => setChartShipmentId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            >
              {shipments
                .filter((s) => s.tempLogs.length > 0)
                .map((s) => {
                  const o = getOrder(s.orderId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.vehicleNo} · {o?.orderNo || s.id}
                    </option>
                  );
                })}
              {shipments.filter((s) => s.tempLogs.length > 0).length === 0 && (
                <option value="">暂无数据</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9">
            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[-5, 15]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}℃`}
                      label={{ value: '温度', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#059669' }, offset: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[30, 100]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: '湿度', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#0284c7' }, offset: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'temperature') return [`${value.toFixed(1)}℃`, '温度'];
                        if (name === 'humidity') return [`${value.toFixed(0)}%`, '湿度'];
                        return [value, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) =>
                        value === 'temperature' ? '温度' : value === 'humidity' ? '湿度' : value
                      }
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={4}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: '上限4℃', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={0}
                      stroke="#2563eb"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: '下限0℃', fill: '#2563eb', fontSize: 10, position: 'insideBottomRight' }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      name="temperature"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.isOver) {
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="white"
                              stroke={getTempDotColor(payload.temperature)}
                              strokeWidth={2.5}
                            />
                          );
                        }
                        return <circle cx={cx} cy={cy} r={2.5} fill="#059669" />;
                      }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      name="humidity"
                      stroke="#0284c7"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-cream-400">
                  <div className="text-center">
                    <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">暂无温湿度数据</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-700">当前温度</span>
              </div>
              {latestLog ? (
                <div className="flex items-baseline gap-1.5">
                  <span className={cn('text-3xl font-bold font-serif', getTempColor(latestLog.temperature))}>
                    {latestLog.temperature.toFixed(1)}
                  </span>
                  <span className={cn('text-sm font-semibold', getTempColor(latestLog.temperature))}>℃</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-cream-300">-</p>
              )}
              <p className="text-[10px] text-emerald-600 mt-1">正常范围：0℃ ~ 4℃</p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-sky-700">当前湿度</span>
              </div>
              {latestLog ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-serif text-sky-700">
                    {latestLog.humidity.toFixed(0)}
                  </span>
                  <span className="text-sm font-semibold text-sky-700">%</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-cream-300">-</p>
              )}
              <p className="text-[10px] text-sky-600 mt-1">正常范围：60% ~ 95%</p>
            </div>

            <div className="rounded-xl border border-cream-200 bg-gradient-to-br from-cream-50 to-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cream-400 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-cream-700">更新时间</span>
              </div>
              <p className="text-sm font-mono font-semibold text-forest-800">
                {updateTime !== '-' ? formatTime(updateTime.replace(' ', 'T')) : '-'}
              </p>
              <p className="text-[10px] text-cream-500 mt-1">
                {chartShipment ? `${chartShipment.tempLogs.length} 条记录` : '暂无记录'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDrawer = () => {
    if (!selectedShipment) return null;
    const order = getOrder(selectedShipment.orderId);
    const customer = order ? getCustomer(order.customerId) : null;
    const cfg = statusConfig[selectedShipment.status as ShipmentStatus];

    return (
      <>
        <div
          className={cn(
            'fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-cream-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-forest-900">
                    {selectedShipment.id}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                      cfg.badgeClass,
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', cfg.dotClass)} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-cream-500 mt-0.5">
                  {order?.orderNo} · {selectedShipment.vehicleNo} · {selectedShipment.driver}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5 text-cream-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5 border-b border-cream-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-cream-50/70 p-3">
                  <p className="text-xs text-cream-500 mb-1">发车时间</p>
                  <p className="text-sm font-semibold text-forest-900">
                    {formatTime(selectedShipment.departedAt)}
                  </p>
                </div>
                <div className="rounded-lg bg-cream-50/70 p-3">
                  <p className="text-xs text-cream-500 mb-1">预计到达</p>
                  <p className="text-sm font-semibold text-forest-900">
                    {formatTime(selectedShipment.estimatedArrival)}
                  </p>
                </div>
                <div className="rounded-lg bg-cream-50/70 p-3">
                  <p className="text-xs text-cream-500 mb-1">实际到达</p>
                  <p className="text-sm font-semibold text-forest-900">
                    {formatTime(selectedShipment.arrivedAt)}
                  </p>
                </div>
                <div className="rounded-lg bg-cream-50/70 p-3">
                  <p className="text-xs text-cream-500 mb-1">运输耗时</p>
                  <p className="text-sm font-semibold text-forest-900">
                    {selectedShipment.departedAt
                      ? calcDuration(
                          selectedShipment.departedAt,
                          selectedShipment.arrivedAt || new Date().toISOString(),
                        )
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-cream-200 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-cream-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cream-500">客户</p>
                    <p className="text-sm font-medium text-forest-900">{customer?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cream-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cream-500">配送地址</p>
                    <p className="text-sm text-forest-800 leading-relaxed">
                      {customer?.address || order?.deliveryAddress || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-b border-cream-200">
              <h3 className="text-sm font-semibold text-forest-700 mb-4 flex items-center gap-2">
                <CircleDot className="w-4 h-4" /> 配送节点跟踪
              </h3>
              <div className="relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-cream-200" />
                {trackingTimeline.map((item, idx) => {
                  const Icon = item.icon;
                  const isLast = idx === trackingTimeline.length - 1;
                  return (
                    <div
                      key={item.key}
                      className={cn('flex items-start gap-3 relative', !isLast && 'pb-5')}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all',
                          item.done
                            ? 'bg-forest-500 border-white shadow-sm text-white'
                            : 'bg-white border-cream-200 text-cream-300',
                          item.current && 'ring-4 ring-forest-200 bg-sky-500',
                        )}
                      >
                        {item.done && !item.current && item.key === 'signed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3 h-3" />
                        )}
                        {item.current && (
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                      <div className="pt-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              item.done ? 'text-forest-900' : 'text-cream-400',
                              item.current && 'text-sky-700',
                            )}
                          >
                            {item.label}
                          </p>
                          {item.time && (
                            <span
                              className={cn(
                                'text-xs font-mono flex-shrink-0',
                                item.done ? 'text-cream-500' : 'text-cream-300',
                              )}
                            >
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.current && (
                          <p className="text-xs text-sky-600 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            进行中...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-b border-cream-200">
              <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> 签收信息
              </h3>
              {selectedShipment.status === 'completed' ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-cream-500 w-20 flex-shrink-0">签收人</span>
                    <span className="font-medium text-forest-900">{selectedShipment.signedBy || customer?.contact || '已签收'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cream-500 w-20 flex-shrink-0">签收时间</span>
                    <span className="text-forest-800">{selectedShipment.signedAt ? formatTime(selectedShipment.signedAt) : formatTime(selectedShipment.arrivedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cream-500 w-20 flex-shrink-0">温湿度</span>
                    {selectedShipment.hasTempAnomaly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        存在异常
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                        <Check className="w-3 h-3" />
                        正常
                      </span>
                    )}
                  </div>
                  {selectedShipment.signRemark && (
                    <div className="flex items-start gap-2">
                      <span className="text-cream-500 w-20 flex-shrink-0 mt-0.5">签收备注</span>
                      <span className="text-forest-800">{selectedShipment.signRemark}</span>
                    </div>
                  )}
                  {selectedShipment.hasTempAnomaly && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-800 mb-1">温湿度异常</p>
                          <p className="text-[11px] text-red-600 mb-2">该订单冷链运输过程中存在温湿度超标情况，已自动生成售后单</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setDrawerOpen(false); navigate('/orders'); }}
                              className="px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium rounded hover:bg-red-700 transition-colors"
                            >
                              前往订单处理售后
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-cream-50/70 border border-dashed border-cream-200 py-8 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-cream-300" />
                  <p className="text-sm text-cream-500">暂未签收</p>
                  {(selectedShipment.status === 'departed' || selectedShipment.status === 'in_transit' || selectedShipment.status === 'arrived') && (
                    <button
                      onClick={() => openSignModal(selectedShipment)}
                      className="mt-3 px-4 py-1.5 bg-forest-600 text-white text-xs font-medium rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      立即签收
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-b border-cream-200">
              <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 异常登记
              </h3>
              {warningShipments.find((w) => w.shipment.id === selectedShipment.id) ? (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">温度异常告警</p>
                      <p className="text-xs text-red-600 mt-0.5">冷链温度超出安全阈值（0℃-4℃）</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-red-700 pt-2 border-t border-red-100">
                    <span>当前温度：
                      <span className="font-bold ml-1">
                        {getCurrentTemp(selectedShipment).toFixed(1)}℃
                      </span>
                    </span>
                    <span>登记时间：{formatTime(new Date().toISOString())}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50/50 border border-dashed border-emerald-200 py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm text-emerald-600">全程冷链正常，无异常记录</p>
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> 签收凭证
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-xl bg-gradient-to-br from-cream-100 to-cream-50 border border-dashed border-cream-300 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Package className="w-8 h-8 mx-auto mb-1.5 text-cream-300" />
                      <p className="text-xs text-cream-400">
                        {i === 1 ? '签收单图片' : '货物照片'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-cream-200 bg-cream-50/50 flex gap-2">
            {selectedShipment.status === 'departed' || selectedShipment.status === 'in_transit' ? (
              <button
                onClick={() => updateShipmentStatus(selectedShipment.id, 'arrived', new Date().toISOString())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <MapPin className="w-4 h-4" />
                确认到达
              </button>
            ) : null}
            {(selectedShipment.status === 'departed' || selectedShipment.status === 'in_transit' || selectedShipment.status === 'arrived') ? (
              <button
                onClick={() => openSignModal(selectedShipment)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 text-white font-medium text-sm hover:bg-forest-700 transition-all shadow-sm hover:shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                确认签收
              </button>
            ) : null}
            <button
              onClick={() => handleContactDriver(selectedShipment)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-cream-200 text-forest-700 font-medium text-sm hover:bg-cream-50 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" />
              联系司机
            </button>
          </div>
        </div>

        {drawerOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日配送单"
          value={stats.todayShipments}
          icon={Package}
          trend="↑ 8%"
          trendUp
          colorVariant="forest"
          delay={0}
        />
        <StatCard
          title="在途车辆"
          value={stats.inTransitCount}
          icon={Truck}
          trend="实时"
          trendUp
          colorVariant="blue"
          delay={50}
        />
        <StatCard
          title="冷链正常率"
          value={`${stats.normalRate}%`}
          icon={Thermometer}
          trend={stats.normalRate >= 95 ? '优秀' : '需关注'}
          trendUp={stats.normalRate >= 90}
          colorVariant={stats.normalRate >= 95 ? 'forest' : 'warning'}
          delay={100}
        />
        <StatCard
          title="平均配送时长"
          value={stats.avgDurationStr}
          icon={Clock}
          trend="准时率高"
          trendUp
          colorVariant="chrysanthemum"
          delay={150}
        />
      </div>

      <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-forest-600" />
            配送调度台
          </h3>
          <span className="text-xs text-cream-500">筛选后共 {filteredShipments.length} 条配送单，待派单 {pendingShipments.length} 条</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-forest-700 mb-1">司机</label>
            <select
              value={schedDriverFilter}
              onChange={(e) => setSchedDriverFilter(e.target.value)}
              className="input-base w-full text-sm"
            >
              <option value="all">全部司机</option>
              {allDrivers.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-700 mb-1">车辆</label>
            <select
              value={schedVehicleFilter}
              onChange={(e) => setSchedVehicleFilter(e.target.value)}
              className="input-base w-full text-sm"
            >
              <option value="all">全部车辆</option>
              {allVehicles.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-700 mb-1">线路</label>
            <select
              value={schedRouteFilter}
              onChange={(e) => setSchedRouteFilter(e.target.value)}
              className="input-base w-full text-sm"
            >
              <option value="all">全部线路</option>
              {allRoutes.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-700 mb-1">订单状态</label>
            <select
              value={schedStatusFilter}
              onChange={(e) => setSchedStatusFilter(e.target.value)}
              className="input-base w-full text-sm"
            >
              <option value="all">全部状态</option>
              <option value="pending">待派单</option>
              <option value="departed">已发车</option>
              <option value="in_transit">在途</option>
              <option value="arrived">已到达</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        {pendingShipments.length > 0 && (
          <div className="border-t border-cream-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllPending}
                  className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1"
                >
                  {selectedPendingIds.length === pendingShipments.length ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-cream-300 rounded" />
                  )}
                  全选待派单
                </button>
                <span className="text-xs text-cream-500">已选 {selectedPendingIds.length} 条</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={batchVehicle}
                  onChange={(e) => setBatchVehicle(e.target.value)}
                  className="input-base text-sm w-40"
                >
                  <option value="">选择车辆</option>
                  {allVehicles.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <select
                  value={batchDriver}
                  onChange={(e) => setBatchDriver(e.target.value)}
                  className="input-base text-sm w-32"
                >
                  <option value="">选择司机</option>
                  {allDrivers.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button
                  onClick={handleBatchDispatch}
                  disabled={selectedPendingIds.length === 0 || !batchVehicle || !batchDriver}
                  className={cn(
                    'px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-1.5',
                    selectedPendingIds.length > 0 && batchVehicle && batchDriver
                      ? 'bg-forest-600 hover:bg-forest-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  )}
                >
                  <Navigation className="w-4 h-4" />
                  批量派单
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pendingShipments.map((s) => {
                const order = getOrder(s.orderId);
                const customer = order ? getCustomer(order.customerId) : null;
                const isSelected = selectedPendingIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePendingSelect(s.id);
                    }}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'border-forest-500 bg-forest-50 shadow-sm'
                        : 'border-cream-200 bg-white hover:border-forest-300 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5',
                        isSelected ? 'bg-forest-500 border-forest-500' : 'border-cream-300'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-forest-800">{order?.orderNo || s.id}</span>
                          <span className="badge bg-gray-100 text-gray-600 text-xs">待派单</span>
                        </div>
                        <p className="text-xs text-forest-700 truncate mb-1">{customer?.name || '-'}</p>
                        <p className="text-[10px] text-cream-500 truncate">{order?.deliveryAddress || s.route || '-'}</p>
                        <p className="text-[10px] text-cream-400 mt-1">金额：{order ? formatMoney(order.totalAmount) : '-'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {renderWarningBar()}

      {renderDispatchArea()}

      {renderChartArea()}

      <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '450ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-forest-600" />
            在途跟踪列表
          </h3>
          <span className="text-xs text-cream-500">共 {shipments.length} 条记录</span>
        </div>
        <DataTable
          columns={trackingColumns as any}
          data={shipments as any}
          rowKey="id"
        />
      </div>

      {renderDrawer()}

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 hidden lg:block"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
          <div className="bg-forest-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
        </div>
      )}

      {showWarningPanel && warningShipment && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowWarningPanel(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-fadeInUp">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">温度异常处理</h3>
                      <p className="text-sm text-red-100">配送单 {warningShipment.vehicleNo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWarningPanel(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <Thermometer className="w-4 h-4" /> 最近温度记录
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {warningShipment.tempLogs.slice(-6).reverse().map((log, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-red-100 last:border-0"
                      >
                        <span className="text-cream-600">{log.time}</span>
                        <div className="flex items-center gap-4">
                          <span className={cn('font-medium', getTempColor(log.temperature))}>
                            {log.temperature.toFixed(1)}℃
                          </span>
                          <span className="text-sky-600 font-medium">{log.humidity}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">处理方式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['通知司机', '调整温控', '标记已处理'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setResolution(opt)}
                        className={cn(
                          'px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                          resolution === opt
                            ? 'bg-forest-600 text-white border-forest-600'
                            : 'bg-white text-forest-700 border-cream-300 hover:border-forest-300',
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">处理人</label>
                  <select
                    value={handler}
                    onChange={(e) => setHandler(e.target.value)}
                    className="input-base"
                  >
                    <option value="调度员">调度员</option>
                    <option value="质检员">质检员</option>
                    <option value="库管员">库管员</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="label-base">备注</label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入处理备注..."
                    className="input-base min-h-[80px] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowWarningPanel(false)}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmResolve}
                    className="flex-1 btn-primary"
                  >
                    <Check className="w-4 h-4" />
                    确认处理
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showContactPanel && contactShipment && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowContactPanel(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-fadeInUp">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-forest-900">联系司机</h3>
                    <p className="text-sm text-cream-500">{contactShipment.driver} · {contactShipment.vehicleNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactPanel(false)}
                  className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
                >
                  <X className="w-5 h-5 text-cream-500" />
                </button>
              </div>

              <div className="mb-4">
                <label className="label-base">发送消息</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="请输入要发送给司机的消息..."
                  className="input-base min-h-[120px] resize-none"
                />
              </div>

              <div className="mb-4">
                <p className="text-xs text-cream-500 mb-2">快捷消息</p>
                <div className="flex flex-wrap gap-2">
                  {['请注意冷链温度', '预计到达时间', '收货地址确认', '有异常请及时汇报'].map((msg) => (
                    <button
                      key={msg}
                      onClick={() => setContactMessage(msg)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-cream-100 text-forest-700 hover:bg-forest-100 transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowContactPanel(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!contactMessage.trim()}
                  className="flex-1 btn-primary"
                >
                  <Send className="w-4 h-4" />
                  发送
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showSignModal && signShipment && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowSignModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-fadeInUp">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-forest-600 to-forest-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">确认签收</h3>
                      <p className="text-sm text-forest-100">配送单 {signShipment.vehicleNo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSignModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
                  <h4 className="text-sm font-semibold text-forest-800 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> 配送信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-cream-500">车牌</span>
                      <p className="font-medium text-forest-900">{signShipment.vehicleNo}</p>
                    </div>
                    <div>
                      <span className="text-cream-500">司机</span>
                      <p className="font-medium text-forest-900">{signShipment.driver}</p>
                    </div>
                    <div>
                      <span className="text-cream-500">发车时间</span>
                      <p className="font-medium text-forest-900">{formatTime(signShipment.departedAt)}</p>
                    </div>
                    <div>
                      <span className="text-cream-500">当前温度</span>
                      <p className={cn('font-medium', getTempColor(getCurrentTemp(signShipment)))}>
                        {getCurrentTemp(signShipment).toFixed(1)}℃
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-base">签收人 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={signBy}
                    onChange={(e) => setSignBy(e.target.value)}
                    placeholder="请输入签收人姓名"
                    className="input-base"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label-base">签收备注</label>
                  <textarea
                    value={signRemark}
                    onChange={(e) => setSignRemark(e.target.value)}
                    placeholder="请输入签收备注（可选）"
                    className="input-base min-h-[80px] resize-none"
                  />
                </div>

                {signShipment.tempLogs.some((l) => l.temperature > 4 || l.temperature < 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800 mb-1">温湿度异常提醒</p>
                        <p className="text-[11px] text-amber-700">该订单运输过程中存在温湿度超标情况，签收后将自动标记为异常单</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSignModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={!signBy.trim()}
                    className="flex-1 btn-primary"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认签收
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
