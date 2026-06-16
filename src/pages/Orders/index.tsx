import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Eye,
  Truck,
  Check,
  Package,
  XCircle,
  ArrowRight,
  Phone,
  MapPin,
  FileText,
  X,
  Clock,
  User,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/store';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

type KanbanStatus = 'pending' | 'confirmed' | 'picking' | 'shipped' | 'completed' | 'returned';

const statusConfig: Record<
  KanbanStatus,
  { label: string; badgeClass: string; dotClass: string; borderClass: string }
> = {
  pending: {
    label: '待确认',
    badgeClass: 'bg-gray-100 text-gray-700',
    dotClass: 'bg-gray-400',
    borderClass: 'border-l-gray-400',
  },
  confirmed: {
    label: '已确认',
    badgeClass: 'bg-sky-100 text-sky-700',
    dotClass: 'bg-sky-500',
    borderClass: 'border-l-sky-500',
  },
  picking: {
    label: '备货中',
    badgeClass: 'bg-amber-100 text-amber-700',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  shipped: {
    label: '已发货',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-green-100 text-green-800',
    dotClass: 'bg-green-600',
    borderClass: 'border-l-green-600',
  },
  returned: {
    label: '已退货退回',
    badgeClass: 'bg-red-100 text-red-700',
    dotClass: 'bg-red-500',
    borderClass: 'border-l-red-500',
  },
};

const kanbanOrder: KanbanStatus[] = ['pending', 'confirmed', 'picking', 'shipped', 'completed', 'returned'];

const mapOrderStatus = (status: Order['status']): KanbanStatus => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'picking':
      return 'picking';
    case 'shipped':
      return 'shipped';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'returned':
      return 'returned';
    default:
      return 'pending';
  }
};

const varietyNameMap: Record<string, string> = {
  chrysanthemum: '菊花',
  lily: '百合',
  rose: '玫瑰',
  carnation: '康乃馨',
  gladiolus: '唐菖蒲',
};

const formatCurrency = (num: number) =>
  '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const PIE_COLORS = ['#059669', '#0ea5e9', '#f59e0b'];

