import { useState, useMemo, useEffect } from 'react';
import {
  Scissors,
  Award,
  Thermometer,
  Package,
  ClipboardCheck,
  Users,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Snowflake,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '@/store';
import { StepsIndicator } from '@/components/ui/StepsIndicator';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate, formatNum, formatPercent, getStatusText, getStatusColor } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Harvest, Inventory, PlantingBatch } from '@/types';

const GRADE_COLORS = {
  A: '#e8b923',
  B: '#94a3b8',
  C: '#cd7f32',
  defective: '#c0392b',
};

const STEPS = ['采收登记', '品质分级', '保鲜预冷', '入库存储'];

interface PreCoolRecord extends Inventory {
  batchId?: string;
}

interface HarvestLogRow extends Harvest {
  fieldName?: string;
  lossRate?: number;
}

const PRE_COOL_LOCATIONS = ['冷库A-01', '冷库A-02', '冷库A-03', '冷库B-01', '冷库B-02', '冷库C-01'];
const PRESERVATIVES = ['8-HQC', 'STS', '蔗糖+8-HQC', '专用保鲜剂'];

export default function PostHarvestPage() {
  const { harvests, inventory, batches, fields, addHarvest, addInventoryItems } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formExpanded, setFormExpanded] = useState(true);

  const [batchId, setBatchId] = useState('');
  const [harvestedAt, setHarvestedAt] = useState(formatDate(new Date()));
  const [quantity, setQuantity] = useState('');
  const [staff, setStaff] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const showToast = (msg: string) => setSuccessToast(msg);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === batchId);
  }, [batchId, batches]);

  const selectedField = useMemo(() => {
    if (!selectedBatch) return null;
    return fields.find((f) => f.id === selectedBatch.fieldId);
  }, [selectedBatch, fields]);

  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthlyHarvests = useMemo(() => {
    return harvests.filter((h) => h.harvestedAt.startsWith(currentMonth));
  }, [harvests, currentMonth]);

  const stats = useMemo(() => {
    const totalQty = monthlyHarvests.reduce((s, h) => s + h.quantity, 0);
    const gradeA = monthlyHarvests.reduce((s, h) => s + h.gradeAQty, 0);
    const gradeB = monthlyHarvests.reduce((s, h) => s + h.gradeBQty, 0);
    const gradeC = monthlyHarvests.reduce((s, h) => s + h.gradeCQty, 0);
    const defective = monthlyHarvests.reduce((s, h) => s + h.defectiveQty, 0);
    const gradeARate = totalQty > 0 ? (gradeA / totalQty) * 100 : 0;
    const lossRate = totalQty > 0 ? (defective / totalQty) * 100 : 0;
    const preCoolCount = inventory.filter((i) => {
      const d = i.preCooledAt?.slice(0, 7);
      return d === currentMonth;
    }).length;

    return {
      totalQty: totalQty / 10000,
      gradeARate,
      preCoolCount,
      lossRate,
      gradeA,
      gradeB,
      gradeC,
      defective,
    };
  }, [monthlyHarvests, inventory, currentMonth]);

  const estimateRatio = useMemo(() => {
    const total = stats.gradeA + stats.gradeB + stats.gradeC + stats.defective;
    if (total === 0) return { A: 35, B: 40, C: 20, defective: 5 };
    return {
      A: (stats.gradeA / total) * 100,
      B: (stats.gradeB / total) * 100,
      C: (stats.gradeC / total) * 100,
      defective: (stats.defective / total) * 100,
    };
  }, [stats]);

  const pieData = useMemo(() => {
    const total = stats.gradeA + stats.gradeB + stats.gradeC + stats.defective;
    if (total === 0) {
      return [
        { name: 'A级', value: 35 },
        { name: 'B级', value: 40 },
        { name: 'C级', value: 20 },
        { name: '次品', value: 5 },
      ];
    }
    return [
      { name: 'A级', value: stats.gradeA },
      { name: 'B级', value: stats.gradeB },
      { name: 'C级', value: stats.gradeC },
      { name: '次品', value: stats.defective },
    ];
  }, [stats]);

  const trendData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months.map((m) => {
      const mh = harvests.filter((h) => h.harvestedAt.startsWith(m));
      const total = mh.reduce((s, h) => s + h.quantity, 0);
      const ab = mh.reduce((s, h) => s + h.gradeAQty + h.gradeBQty, 0);
      const rate = total > 0 ? +(((ab / total) * 100).toFixed(1)) : 0;
      const label = m.slice(5) + '月';
      return { month: label, rate };
    });
  }, [harvests]);

  const preCoolRecords: PreCoolRecord[] = useMemo(() => {
    return inventory.map((inv) => {
      const harvest = harvests.find((h) => h.id === inv.harvestId);
      return {
        ...inv,
        batchId: harvest?.batchId,
      } as PreCoolRecord;
    });
  }, [inventory, harvests]);

  const harvestLogs: HarvestLogRow[] = useMemo(() => {
    return [...harvests]
      .sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt))
      .slice(0, 15)
      .map((h) => {
        const f = fields.find((x) => x.id === h.fieldId);
        return {
          ...h,
          fieldName: f?.name,
          lossRate: h.quantity > 0 ? (h.defectiveQty / h.quantity) * 100 : 0,
        };
      });
  }, [harvests, fields]);

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBatchId(e.target.value);
  };

  const handleSubmit = () => {
    if (!batchId || !quantity || !staff) {
      showToast('请填写完整信息');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('请输入有效的采收数量');
      return;
    }
    const total = qty;
    const gradeAQty = Math.round(total * (estimateRatio.A / 100));
    const gradeBQty = Math.round(total * (estimateRatio.B / 100));
    const gradeCQty = Math.round(total * (estimateRatio.C / 100));
    const defectiveQty = Math.round(total * (estimateRatio.defective / 100));

    const newHarvest: Harvest = {
      id: `H${Date.now()}`,
      batchId,
      fieldId: selectedBatch?.fieldId || '',
      harvestedAt,
      quantity: total,
      staff,
      gradeAQty,
      gradeBQty,
      gradeCQty,
      defectiveQty,
    };
    addHarvest(newHarvest);

    const variety = selectedBatch?.variety || 'chrysanthemum';
    const now = new Date();
    const preCoolItems: Inventory[] = [];

    if (gradeAQty > 0) {
      preCoolItems.push({
        id: `INV-${Date.now()}-A`,
        harvestId: newHarvest.id,
        variety,
        grade: 'A',
        quantity: gradeAQty,
        preCooledAt: now.toISOString(),
        preCoolTemp: 2 + Math.random(),
        preCoolDuration: 4,
        preservative: PRESERVATIVES[Math.floor(Math.random() * PRESERVATIVES.length)],
        location: PRE_COOL_LOCATIONS[Math.floor(Math.random() * PRE_COOL_LOCATIONS.length)],
        status: 'precooling',
      });
    }
    if (gradeBQty > 0) {
      preCoolItems.push({
        id: `INV-${Date.now()}-B`,
        harvestId: newHarvest.id,
        variety,
        grade: 'B',
        quantity: gradeBQty,
        preCooledAt: now.toISOString(),
        preCoolTemp: 2.5 + Math.random(),
        preCoolDuration: 3,
        preservative: PRESERVATIVES[Math.floor(Math.random() * PRESERVATIVES.length)],
        location: PRE_COOL_LOCATIONS[Math.floor(Math.random() * PRE_COOL_LOCATIONS.length)],
        status: 'precooling',
      });
    }
    if (gradeCQty > 0) {
      preCoolItems.push({
        id: `INV-${Date.now()}-C`,
        harvestId: newHarvest.id,
        variety,
        grade: 'C',
        quantity: gradeCQty,
        preCooledAt: now.toISOString(),
        preCoolTemp: 3 + Math.random(),
        preCoolDuration: 2,
        preservative: PRESERVATIVES[Math.floor(Math.random() * PRESERVATIVES.length)],
        location: PRE_COOL_LOCATIONS[Math.floor(Math.random() * PRE_COOL_LOCATIONS.length)],
        status: 'precooling',
      });
    }

    if (preCoolItems.length > 0) {
      addInventoryItems(preCoolItems);
    }

    setQuantity('');
    setStaff('');
    setBatchId('');
    setCurrentStep(2);

    showToast(`采收登记成功！已自动生成 ${preCoolItems.length} 条预冷记录`);
  };

  const preCoolColumns = [
    { key: 'id', title: '记录编号' },
    {
      key: 'batchId',
      title: '关联批次',
      render: (row: PreCoolRecord) => row.batchId || '-',
    },
    {
      key: 'varietyGrade',
      title: '品种/等级',
      render: (row: PreCoolRecord) => (
        <div className="flex items-center gap-2">
          <span>{getStatusText(row.variety, 'variety')}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={{
              backgroundColor:
                row.grade === 'A'
                  ? '#e8b92320'
                  : row.grade === 'B'
                  ? '#94a3b820'
                  : '#cd7f3220',
              color:
                row.grade === 'A'
                  ? GRADE_COLORS.A
                  : row.grade === 'B'
                  ? GRADE_COLORS.B
                  : GRADE_COLORS.C,
            }}
          >
            {getStatusText(row.grade, 'grade')}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '数量',
      render: (row: PreCoolRecord) => `${formatNum(row.quantity)}枝`,
    },
    {
      key: 'preCoolTemp',
      title: '预冷温度(℃)',
      render: (row: PreCoolRecord) => `${row.preCoolTemp}℃`,
    },
    {
      key: 'preCoolDuration',
      title: '预冷时长(h)',
      render: (row: PreCoolRecord) => `${row.preCoolDuration}h`,
    },
    { key: 'preservative', title: '保鲜剂' },
    {
      key: 'preCooledAt',
      title: '入库时间',
      render: (row: PreCoolRecord) => formatDate(row.preCooledAt, 'YYYY-MM-DD HH:mm'),
    },
    { key: 'location', title: '库位' },
    {
      key: 'status',
      title: '状态',
      render: (row: PreCoolRecord) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            getStatusColor(row.status, 'inventory')
          )}
        >
          {getStatusText(row.status, 'inventory')}
        </span>
      ),
    },
  ];

  const harvestLogColumns = [
    { key: 'id', title: '采收编号' },
    {
      key: 'fieldName',
      title: '花田',
      render: (row: HarvestLogRow) => row.fieldName || '-',
    },
    { key: 'batchId', title: '批次' },
    {
      key: 'harvestedAt',
      title: '采收日期',
      render: (row: HarvestLogRow) => formatDate(row.harvestedAt),
    },
    {
      key: 'quantity',
      title: '采收量(枝)',
      render: (row: HarvestLogRow) => formatNum(row.quantity),
    },
    {
      key: 'gradeAQty',
      title: 'A级',
      render: (row: HarvestLogRow) => (
        <span style={{ color: GRADE_COLORS.A, fontWeight: 600 }}>
          {formatNum(row.gradeAQty)}
        </span>
      ),
    },
    {
      key: 'gradeBQty',
      title: 'B级',
      render: (row: HarvestLogRow) => (
        <span style={{ color: GRADE_COLORS.B, fontWeight: 600 }}>
          {formatNum(row.gradeBQty)}
        </span>
      ),
    },
    {
      key: 'gradeCQty',
      title: 'C级',
      render: (row: HarvestLogRow) => (
        <span style={{ color: GRADE_COLORS.C, fontWeight: 600 }}>
          {formatNum(row.gradeCQty)}
        </span>
      ),
    },
    {
      key: 'defectiveQty',
      title: '次品',
      render: (row: HarvestLogRow) => (
        <span style={{ color: GRADE_COLORS.defective, fontWeight: 600 }}>
          {formatNum(row.defectiveQty)}
        </span>
      ),
    },
    {
      key: 'lossRate',
      title: '损耗率',
      render: (row: HarvestLogRow) => formatPercent(row.lossRate || 0),
    },
    { key: 'staff', title: '采收人' },
  ];

  const GradeCard = ({
    grade,
    qty,
    total,
    color,
    label,
  }: {
    grade: string;
    qty: number;
    total: number;
    color: string;
    label: string;
  }) => {
    const rate = total > 0 ? (qty / total) * 100 : 0;
    return (
      <div
        className="card-base p-5 opacity-0 animate-fadeInUp"
        style={{
          animationDelay: grade === 'A' ? '100ms' : grade === 'B' ? '200ms' : '300ms',
          borderWidth: 2,
          borderColor: color,
          boxShadow: `0 2px 8px ${color}20`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Award className="w-4 h-4" style={{ color }} />
            </div>
            <span
              className="text-lg font-bold font-serif"
              style={{ color }}
            >
              {grade}级
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-cream-100 text-cream-600">
            {label}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-forest-900 font-serif">
              {formatNum(qty)}
            </span>
            <span className="text-sm text-cream-500">枝</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-cream-500">占比</span>
            <span className="text-sm font-semibold" style={{ color }}>
              {formatPercent(rate)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    );
  };

  const totalGradeQty = stats.gradeA + stats.gradeB + stats.gradeC + stats.defective;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between opacity-0 animate-fadeInUp">
        <div>
          <h1 className="text-2xl font-bold text-forest-900 font-serif tracking-wide flex items-center gap-3">
            <Scissors className="w-7 h-7 text-forest-600" />
            采后处理管理
          </h1>
          <p className="text-sm text-cream-600 mt-1">
            采收登记 → 品质分级 → 保鲜预冷 → 入库存储 全流程管理
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-cream-600">
          <Clock className="w-4 h-4" />
          <span>数据更新于 {formatDate(new Date(), 'YYYY-MM-DD HH:mm')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="本月采收量(万枝)"
          value={stats.totalQty.toFixed(2)}
          icon={Scissors}
          colorVariant="forest"
          trend="+12.5%"
          trendUp
          delay={100}
        />
        <StatCard
          title="A级品占比"
          value={formatPercent(stats.gradeARate)}
          icon={Award}
          colorVariant="chrysanthemum"
          trend="+3.2%"
          trendUp
          delay={200}
        />
        <StatCard
          title="预冷处理批次"
          value={formatNum(stats.preCoolCount)}
          icon={Thermometer}
          colorVariant="blue"
          trend="+8"
          trendUp
          delay={300}
        />
        <StatCard
          title="损耗率"
          value={formatPercent(stats.lossRate)}
          icon={Package}
          colorVariant="warning"
          trend="-1.1%"
          trendUp={false}
          delay={400}
        />
      </div>

      <div className="card-base p-6 opacity-0 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-forest-900 font-serif flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-forest-600" />
            采后处理流程
          </h2>
          <div className="flex gap-2">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-all',
                  currentStep === idx
                    ? 'bg-forest-500 text-white'
                    : 'bg-cream-100 text-cream-600 hover:bg-cream-200'
                )}
              >
                步骤{idx + 1}
              </button>
            ))}
          </div>
        </div>
        <StepsIndicator steps={STEPS} current={currentStep} />
      </div>

      <div
        className="card-base overflow-hidden opacity-0 animate-fadeInUp"
        style={{ animationDelay: '600ms' }}
      >
        <div
          className="flex items-center justify-between p-5 cursor-pointer hover:bg-cream-50/50 transition-colors"
          onClick={() => setFormExpanded(!formExpanded)}
        >
          <h2 className="text-lg font-bold text-forest-900 font-serif flex items-center gap-2">
            <Scissors className="w-5 h-5 text-forest-600" />
            采收登记
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream-500">
              {formExpanded ? '点击收起' : '点击展开'}
            </span>
            {formExpanded ? (
              <ChevronUp className="w-5 h-5 text-cream-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cream-400" />
            )}
          </div>
        </div>

        {formExpanded && (
          <div className="px-5 pb-5 border-t border-cream-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-700">
                  批次号 <span className="text-red-500">*</span>
                </label>
                <select
                  value={batchId}
                  onChange={handleBatchChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-cream-300 bg-white text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
                >
                  <option value="">请选择批次</option>
                  {batches.map((b: PlantingBatch) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.breed} ({b.season})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-700">
                  花田
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedField?.name || '请先选择批次'}
                  className="w-full px-4 py-2.5 rounded-lg border border-cream-300 bg-cream-50 text-forest-700 text-sm cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-700">
                  采收日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={harvestedAt}
                  onChange={(e) => setHarvestedAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-cream-300 bg-white text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-700">
                  采收数量(枝) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="请输入采收数量"
                  className="w-full px-4 py-2.5 rounded-lg border border-cream-300 bg-white text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-700">
                  采收人员 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400" />
                  <input
                    type="text"
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    placeholder="请输入采收人员姓名"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-cream-300 bg-white text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-cream-50 border border-cream-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-500" />
                  预估分级占比预览
                </span>
                <span className="text-xs text-cream-500">基于历史数据</span>
              </div>
              <div className="w-full h-8 rounded-lg overflow-hidden flex">
                <div
                  className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all"
                  style={{
                    width: `${estimateRatio.A}%`,
                    backgroundColor: GRADE_COLORS.A,
                  }}
                >
                  A级 {formatPercent(estimateRatio.A, 0)}
                </div>
                <div
                  className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all"
                  style={{
                    width: `${estimateRatio.B}%`,
                    backgroundColor: GRADE_COLORS.B,
                  }}
                >
                  B级 {formatPercent(estimateRatio.B, 0)}
                </div>
                <div
                  className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all"
                  style={{
                    width: `${estimateRatio.C}%`,
                    backgroundColor: GRADE_COLORS.C,
                  }}
                >
                  C级 {formatPercent(estimateRatio.C, 0)}
                </div>
                <div
                  className="h-full flex items-center justify-center text-xs font-semibold text-white transition-all"
                  style={{
                    width: `${estimateRatio.defective}%`,
                    backgroundColor: GRADE_COLORS.defective,
                  }}
                >
                  次品 {formatPercent(estimateRatio.defective, 0)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-forest-500 to-forest-700 text-white font-medium text-sm shadow-md hover:shadow-lg hover:from-forest-600 hover:to-forest-800 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                提交采收登记
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <GradeCard
            grade="A"
            qty={stats.gradeA}
            total={totalGradeQty}
            color={GRADE_COLORS.A}
            label="优级"
          />
          <GradeCard
            grade="B"
            qty={stats.gradeB}
            total={totalGradeQty}
            color={GRADE_COLORS.B}
            label="良级"
          />
          <GradeCard
            grade="C"
            qty={stats.gradeC}
            total={totalGradeQty}
            color={GRADE_COLORS.C}
            label="合格级"
          />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
            <h3 className="text-base font-bold text-forest-900 font-serif mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-forest-600" />
              本月分级占比
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            GRADE_COLORS.A,
                            GRADE_COLORS.B,
                            GRADE_COLORS.C,
                            GRADE_COLORS.defective,
                          ][index]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatNum(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #f1e8d8',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
            <h3 className="text-base font-bold text-forest-900 font-serif mb-4 flex items-center gap-2">
              <TrendingUpIcon />
              分级合格率趋势
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1e8d8" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#8b7355' }}
                    axisLine={{ stroke: '#e5d8c5' }}
                    tickLine={{ stroke: '#e5d8c5' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8b7355' }}
                    axisLine={{ stroke: '#e5d8c5' }}
                    tickLine={{ stroke: '#e5d8c5' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #f1e8d8',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="A+B级合计占比"
                    stroke="#2d6a4f"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2d6a4f', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '700ms' }}>
        <h2 className="text-lg font-bold text-forest-900 font-serif mb-5 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-forest-600" />
          保鲜预冷记录
        </h2>
        <DataTable
          columns={preCoolColumns}
          data={preCoolRecords}
          rowKey="id"
          emptyText="暂无预冷记录"
        />
      </div>

      <div className="card-base p-5 opacity-0 animate-fadeInUp" style={{ animationDelay: '800ms' }}>
        <h2 className="text-lg font-bold text-forest-900 font-serif mb-5 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-forest-600" />
          近期采收日志（最近15条）
        </h2>
        <DataTable
          columns={harvestLogColumns}
          data={harvestLogs}
          rowKey="id"
          emptyText="暂无采收记录"
        />
      </div>

      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
          <div className="bg-forest-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-forest-600"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
