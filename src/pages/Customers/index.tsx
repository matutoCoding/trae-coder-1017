import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Building2,
  Flower2,
  Store,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Package,
  ArrowRight,
  CheckCircle2,
  Download,
  Bell,
  Send,
  Edit3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { cn } from '@/lib/utils';
import { formatMoney, formatDate, getStatusText, formatNum } from '@/utils/format';
import type { Customer, Return as ReturnType, Order, OrderItem } from '@/types';

type CustomerType = 'all' | 'funeral_home' | 'flower_shop' | 'distributor';
type CustomerLevel = 'all' | 'A' | 'B' | 'C';
type TabKey = 'list' | 'credit' | 'returns';

interface CustomerWithExtra extends Customer {
  totalPurchases?: number;
  joinDate?: string;
}

const typeNameMap: Record<string, string> = {
  funeral_home: '殡仪馆',
  flower_shop: '花店',
  distributor: '经销商',
  retail: '零售',
};

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  funeral_home: Building2,
  flower_shop: Flower2,
  distributor: Store,
  retail: Store,
};

const levelBadgeClass: Record<string, string> = {
  A: 'bg-chrysanthemum-500/15 text-chrysanthemum-600 border border-chrysanthemum-400/40',
  B: 'bg-gray-100 text-gray-600 border border-gray-300/60',
  C: 'bg-amber-50 text-amber-700 border border-amber-300/60',
  D: 'bg-gray-50 text-gray-500 border border-gray-200',
};

const levelLabel: Record<string, string> = {
  A: 'A级',
  B: 'B级',
  C: 'C级',
  D: 'D级',
};

const typeTabs: { key: CustomerType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'funeral_home', label: '殡仪馆' },
  { key: 'flower_shop', label: '花店' },
  { key: 'distributor', label: '经销商' },
];

const levelFilters: { key: CustomerLevel; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'A', label: 'A级' },
  { key: 'B', label: 'B级' },
  { key: 'C', label: 'C级' },
];