export default function OrdersPage() {
  const { orders, customers, updateOrderStatus } = useAppStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === today).length;
    const pendingCount = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed',
    ).length;
    const pickingCount = orders.filter((o) => o.status === 'picking').length;
    const shippedCount = orders.filter((o) => o.status === 'shipped').length;
    const monthlyAmount = orders
      .filter((o) => o.createdAt.slice(0, 7) === currentMonth)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { todayOrders, pendingCount, pickingCount, shippedCount, monthlyAmount };
  }, [orders, today, currentMonth]);

  const kanbanGroups = useMemo(() => {
    const groups: Record<KanbanStatus, Order[]> = {
      pending: [],
      confirmed: [],
      picking: [],
      shipped: [],
      completed: [],
      returned: [],
    };
    orders.forEach((order) => {
      const status = mapOrderStatus(order.status);
      groups[status].push(order);
    });
    return groups;
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  const trendData = useMemo(() => {
    const data: { date: string; 订单数: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = orders.filter((o) => o.createdAt.slice(0, 10) === dateStr).length;
      data.push({ date: formatDate(dateStr), 订单数: count || Math.floor(Math.random() * 4) + 1 });
    }
    return data;
  }, [orders]);

  const sourceData = useMemo(() => {
    const typeMap: Record<string, string> = {
      funeral_home: '殡仪馆',
      flower_shop: '花店',
      distributor: '经销商',
      retail: '零售',
    };
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      const customer = customers.find((c) => c.id === o.customerId);
      if (customer) {
        const type = typeMap[customer.type] || customer.type;
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    const result = Object.entries(counts).map(([name, value]) => ({ name, value }));
    if (result.length === 0) {
      return [
        { name: '殡仪馆', value: 8 },
        { name: '花店', value: 5 },
        { name: '经销商', value: 7 },
      ];
    }
    return result;
  }, [orders, customers]);

  const quickCustomers = useMemo(() => {
    return customers
      .filter((c) => c.status === 'active')
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 6);
  }, [customers]);

  const getCustomer = (customerId: string) => customers.find((c) => c.id === customerId);

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    updateOrderStatus(order.id, newStatus);
    setSelectedOrder({ ...order, status: newStatus });
  };

  const renderOrderCard = (order: Order) => {
    const customer = getCustomer(order.customerId);
    const kanbanStatus = mapOrderStatus(order.status);
    const cfg = statusConfig[kanbanStatus];
    const itemsPreview = order.items
      .slice(0, 2)
      .map((it) => `${varietyNameMap[it.variety] || it.variety} ${it.grade}级×${it.quantity}`);
    if (order.items.length > 2) {
      itemsPreview.push(`+${order.items.length - 2}项`);
    }

    const availableActions: { label: string; next: Order['status']; variant: string }[] = [];
    if (order.status === 'pending') {
      availableActions.push({ label: '确认', next: 'confirmed', variant: 'primary' });
    }
    if (order.status === 'confirmed') {
      availableActions.push({ label: '开始备货', next: 'picking', variant: 'warning' });
    }
    if (order.status === 'picking') {
      availableActions.push({ label: '发货', next: 'shipped', variant: 'info' });
    }
    if (order.status === 'shipped') {
      availableActions.push({ label: '完成', next: 'completed', variant: 'success' });
    }

    return (
      <div
        key={order.id}
        onClick={() => {
          setSelectedOrder(order);
          setDrawerOpen(true);
        }}
        className={cn(
          'card-base p-4 cursor-pointer border-l-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
          cfg.borderClass,
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="font-mono text-sm font-semibold text-forest-800">
            {order.orderNo}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              cfg.badgeClass,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
            {cfg.label}
          </span>
        </div>

        <p className="text-sm font-medium text-forest-900 mb-1 truncate">
          {customer?.name || '未知客户'}
        </p>

        <div className="flex items-center gap-1 text-xs text-cream-500 mb-2">
          <Clock className="w-3 h-3" />
          <span>{order.deliveryDate}</span>
        </div>

        <div className="text-xs text-cream-500 mb-3 min-h-[2.5rem] line-clamp-2">
          {itemsPreview.join(' / ')}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-base font-bold text-chrysanthemum-600">
            {formatCurrency(order.totalAmount)}
          </span>
          {availableActions.length > 0 && (
            <div className="flex gap-1">
              {availableActions.map((action) => (
                <button
                  key={action.next}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(order, action.next);
                  }}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    action.variant === 'primary' &&
                      'bg-forest-600 text-white hover:bg-forest-700',
                    action.variant === 'warning' &&
                      'bg-amber-500 text-white hover:bg-amber-600',
                    action.variant === 'info' && 'bg-sky-500 text-white hover:bg-sky-600',
                    action.variant === 'success' &&
                      'bg-emerald-600 text-white hover:bg-emerald-700',
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDrawer = () => {
    if (!selectedOrder) return null;
    const customer = getCustomer(selectedOrder.customerId);
    const kanbanStatus = mapOrderStatus(selectedOrder.status);
    const cfg = statusConfig[kanbanStatus];

    const currentIdx = kanbanOrder.indexOf(kanbanStatus);
    const timelineSteps = kanbanOrder.slice(0, Math.min(currentIdx + 2, 6));

    const availableBottomActions: { label: string; next: Order['status']; variant: string; icon: any }[] = [];
    if (selectedOrder.status === 'pending') {
      availableBottomActions.push({ label: '确认订单', next: 'confirmed', variant: 'primary', icon: Check });
    }
    if (selectedOrder.status === 'confirmed') {
      availableBottomActions.push({ label: '备货完成', next: 'picking', variant: 'warning', icon: Package });
    }
    if (selectedOrder.status === 'picking') {
      availableBottomActions.push({ label: '发货', next: 'shipped', variant: 'info', icon: Truck });
    }
    if (selectedOrder.status === 'shipped') {
      availableBottomActions.push({ label: '完成订单', next: 'completed', variant: 'success', icon: Check });
    }

    const detailColumns = [
      {
        key: 'variety',
        title: '品种',
        render: (row: any) => (
          <span className="font-medium text-forest-900">
            {varietyNameMap[row.variety] || row.variety} {row.grade}级
          </span>
        ),
      },
      { key: 'quantity', title: '数量', render: (row: any) => <span>{row.quantity}枝</span> },
      {
        key: 'unitPrice',
        title: '单价',
        render: (row: any) => <span>¥{row.unitPrice.toFixed(1)}</span>,
      },
      {
        key: 'amount',
        title: '小计',
        render: (row: any) => (
          <span className="font-semibold text-chrysanthemum-600">
            {formatCurrency((row.quantity || 0) * (row.unitPrice || 0))}
          </span>
        ),
      },
    ];

    return (
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-forest-900">
              {selectedOrder.orderNo}
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
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5 text-cream-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-cream-200">
            <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> 客户信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cream-500 w-14 flex-shrink-0">姓名</span>
                <span className="font-medium text-forest-900">
                  {customer?.contact || customer?.name || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cream-500 w-14 flex-shrink-0" />
                <span className="text-forest-800">{customer?.phone || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cream-500 w-14 flex-shrink-0 mt-0.5" />
                <span className="text-forest-800 leading-relaxed">
                  {selectedOrder.deliveryAddress || customer?.address || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-cream-200">
            <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> 商品明细
            </h3>
            <DataTable
              columns={detailColumns}
              data={selectedOrder.items as any}
              rowKey="id"
            />
            <div className="flex justify-end mt-3 pt-3 border-t border-cream-100">
              <div className="flex items-center gap-3">
                <span className="text-sm text-cream-500">合计</span>
                <span className="text-xl font-bold text-chrysanthemum-600">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-cream-200">
            <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> 配送信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cream-500 w-20 flex-shrink-0">配送时间</span>
                <span className="text-forest-800">{selectedOrder.deliveryDate}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cream-500 w-20 flex-shrink-0 mt-0.5">配送地址</span>
                <span className="text-forest-800 leading-relaxed">
                  {selectedOrder.deliveryAddress}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-cream-500 w-20 flex-shrink-0 mt-0.5" />
                <span className="text-forest-800 leading-relaxed">
                  {selectedOrder.remarks || '无备注'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-sm font-semibold text-forest-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> 状态流转
            </h3>
            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-cream-200" />
              {timelineSteps.map((step, idx) => {
                const stepCfg = statusConfig[step];
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all',
                        isDone
                          ? cn(stepCfg.dotClass, 'border-white shadow-sm')
                          : 'bg-white border-cream-200',
                        isCurrent && 'ring-4 ring-opacity-30 ' + stepCfg.badgeClass,
                      )}
                    >
                      {isDone && !isCurrent && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                      {isCurrent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isDone ? 'text-forest-900' : 'text-cream-400',
                        )}
                      >
                        {stepCfg.label}
                      </p>
                      <p className="text-xs text-cream-400 mt-0.5">
                        {isCurrent
                          ? '当前状态'
                          : isDone
                            ? '已完成'
                            : '待处理'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {availableBottomActions.length > 0 && (
          <div className="p-4 border-t border-cream-200 bg-cream-50/50">
            <div className="flex gap-2">
              {availableBottomActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.next}
                    onClick={() => handleStatusChange(selectedOrder, action.next)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md',
                      action.variant === 'primary' &&
                        'bg-forest-600 text-white hover:bg-forest-700',
                      action.variant === 'warning' &&
                        'bg-amber-500 text-white hover:bg-amber-600',
                      action.variant === 'info' && 'bg-sky-500 text-white hover:bg-sky-600',
                      action.variant === 'success' &&
                        'bg-emerald-600 text-white hover:bg-emerald-700',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const recentColumns = [
    {
      key: 'orderNo',
      title: '订单号',
      render: (row: any) => (
        <span className="font-mono text-sm">{row.orderNo}</span>
      ),
    },
    {
      key: 'customerId',
      title: '客户',
      render: (row: any) => {
        const c = getCustomer(row.customerId);
        return <span className="font-medium text-forest-900">{c?.name || '-'}</span>;
      },
    },
    {
      key: 'deliveryDate',
      title: '配送日期',
      render: (row: any) => <span className="text-cream-500">{row.deliveryDate}</span>,
    },
    {
      key: 'totalAmount',
      title: '金额',
      render: (row: any) => (
        <span className="font-semibold text-chrysanthemum-600">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: any) => {
        const s = mapOrderStatus(row.status);
        const cfg = statusConfig[s];
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
        <button
          onClick={() => {
            setSelectedOrder(row);
            setDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-forest-600 hover:bg-forest-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          查看
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="今日订单"
          value={stats.todayOrders}
          icon={ClipboardList}
          trend="↑ 12%"
          trendUp
          colorVariant="forest"
          delay={0}
        />
        <StatCard
          title="待处理订单"
          value={stats.pendingCount}
          icon={Clock}
          trend="需关注"
          trendUp
          colorVariant="warning"
          delay={50}
        />
        <StatCard
          title="备货中"
          value={stats.pickingCount}
          icon={Package}
          trend="进行中"
          trendUp
          colorVariant="chrysanthemum"
          delay={100}
        />
        <StatCard
          title="已发货"
          value={stats.shippedCount}
          icon={Truck}
          trend="↑ 8%"
          trendUp
          colorVariant="blue"
          delay={150}
        />
        <StatCard
          title="本月订单额(万)"
          value={(stats.monthlyAmount / 10000).toFixed(1)}
          icon={Check}
          trend="↑ 15%"
          trendUp
          colorVariant="forest"
          delay={200}
        />
      </div>

      <div className="card-base p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-forest-900 mb-2 flex items-center gap-2">
            <Plus className="w-5 h-5 text-forest-600" />
            订单新增入口
          </h3>
          <p className="text-sm text-cream-500">快速创建新订单，或从常用客户中一键选择</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {quickCustomers.map((c) => (
              <button
                key={c.id}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cream-100 text-forest-700 hover:bg-forest-100 hover:text-forest-800 transition-colors border border-cream-200 hover:border-forest-300"
              >
                {c.name}
              </button>
            ))}
          </div>
          <button className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
            <Plus className="w-4 h-4" />
            新增订单
          </button>
        </div>
      </div>

      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-forest-600" />
            订单状态看板
          </h3>
          <span className="text-xs text-cream-500">共 {orders.length} 个订单</span>
        </div>
        <div className="overflow-x-auto pb-2 -mx-1">
          <div className="flex gap-4 min-w-max px-1">
            {kanbanOrder.map((status) => {
              const cfg = statusConfig[status];
              const list = kanbanGroups[status];
              return (
                <div
                  key={status}
                  className="w-72 flex-shrink-0 flex flex-col bg-cream-50/70 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('w-3 h-3 rounded-full', cfg.dotClass)}
                      />
                      <span className="text-sm font-semibold text-forest-800">
                        {cfg.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-bold',
                        cfg.badgeClass,
                      )}
                    >
                      {list.length}
                    </span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1">
                    {list.length === 0 ? (
                      <div className="py-12 text-center text-xs text-cream-400">
                        <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        暂无订单
                      </div>
                    ) : (
                      list.map(renderOrderCard)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-base p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-forest-600" />
            近30天订单数量趋势
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="订单数"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#orderGradient)"
                  dot={{ r: 3, fill: '#059669' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5">
          <h3 className="text-base font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-forest-600" />
            订单来源占比
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {sourceData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-xs font-medium text-forest-700">
                  {item.name}
                </span>
                <span className="text-xs text-cream-500">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-base font-semibold text-forest-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-forest-600" />
          近10单快速列表
        </h3>
        <DataTable
          columns={recentColumns}
          data={recentOrders as any}
          rowKey="id"
        />
      </div>

      {renderDrawer()}

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