const CHART_COLORS = ['#2d7750', '#0ea5e9', '#e8b923', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#84cc16'];

const getProgressColor = (percent: number): string => {
  if (percent > 80) return 'bg-warning-500';
  if (percent > 50) return 'bg-amber-500';
  return 'bg-forest-500';
};

const getCreditPercent = (customer: Customer): number => {
  if (customer.creditLimit <= 0) return 0;
  return Math.round((customer.usedCredit / customer.creditLimit) * 100);
};

export default function CustomersPage() {
  const {
    customers,
    orders,
    returns,
    addOrder,
    updateCustomerCredit,
    addPaymentReminder,
    getPaymentRemindersForCustomer,
  } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [activeType, setActiveType] = useState<CustomerType>('all');
  const [activeLevel, setActiveLevel] = useState<CustomerLevel>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithExtra | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [creditRemark, setCreditRemark] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderRemark, setNewOrderRemark] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 3500);
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
  const forceRefresh = () => setRefreshKey((k) => k + 1);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const customersWithExtra = customers as CustomerWithExtra[];

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'active').length;
    const newThisMonth = customersWithExtra.filter((c) =>
      c.joinDate?.startsWith(currentMonth),
    ).length;
    const totalReceivable = customers.reduce(
      (sum, c) => sum + c.usedCredit,
      0,
    );
    return { total, active, newThisMonth, totalReceivable };
  }, [customers, customersWithExtra, currentMonth, refreshKey]);

  const filteredCustomers = useMemo(() => {
    return customersWithExtra.filter((c) => {
      const matchSearch =
        !searchText ||
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.contact.toLowerCase().includes(searchText.toLowerCase());
      const matchType = activeType === 'all' || c.type === activeType;
      const matchLevel = activeLevel === 'all' || c.level === activeLevel;
      return matchSearch && matchType && matchLevel;
    });
  }, [customersWithExtra, searchText, activeType, activeLevel, refreshKey]);

  const chartData = useMemo(() => {
    return [...customersWithExtra]
      .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
      .slice(0, 10)
      .map((c) => ({
        name: c.name.length > 6 ? c.name.slice(0, 6) + '…' : c.name,
        采购额: Math.round((c.totalPurchases || 0) / 10000),
      }));
  }, [customersWithExtra, refreshKey]);

  const creditData = useMemo(() => {
    return customersWithExtra.map((c) => {
      const percent = getCreditPercent(c);
      const customerOrders = orders.filter((o) => o.customerId === c.id);
      const completedOrders = customerOrders.filter((o) => o.status === 'completed');
      const avgPaymentDays = c.paymentTerms;

      const overdueDays = percent > 90 ? Math.ceil((percent - 90) * 2) : 0;
      const lastBill = customerOrders.length > 0
        ? customerOrders[customerOrders.length - 1].createdAt.slice(0, 10)
        : '-';
      const dueDate = lastBill !== '-' ? formatDate(
        new Date(new Date(lastBill).getTime() + c.paymentTerms * 86400000),
        'YYYY-MM-DD',
      ) : '-';

      let status = '正常';
      if (overdueDays > 0) status = '逾期';
      else if (percent > 80) status = '警戒';
      else if (percent > 50) status = '关注';

      return {
        ...c,
        percent,
        orderCount: customerOrders.length,
        completedCount: completedOrders.length,
        avgPaymentDays,
        overdueDays,
        lastBill,
        dueDate,
        status,
        remainingCredit: c.creditLimit - c.usedCredit,
      };
    });
  }, [customersWithExtra, orders, refreshKey]);

  const returnsData = useMemo(() => {
    return returns.map((r) => {
      const customer = customersWithExtra.find((c) => c.id === r.customerId);
      const order = orders.find((o) => o.id === r.orderId);
      return {
        ...r,
        customerName: customer?.name || '-',
        orderNo: order?.orderNo || '-',
      };
    });
  }, [returns, customersWithExtra, orders, refreshKey]);

  const getCustomerOrders = (customerId: string) =>
    orders
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

  const getCustomerReturns = (customerId: string) =>
    returns.filter((r) => r.customerId === customerId);

  const openDrawer = (customer: CustomerWithExtra) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const openNewOrder = (customer: CustomerWithExtra) => {
    setSelectedCustomer(customer);
    setNewOrderAmount('');
    setNewOrderRemark('');
    setOrderModalOpen(true);
  };

  const openAdjustCredit = (customer: CustomerWithExtra) => {
    setSelectedCustomer(customer);
    setNewCreditLimit(customer.creditLimit.toString());
    setCreditRemark('');
    setCreditModalOpen(true);
  };

  const openReminder = (customer: CustomerWithExtra) => {
    setSelectedCustomer(customer);
    const over = customer.usedCredit * 0.3;
    setReminderAmount(over > 0 ? Math.round(over).toString() : '');
    setReminderMessage(`尊敬的${customer.name}，您的账款已接近信用额度，请及时安排付款，谢谢合作！`);
    setReminderModalOpen(true);
  };

  const handleAddOrder = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(newOrderAmount);
    if (!newOrderAmount || isNaN(amount) || amount <= 0) {
      showToast('请输入有效的订单金额');
      return;
    }
    const remainingCredit = selectedCustomer.creditLimit - selectedCustomer.usedCredit;
    if (amount > remainingCredit) {
      showToast(
        `客户额度不足！剩余额度 ${formatMoney(remainingCredit)}，订单金额 ${formatMoney(amount)}，超出 ${formatMoney(amount - remainingCredit)}`,
        'error'
      );
      return;
    }

    const newOrder: Order = {
      id: `O${Date.now()}`,
      orderNo: `DD${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: [{
        id: 'item1',
        variety: 'chrysanthemum',
        grade: 'A',
        quantity: Math.round(amount / 1.2),
        unitPrice: 1.2,
      }],
      totalAmount: amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      deliveryAddress: selectedCustomer.address,
      address: selectedCustomer.address,
      contact: selectedCustomer.contact,
      phone: selectedCustomer.phone,
      remark: newOrderRemark,
    };
    const result = addOrder(newOrder);
    if (result.success && result.order) {
      setOrderModalOpen(false);
      setNewOrderAmount('');
      setNewOrderRemark('');
      forceRefresh();
      showToast(`订单 ${newOrder.orderNo} 已创建，客户：${selectedCustomer.name}，占用额度 ${formatMoney(amount)}`);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleUpdateCredit = () => {
    if (!selectedCustomer) return;
    const limit = parseInt(newCreditLimit, 10);
    if (!newCreditLimit || isNaN(limit) || limit <= 0) {
      showToast('请输入有效的额度');
      return;
    }
    const updated = updateCustomerCredit(selectedCustomer.id, limit, creditRemark);
    if (updated) {
      setSelectedCustomer({ ...selectedCustomer, creditLimit: limit });
      setCreditModalOpen(false);
      setNewCreditLimit('');
      setCreditRemark('');
      forceRefresh();
      showToast(`${selectedCustomer.name} 额度已调整为 ${formatMoney(limit)}`);
    }
  };

  const handleSendReminder = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(reminderAmount);
    if (!reminderAmount || isNaN(amount) || amount <= 0) {
      showToast('请输入有效的催款金额');
      return;
    }
    const result = addPaymentReminder(selectedCustomer.id, reminderMessage, amount);
    if (result) {
      setReminderModalOpen(false);
      setReminderAmount('');
      setReminderMessage('');
      forceRefresh();
      showToast(`已向 ${selectedCustomer.name} 发送催款提醒`);
    }
  };

  const handleExportCSV = () => {
    if (!selectedCustomer) {
      showToast('请先选择客户');
      return;
    }
    const headers = ['客户名称', '客户类型', '联系人', '联系电话', '地址', '信用等级', '账期(天)', '信用额度', '已用额度', '剩余额度', '累计采购', '合作日期', '客户状态'];
    const rows = customers.map(c => [
      c.name,
      typeNameMap[c.type] || c.type,
      c.contact,
      c.phone,
      c.address,
      c.level,
      c.paymentTerms,
      c.creditLimit,
      c.usedCredit,
      c.creditLimit - c.usedCredit,
      (c as any).totalPurchases || 0,
      (c as any).joinDate || '-',
      c.status === 'active' ? '活跃' : '停用',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const bom = '\ufeff';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `客户报表_${selectedCustomer.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`客户报表已导出：${link.download}`);
  };

  const closeAllModals = () => {
    setCreditModalOpen(false);
    setReminderModalOpen(false);
    setOrderModalOpen(false);
  };

  const renderCustomerCard = (customer: CustomerWithExtra, index: number) => {
    const TypeIcon = typeIconMap[customer.type] || Store;
    const percent = getCreditPercent(customer);
    const progressColor = getProgressColor(percent);
    const remainingCredit = customer.creditLimit - customer.usedCredit;
    const customerOrders = orders.filter((o) => o.customerId === customer.id);
    const totalPurchases = customer.totalPurchases || customerOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );
    const avgPaymentDays = customer.paymentTerms;

    return (
      <div
        key={customer.id}
        className="card-base card-hover p-5 opacity-0 animate-fadeInUp"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
              customer.type === 'funeral_home' && 'bg-sky-100 text-sky-600',
              customer.type === 'flower_shop' && 'bg-pink-100 text-pink-600',
              customer.type === 'distributor' && 'bg-purple-100 text-purple-600',
              !(customer.type === 'funeral_home' || customer.type === 'flower_shop' || customer.type === 'distributor') && 'bg-gray-100 text-gray-600',
            )}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-forest-900 text-base truncate">
                  {customer.name}
                </h3>
                <span className={cn(
                  'badge flex-shrink-0',
                  levelBadgeClass[customer.level],
                )}>
                  {levelLabel[customer.level]}
                </span>
              </div>
              <p className="text-xs text-cream-500">
                {typeNameMap[customer.type] || customer.type}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <span className={cn(
              'badge',
              customer.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500',
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                customer.status === 'active' ? 'bg-green-500' : 'bg-gray-400',
              )} />
              {customer.status === 'active' ? '活跃' : '停用'}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-forest-700">
            <Users className="w-4 h-4 text-cream-500 flex-shrink-0" />
            <span className="truncate">{customer.contact}</span>
          </div>
          <div className="flex items-center gap-2 text-forest-700">
            <Phone className="w-4 h-4 text-cream-500 flex-shrink-0" />
            <span className="truncate">{customer.phone}</span>
          </div>
          <div className="flex items-start gap-2 text-forest-700">
            <MapPin className="w-4 h-4 text-cream-500 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{customer.address}</span>
          </div>
        </div>

        <div className="bg-cream-50 rounded-lg p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-forest-700">
              <CreditCard className="w-3.5 h-3.5" />
              账期额度
            </div>
            <span className={cn(
              'text-xs font-semibold',
              percent > 80 ? 'text-warning-600' : percent > 50 ? 'text-amber-600' : 'text-forest-600',
            )}>
              {percent}%
            </span>
          </div>
          <div className="progress-track mb-2">
            <div
              className={cn('progress-bar', progressColor)}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-cream-500 mb-0.5">已用金额</p>
              <p className="font-medium text-warning-600">{formatMoney(customer.usedCredit)}</p>
            </div>
            <div>
              <p className="text-cream-500 mb-0.5">剩余额度</p>
              <p className="font-medium text-forest-600">{formatMoney(remainingCredit)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-cream-100">
          <div className="text-center">
            <p className="text-lg font-bold text-chrysanthemum-600">
              {formatNum(Math.round(totalPurchases / 10000))}
              <span className="text-xs font-normal text-cream-500 ml-0.5">万</span>
            </p>
            <p className="text-xs text-cream-500 mt-0.5">累计采购</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-forest-700">
              {customerOrders.length}
              <span className="text-xs font-normal text-cream-500 ml-0.5">单</span>
            </p>
            <p className="text-xs text-cream-500 mt-0.5">历史单数</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-sky-600">
              {avgPaymentDays}
              <span className="text-xs font-normal text-cream-500 ml-0.5">天</span>
            </p>
            <p className="text-xs text-cream-500 mt-0.5">平均账期</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openDrawer(customer)}
            className="flex-1 btn-secondary py-2 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            查看详情
          </button>
          <button
            onClick={() => openReminder(customer)}
            className="flex-1 btn-secondary py-2 text-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            催款提醒
          </button>
          <button
            onClick={() => openNewOrder(customer)}
            className="flex-1 btn-primary py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            新增订单
          </button>
        </div>
      </div>
    );
  };

  const renderCreditTab = () => {
    const creditColumns = [
      {
        key: 'name',
        title: '客户名称',
        render: (row: any) => {
          const TypeIcon = typeIconMap[row.type] || Store;
          return (
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                row.type === 'funeral_home' && 'bg-sky-100 text-sky-600',
                row.type === 'flower_shop' && 'bg-pink-100 text-pink-600',
                row.type === 'distributor' && 'bg-purple-100 text-purple-600',
                !(row.type === 'funeral_home' || row.type === 'flower_shop' || row.type === 'distributor') && 'bg-gray-100 text-gray-600',
              )}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-forest-900">{row.name}</p>
                <p className="text-xs text-cream-500">{row.contact}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'level',
        title: '等级',
        render: (row: any) => (
          <span className={cn('badge', levelBadgeClass[row.level])}>
            {levelLabel[row.level]}
          </span>
        ),
      },
      {
        key: 'creditLimit',
        title: '信用额度',
        render: (row: any) => <span className="font-medium">{formatMoney(row.creditLimit)}</span>,
      },
      {
        key: 'usedCredit',
        title: '已用金额',
        render: (row: any) => (
          <span className="font-medium text-warning-600">{formatMoney(row.usedCredit)}</span>
        ),
      },
      {
        key: 'remainingCredit',
        title: '剩余额度',
        render: (row: any) => (
          <span className="font-medium text-forest-600">{formatMoney(row.remainingCredit)}</span>
        ),
      },
      {
        key: 'paymentTerms',
        title: '账期天数',
        render: (row: any) => <span>{row.paymentTerms}天</span>,
      },
      {
        key: 'lastBill',
        title: '最近账单日',
        render: (row: any) => <span className="text-xs">{row.lastBill}</span>,
      },
      {
        key: 'dueDate',
        title: '到期日',
        render: (row: any) => <span className="text-xs">{row.dueDate}</span>,
      },
      {
        key: 'overdueDays',
        title: '逾期天数',
        render: (row: any) => (
          <span className={cn(
            'font-semibold',
            row.overdueDays > 0 ? 'text-warning-600' : 'text-forest-600',
          )}>
            {row.overdueDays > 0 ? `${row.overdueDays}天` : '0'}
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        render: (row: any) => (
          <span className={cn(
            'badge',
            row.status === '逾期' && 'bg-red-100 text-red-700',
            row.status === '警戒' && 'bg-warning-100 text-warning-600',
            row.status === '关注' && 'bg-amber-100 text-amber-700',
            row.status === '正常' && 'bg-green-100 text-green-700',
          )}>
            {row.status}
          </span>
        ),
      },
      {
        key: 'actions',
        title: '操作',
        render: (row: any) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openDrawer(row)}
              className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-chrysanthemum-50 text-chrysanthemum-600 transition-colors"
              title="调整额度"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-500 transition-colors"
              title="催款提醒"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        <div className="card-base p-5">
          <h3 className="section-title mb-5">
            <TrendingUp className="w-5 h-5 text-forest-600" />
            客户采购排名 TOP 10（单位：万元）
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={{ stroke: '#d8cdb4' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e6dfcd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number) => [`${value}万`, '采购额']}
                />
                <Bar dataKey="采购额" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataTable
          columns={creditColumns}
          data={creditData}
          rowKey="id"
          emptyText="暂无账期数据"
        />
      </div>
    );
  };

  const renderReturnsTab = () => {
    const returnsColumns = [
      {
        key: 'id',
        title: '退货编号',
        render: (row: any) => (
          <span className="font-mono text-sm font-medium text-forest-800">{row.id}</span>
        ),
      },
      {
        key: 'orderNo',
        title: '关联订单',
        render: (row: any) => (
          <span className="font-mono text-xs text-sky-600">{row.orderNo}</span>
        ),
      },
      {
        key: 'customerName',
        title: '客户',
        render: (row: any) => (
          <span className="font-medium text-forest-900">{row.customerName}</span>
        ),
      },
      {
        key: 'reason',
        title: '退货原因',
        render: (row: any) => (
          <div className="max-w-xs truncate text-sm" title={row.reason}>
            {row.reason}
          </div>
        ),
      },
      {
        key: 'quantity',
        title: '退货数量',
        render: (row: any) => <span>{row.quantity}枝</span>,
      },
      {
        key: 'amount',
        title: '退货金额',
        render: (row: any) => (
          <span className="font-medium text-warning-600">{formatMoney(row.amount)}</span>
        ),
      },
      {
        key: 'disposal',
        title: '处理方式',
        render: (row: any) => {
          const disposal = row.disposal as string;
          let label = '其他';
          let cls = 'bg-gray-100 text-gray-700';
          if (disposal.includes('退款')) {
            label = '退款';
            cls = 'bg-amber-100 text-amber-700';
          } else if (disposal.includes('补发') || disposal.includes('补送') || disposal.includes('补货')) {
            label = '补货';
            cls = 'bg-sky-100 text-sky-700';
          } else if (disposal.includes('销毁') || disposal.includes('报废')) {
            label = '报废';
            cls = 'bg-red-100 text-red-700';
          }
          return <span className={cn('badge', cls)}>{label}</span>;
        },
      },
      {
        key: 'processedAt',
        title: '处理日期',
        render: (row: any) => (
          <span className="text-xs">{formatDate(row.processedAt, 'YYYY-MM-DD')}</span>
        ),
      },
      {
        key: 'status2',
        title: '状态',
        render: () => (
          <span className="badge bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
            已完成
          </span>
        ),
      },
      {
        key: 'actions',
        title: '操作',
        render: (row: any) => (
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-500 transition-colors"
              title="删除记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    return (
      <DataTable
        columns={returnsColumns}
        data={returnsData}
        rowKey="id"
        emptyText="暂无退货记录"
      />
    );
  };

  const renderDrawer = () => {
    if (!selectedCustomer) return null;

    const customerOrders = getCustomerOrders(selectedCustomer.id);
    const customerReturns = getCustomerReturns(selectedCustomer.id);
    const percent = getCreditPercent(selectedCustomer);
    const progressColor = getProgressColor(percent);
    const remainingCredit = selectedCustomer.creditLimit - selectedCustomer.usedCredit;
    const TypeIcon = typeIconMap[selectedCustomer.type] || Store;
    const totalPurchases = selectedCustomer.totalPurchases || customerOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );

    const mockBills = [
      { id: 1, billNo: 'ZD202606001', date: '2026-06-15', amount: 85000, dueDate: '2026-07-15', status: '未到期' },
      { id: 2, billNo: 'ZD202605002', date: '2026-05-20', amount: 120000, dueDate: '2026-06-20', status: '未到期' },
      { id: 3, billNo: 'ZD202605001', date: '2026-05-08', amount: 68000, dueDate: '2026-06-08', status: '待付款' },
      { id: 4, billNo: 'ZD202604003', date: '2026-04-25', amount: 95000, dueDate: '2026-05-25', status: '已付款' },
      { id: 5, billNo: 'ZD202604001', date: '2026-04-05', amount: 280000, dueDate: '2026-05-05', status: '已付款' },
    ];

    const orderColumns = [
      {
        key: 'orderNo',
        title: '订单号',
        render: (row: any) => (
          <span className="font-mono text-xs text-sky-600">{row.orderNo}</span>
        ),
      },
      {
        key: 'createdAt',
        title: '下单时间',
        render: (row: any) => formatDate(row.createdAt, 'MM-DD'),
      },
      {
        key: 'status',
        title: '状态',
        render: (row: any) => (
          <span className={cn(
            'badge',
            row.status === 'completed' && 'bg-green-100 text-green-700',
            row.status === 'shipped' && 'bg-orange-100 text-orange-700',
            row.status === 'delivered' && 'bg-cyan-100 text-cyan-700',
            row.status === 'producing' && 'bg-indigo-100 text-indigo-700',
            row.status === 'confirmed' && 'bg-blue-100 text-blue-700',
            row.status === 'pending' && 'bg-yellow-100 text-yellow-700',
            (row.status === 'cancelled' || row.status === 'returned') && 'bg-red-100 text-red-700',
            !(row.status === 'completed' || row.status === 'shipped' || row.status === 'delivered' || row.status === 'producing' || row.status === 'confirmed' || row.status === 'pending' || row.status === 'cancelled' || row.status === 'returned') && 'bg-gray-100 text-gray-600',
          )}>
            {getStatusText(row.status, 'order')}
          </span>
        ),
      },
      {
        key: 'totalAmount',
        title: '金额',
        render: (row: any) => (
          <span className="font-medium text-chrysanthemum-600">{formatMoney(row.totalAmount)}</span>
        ),
      },
    ];

    const returnsColumns = [
      {
        key: 'id',
        title: '退货编号',
        render: (row: any) => (
          <span className="font-mono text-xs">{row.id}</span>
        ),
      },
      {
        key: 'processedAt',
        title: '处理日期',
        render: (row: any) => formatDate(row.processedAt, 'MM-DD'),
      },
      {
        key: 'reason',
        title: '原因',
        render: (row: any) => (
          <span className="text-xs max-w-24 truncate inline-block" title={row.reason}>
            {row.reason}
          </span>
        ),
      },
      {
        key: 'amount',
        title: '金额',
        render: (row: any) => (
          <span className="font-medium text-warning-600">{formatMoney(row.amount)}</span>
        ),
      },
    ];

    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-forest-900/30 backdrop-blur-sm transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={closeDrawer}
        />
        <div
          className={cn(
            'relative ml-auto w-full max-w-2xl h-full bg-cream-50 shadow-2xl transform transition-transform duration-300 flex flex-col overflow-hidden',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-cream-200 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                selectedCustomer.type === 'funeral_home' && 'bg-sky-100 text-sky-600',
                selectedCustomer.type === 'flower_shop' && 'bg-pink-100 text-pink-600',
                selectedCustomer.type === 'distributor' && 'bg-purple-100 text-purple-600',
                !(selectedCustomer.type === 'funeral_home' || selectedCustomer.type === 'flower_shop' || selectedCustomer.type === 'distributor') && 'bg-gray-100 text-gray-600',
              )}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-forest-900 truncate">
                    {selectedCustomer.name}
                  </h2>
                  <span className={cn('badge', levelBadgeClass[selectedCustomer.level])}>
                    {levelLabel[selectedCustomer.level]}
                  </span>
                </div>
                <p className="text-sm text-cream-500">
                  {typeNameMap[selectedCustomer.type] || selectedCustomer.type}
                  <span className="mx-2">·</span>
                  <span className={selectedCustomer.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                    {selectedCustomer.status === 'active' ? '活跃客户' : '已停用'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg hover:bg-cream-100 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-cream-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="card-base p-4">
                <p className="text-xs text-cream-500 mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3" /> 联系人
                </p>
                <p className="font-medium text-forest-900">{selectedCustomer.contact}</p>
              </div>
              <div className="card-base p-4">
                <p className="text-xs text-cream-500 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> 联系电话
                </p>
                <p className="font-medium text-forest-900">{selectedCustomer.phone}</p>
              </div>
              <div className="card-base p-4 col-span-2">
                <p className="text-xs text-cream-500 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 详细地址
                </p>
                <p className="font-medium text-forest-900">{selectedCustomer.address}</p>
              </div>
              <div className="card-base p-4">
                <p className="text-xs text-cream-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 合作时间
                </p>
                <p className="font-medium text-forest-900">{selectedCustomer.joinDate || '-'}</p>
              </div>
              <div className="card-base p-4">
                <p className="text-xs text-cream-500 mb-1.5 flex items-center gap-1">
                  <Package className="w-3 h-3" /> 累计采购
                </p>
                <p className="font-semibold text-chrysanthemum-600">{formatMoney(totalPurchases)}</p>
              </div>
            </div>

            <div className="card-base p-4">
              <h3 className="section-title text-base mb-3">
                <FileText className="w-4 h-4 text-forest-600" />
                合同信息
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-cream-500 text-xs mb-1">合同编号</p>
                  <p className="font-mono text-forest-800">HT-{selectedCustomer.id}-2026</p>
                </div>
                <div>
                  <p className="text-cream-500 text-xs mb-1">合同期限</p>
                  <p className="text-forest-800">2026-01-01 至 2026-12-31</p>
                </div>
                <div>
                  <p className="text-cream-500 text-xs mb-1">约定账期</p>
                  <p className="text-forest-800">{selectedCustomer.paymentTerms}天</p>
                </div>
                <div>
                  <p className="text-cream-500 text-xs mb-1">折扣率</p>
                  <p className="text-forest-800">
                    {selectedCustomer.level === 'A' ? '92折' : selectedCustomer.level === 'B' ? '95折' : '无折扣'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-base p-4">
              <h3 className="section-title text-base mb-3">
                <CreditCard className="w-4 h-4 text-forest-600" />
                账期额度
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-cream-50 rounded-lg p-3">
                  <p className="text-xs text-cream-500 mb-1">总额度</p>
                  <p className="text-lg font-bold text-forest-700">
                    {formatNum(Math.round(selectedCustomer.creditLimit / 10000))}万
                  </p>
                </div>
                <div className="bg-warning-50 rounded-lg p-3">
                  <p className="text-xs text-cream-500 mb-1">已使用</p>
                  <p className="text-lg font-bold text-warning-600">
                    {formatNum(Math.round(selectedCustomer.usedCredit / 10000))}万
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-cream-500 mb-1">剩余</p>
                  <p className="text-lg font-bold text-forest-600">
                    {formatNum(Math.round(remainingCredit / 10000))}万
                  </p>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-cream-500">使用率</span>
                  <span className={cn(
                    'font-semibold',
                    percent > 80 ? 'text-warning-600' : percent > 50 ? 'text-amber-600' : 'text-forest-600',
                  )}>
                    {percent}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={cn('progress-bar', progressColor)}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card-base p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title text-base mb-0">
                  <FileText className="w-4 h-4 text-forest-600" />
                  账期明细（最近5条）
                </h3>
                <button
                  onClick={() => selectedCustomer && openReminder(selectedCustomer)}
                  className="text-xs text-warning-600 hover:text-warning-700 flex items-center gap-1"
                >
                  <Bell className="w-3.5 h-3.5" />
                  催款提醒
                </button>
              </div>
              <div className="space-y-2">
                {mockBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-cream-50 rounded-lg"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-forest-800">
                        {bill.billNo}
                      </p>
                      <p className="text-xs text-cream-500 mt-0.5">
                        账单日 {bill.date} · 到期 {bill.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-chrysanthemum-600">
                        {formatMoney(bill.amount)}
                      </p>
                      <span className={cn(
                        'badge mt-1',
                        bill.status === '已付款' && 'bg-green-100 text-green-700',
                        bill.status === '待付款' && 'bg-warning-100 text-warning-600',
                        bill.status === '未到期' && 'bg-sky-100 text-sky-700',
                      )}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCustomer && (
              <div className="card-base p-4">
                <h3 className="section-title text-base mb-3">
                  <Bell className="w-4 h-4 text-warning-500" />
                  催款提醒记录
                </h3>
                {(() => {
                  const reminders = getPaymentRemindersForCustomer(selectedCustomer.id);
                  if (reminders.length === 0) {
                    return (
                      <p className="text-center py-6 text-cream-500 text-sm">暂无催款记录</p>
                    );
                  }
                  return (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {reminders.map((r) => (
                        <div key={r.id} className="p-3 bg-warning-50/50 rounded-lg border border-warning-200/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-warning-700">
                              催款金额：{formatMoney(r.amount)}
                            </span>
                            <span className="text-[10px] text-cream-500">
                              {formatDate(r.sentAt, 'YYYY-MM-DD HH:mm')}
                            </span>
                          </div>
                          <p className="text-xs text-forest-700 leading-relaxed line-clamp-2">
                            {r.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full',
                              r.status === 'sent' ? 'bg-sky-100 text-sky-700' :
                              r.status === 'paid' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {r.status === 'sent' ? '已发送' : r.status === 'paid' ? '已付款' : '待发送'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="card-base p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title text-base mb-0">
                  <Package className="w-4 h-4 text-forest-600" />
                  历史订单（最近5单）
                </h3>
                <button className="text-xs text-forest-600 hover:text-forest-700 flex items-center gap-1">
                  查看全部
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {customerOrders.length > 0 ? (
                <DataTable
                  columns={orderColumns}
                  data={customerOrders}
                  rowKey="id"
                  emptyText="暂无订单"
                />
              ) : (
                <p className="text-center py-8 text-cream-500 text-sm">暂无订单记录</p>
              )}
            </div>

            <div className="card-base p-4">
              <h3 className="section-title text-base mb-3">
                <RefreshCw className="w-4 h-4 text-warning-500" />
                退货历史
              </h3>
              {customerReturns.length > 0 ? (
                <DataTable
                  columns={returnsColumns}
                  data={customerReturns}
                  rowKey="id"
                  emptyText="暂无退货"
                />
              ) : (
                <p className="text-center py-8 text-cream-500 text-sm">暂无退货记录</p>
              )}
            </div>
          </div>

          <div className="border-t border-cream-200 p-4 bg-white flex items-center gap-3">
            <button
              onClick={() => selectedCustomer && openAdjustCredit(selectedCustomer)}
              className="flex-1 btn-secondary"
            >
              <Edit3 className="w-4 h-4" />
              调整额度
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 btn-secondary"
            >
              <Download className="w-4 h-4" />
              导出报表
            </button>
            <button
              onClick={() => selectedCustomer && openNewOrder(selectedCustomer)}
              className="flex-1 btn-primary"
            >
              <Plus className="w-4 h-4" />
              新增订单
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="客户总数"
          value={stats.total}
          icon={Users}
          trend="+3 本月"
          trendUp
          colorVariant="forest"
          delay={0}
        />
        <StatCard
          title="活跃客户"
          value={stats.active}
          icon={TrendingUp}
          trend={`占比 ${Math.round((stats.active / stats.total) * 100)}%`}
          trendUp
          colorVariant="chrysanthemum"
          delay={100}
        />
        <StatCard
          title="本月新增"
          value={stats.newThisMonth}
          icon={Users}
          trend="持续增长"
          trendUp
          colorVariant="blue"
          delay={200}
        />
        <StatCard
          title="应收账款总额"
          value={formatMoney(stats.totalReceivable)}
          icon={CreditCard}
          trend={stats.totalReceivable > 2000000 ? '偏高' : '正常'}
          trendUp={stats.totalReceivable <= 2000000}
          colorVariant="warning"
          delay={300}
        />
      </div>

      <div className="card-base p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-500" />
            <input
              type="text"
              placeholder="搜索客户名称、联系人..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-base pl-10 pr-10"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-cream-100 text-cream-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-cream-500 mr-1">客户类型：</span>
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveType(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  activeType === tab.key
                    ? 'bg-forest-600 text-white shadow-md'
                    : 'bg-cream-50 text-forest-700 hover:bg-cream-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="text-sm text-cream-500 mr-1">客户等级：</span>
            {levelFilters.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setActiveLevel(lvl.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  activeLevel === lvl.key
                    ? 'bg-chrysanthemum-500 text-white shadow-md'
                    : 'bg-cream-50 text-forest-700 hover:bg-cream-100',
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-cream-200 mb-6">
        <div className="flex items-center gap-1">
          {[
            { key: 'list' as TabKey, label: '客户档案', icon: Users },
            { key: 'credit' as TabKey, label: '账期与信用', icon: CreditCard },
            { key: 'returns' as TabKey, label: '退货处理', icon: RefreshCw },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200',
                activeTab === tab.key
                  ? 'border-forest-600 text-forest-700 bg-forest-50/50'
                  : 'border-transparent text-cream-500 hover:text-forest-700 hover:bg-cream-50',
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'list' && (
        <div>
          {filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredCustomers.map((customer, idx) => renderCustomerCard(customer, idx))}
            </div>
          ) : (
            <div className="card-base py-16 text-center">
              <Users className="w-16 h-16 mx-auto text-cream-300 mb-4" />
              <p className="text-cream-500 font-medium">暂无匹配的客户</p>
              <p className="text-sm text-cream-400 mt-1">请尝试调整筛选条件</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'credit' && renderCreditTab()}

      {activeTab === 'returns' && renderReturnsTab()}

      {renderDrawer()}

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeInUp">
          <div className="bg-forest-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeInUp">
          <div className="bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-200" />
            <span className="text-sm font-medium">{errorToast}</span>
          </div>
        </div>
      )}

      {orderModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeInUp">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="text-lg font-bold text-forest-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-forest-600" />
                新增订单
              </h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-cream-100">
                <X className="w-5 h-5 text-cream-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">客户名称</label>
                <input
                  type="text"
                  value={selectedCustomer.name}
                  disabled
                  className="input-base bg-cream-50 text-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">订单金额（元）</label>
                <input
                  type="number"
                  placeholder="请输入订单金额"
                  value={newOrderAmount}
                  onChange={(e) => setNewOrderAmount(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">备注</label>
                <textarea
                  placeholder="请输入订单备注（可选）"
                  value={newOrderRemark}
                  onChange={(e) => setNewOrderRemark(e.target.value)}
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={closeAllModals} className="flex-1 btn-secondary">
                  取消
                </button>
                <button onClick={handleAddOrder} className="flex-1 btn-primary">
                  <Send className="w-4 h-4" />
                  创建订单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {creditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeInUp">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="text-lg font-bold text-forest-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-forest-600" />
                调整信用额度
              </h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-cream-100">
                <X className="w-5 h-5 text-cream-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">客户名称</label>
                <input
                  type="text"
                  value={selectedCustomer.name}
                  disabled
                  className="input-base bg-cream-50 text-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">当前额度</label>
                <input
                  type="text"
                  value={`${formatMoney(selectedCustomer.creditLimit)}`}
                  disabled
                  className="input-base bg-cream-50 text-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">新额度（元）</label>
                <input
                  type="number"
                  placeholder="请输入新的信用额度"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">调整备注</label>
                <textarea
                  placeholder="请输入调整原因（可选）"
                  value={creditRemark}
                  onChange={(e) => setCreditRemark(e.target.value)}
                  rows={2}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={closeAllModals} className="flex-1 btn-secondary">
                  取消
                </button>
                <button onClick={handleUpdateCredit} className="flex-1 btn-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  确认调整
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reminderModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeInUp">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="text-lg font-bold text-forest-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-warning-500" />
                催款提醒
              </h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-cream-100">
                <X className="w-5 h-5 text-cream-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">客户名称</label>
                <input
                  type="text"
                  value={selectedCustomer.name}
                  disabled
                  className="input-base bg-cream-50 text-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">已用额度</label>
                <input
                  type="text"
                  value={`${formatMoney(selectedCustomer.usedCredit)} / ${formatMoney(selectedCustomer.creditLimit)}`}
                  disabled
                  className="input-base bg-cream-50 text-cream-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">催款金额（元）</label>
                <input
                  type="number"
                  placeholder="请输入催款金额"
                  value={reminderAmount}
                  onChange={(e) => setReminderAmount(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-800 mb-1.5">催款留言</label>
                <textarea
                  placeholder="请输入催款留言内容"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={4}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={closeAllModals} className="flex-1 btn-secondary">
                  取消
                </button>
                <button onClick={handleSendReminder} className="flex-1 btn-primary bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700">
                  <Send className="w-4 h-4" />
                  发送提醒
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
