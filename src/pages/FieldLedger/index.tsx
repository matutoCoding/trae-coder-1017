import { useMemo, useState } from 'react';
import {
  MapPin,
  Ruler,
  Leaf,
  Sprout,
  Calendar,
  Bug,
  Search,
  Filter,
  Flower2,
  Trees,
  Eye,
  Edit3,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { useAppStore } from '@/store';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatNum, getStatusText, getStatusColor } from '@/utils/format';
import type { Field, PlantingBatch, Harvest } from '@/types';

interface TrendPoint {
  month: string;
  yield: number;
}

interface PlantingHistoryItem {
  batchId: string;
  variety: string;
  breed: string;
  plantedAt: string;
  harvestedAt: string;
  yield: number;
}

interface FieldExt extends Field {
  miniTrend?: TrendPoint[];
  plantingHistory?: PlantingHistoryItem[];
}

interface BatchExt extends PlantingBatch {}

type StatusTab = 'all' | 'growing' | 'harvesting' | 'idle' | 'fallow';
type VarietyFilter = 'all' | 'chrysanthemum' | 'lily';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'growing', label: '生长中' },
  { key: 'harvesting', label: '采收中' },
  { key: 'idle', label: '空闲' },
  { key: 'fallow', label: '休耕' },
];

const VARIETY_OPTIONS: { key: VarietyFilter; label: string }[] = [
  { key: 'all', label: '全部品种' },
  { key: 'chrysanthemum', label: '菊花' },
  { key: 'lily', label: '百合' },
];

function calcGrowthPercent(plantedAt?: string, harvestAt?: string): number {
  if (!plantedAt || !harvestAt) return 0;
  const start = new Date(plantedAt).getTime();
  const end = new Date(harvestAt).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
}

function getAreaCode(location: string): string {
  const match = location.match(/([东南西北中]片区)/);
  return match ? match[1] : '其他';
}

export default function FieldLedger() {
  const fields = useAppStore((s) => s.fields) as FieldExt[];
  const batches = useAppStore((s) => s.batches) as BatchExt[];
  const harvests = useAppStore((s) => s.harvests) as Harvest[];

  const [search, setSearch] = useState('');
  const [varietyFilter, setVarietyFilter] = useState<VarietyFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');

  const totalFields = fields.length;
  const growingArea = useMemo(
    () =>
      fields
        .filter((f) => f.status === 'growing' || f.status === 'harvesting')
        .reduce((sum, f) => sum + f.area, 0),
    [fields],
  );

  const nextMonthYield = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);
    return batches
      .filter((b) => b.expectedHarvestAt.startsWith(nextMonthStr))
      .reduce((sum, b) => sum + b.forecastYield, 0);
  }, [batches]);

  const fallowCount = fields.filter((f) => f.status === 'fallow').length;

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      if (statusTab !== 'all' && f.status !== statusTab) return false;
      if (varietyFilter !== 'all' && f.mainVariety !== varietyFilter) return false;
      if (search.trim()) {
        const kw = search.trim().toLowerCase();
        if (
          !f.name.toLowerCase().includes(kw) &&
          !f.code.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [fields, statusTab, varietyFilter, search]);

  const varietyStats = useMemo(() => {
    const calc = (variety: 'chrysanthemum' | 'lily') => {
      const vFields = fields.filter((f) => f.mainVariety === variety);
      const vBatches = batches.filter((b) => b.variety === variety);
      const areaMap = new Map<string, number>();
      vFields.forEach((f) => {
        const code = getAreaCode(f.location);
        areaMap.set(code, (areaMap.get(code) || 0) + f.area);
      });
      const areas = Array.from(areaMap.entries()).map(([name, area]) => ({
        name,
        area,
      }));
      const batchCount = vBatches.filter(
        (b) => b.status === 'planted' || b.status === 'growing' || b.status === 'ready' || b.status === 'harvesting',
      ).length;
      const forecast = vBatches
        .filter((b) => b.status !== 'completed' && b.status !== 'harvested')
        .reduce((sum, b) => sum + b.forecastYield, 0);
      return { areas, batchCount, forecast };
    };
    return {
      chrysanthemum: calc('chrysanthemum'),
      lily: calc('lily'),
    };
  }, [fields, batches]);

  const historyRows = useMemo(() => {
    type Row = {
      id: string;
      fieldName: string;
      variety: string;
      breed: string;
      batchId: string;
      plantedAt: string;
      harvestedAt: string;
      actualYield: number;
      pestNote: string;
      rotationDays: number;
    };
    const rows: Row[] = [];
    fields.forEach((f) => {
      const ph = f.plantingHistory || [];
      ph.forEach((h, idx) => {
        const next = ph[idx - 1];
        const rotationDays = next
          ? Math.max(
              0,
              Math.round(
                (new Date(h.plantedAt).getTime() - new Date(next.harvestedAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0;
        rows.push({
          id: `${f.id}-${h.batchId}`,
          fieldName: f.name,
          variety: h.variety,
          breed: h.breed,
          batchId: h.batchId,
          plantedAt: h.plantedAt,
          harvestedAt: h.harvestedAt,
          actualYield: h.yield,
          pestNote: Math.random() > 0.7 ? '轻微蚜虫' : Math.random() > 0.85 ? '霜霉病防治' : '无',
          rotationDays,
        });
      });
    });
    return rows
      .sort((a, b) => new Date(b.harvestedAt).getTime() - new Date(a.harvestedAt).getTime())
      .slice(0, 20);
  }, [fields]);

  const historyColumns = [
    {
      key: 'fieldName',
      title: '花田名称',
    },
    {
      key: 'variety',
      title: '品种',
      render: (row: any) => (
        <span className="badge bg-cream-100 text-forest-700">
          {getStatusText(row.variety, 'variety')}
        </span>
      ),
    },
    {
      key: 'breed',
      title: '批次',
      render: (row: any) => (
        <span className="text-xs text-forest-600">
          {row.breed} · {row.batchId}
        </span>
      ),
    },
    {
      key: 'plantedAt',
      title: '定植日期',
      render: (row: any) => formatDate(row.plantedAt),
    },
    {
      key: 'harvestedAt',
      title: '采收日期',
      render: (row: any) => formatDate(row.harvestedAt),
    },
    {
      key: 'actualYield',
      title: '实产(万枝)',
      render: (row: any) => (
        <span className="font-semibold text-forest-800">
          {formatNum((row.actualYield / 10000).toFixed(1))}
        </span>
      ),
    },
    {
      key: 'pestNote',
      title: '病虫害记录',
      render: (row: any) =>
        row.pestNote === '无' ? (
          <span className="text-forest-500">—</span>
        ) : (
          <span className="text-warning-600 flex items-center gap-1">
            <Bug className="w-3.5 h-3.5" />
            {row.pestNote}
          </span>
        ),
    },
    {
      key: 'rotationDays',
      title: '轮作间隔',
      render: (row: any) =>
        row.rotationDays > 0 ? (
          <span
            className={`badge ${
              row.rotationDays >= 14
                ? 'bg-green-100 text-green-700'
                : row.rotationDays >= 7
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {row.rotationDays}天
          </span>
        ) : (
          <span className="text-cream-500">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="花田总数"
          value={`${totalFields} 块`}
          icon={Flower2}
          trend={`${growingArea.toFixed(0)} 亩在种`}
          trendUp
          colorVariant="forest"
          delay={0}
        />
        <StatCard
          title="种植中面积"
          value={`${growingArea.toFixed(0)} 亩`}
          icon={Ruler}
          trend="占比 68%"
          trendUp
          colorVariant="chrysanthemum"
          delay={60}
        />
        <StatCard
          title="预计下月产量"
          value={`${(nextMonthYield / 10000).toFixed(1)} 万枝`}
          icon={Sprout}
          trend="同比 +12.5%"
          trendUp
          colorVariant="blue"
          delay={120}
        />
        <StatCard
          title="休耕花田数"
          value={`${fallowCount} 块`}
          icon={Trees}
          trend="土壤修复中"
          trendUp={false}
          colorVariant="warning"
          delay={180}
        />
      </div>

      <div className="card-base p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-500" />
            <input
              type="text"
              placeholder="搜索花田名称 / 编号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-forest-600" />
            <select
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value as VarietyFilter)}
              className="input-base w-auto min-w-[140px]"
            >
              {VARIETY_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-b border-cream-200 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
                statusTab === tab.key
                  ? 'border-forest-500 text-forest-700 bg-forest-50/50'
                  : 'border-transparent text-forest-500 hover:text-forest-700 hover:bg-cream-50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">
                (
                {tab.key === 'all'
                  ? fields.length
                  : fields.filter((f) => f.status === tab.key).length}
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFields.map((f, idx) => {
          const growth = calcGrowthPercent(f.plantedAt, f.harvestAt);
          const trend = f.miniTrend || [];
          return (
            <div
              key={f.id}
              className="card-base card-hover overflow-hidden opacity-0 animate-fadeInUp"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="p-5 border-b border-cream-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-forest-100 text-forest-700 font-mono">
                      {f.code}
                    </span>
                    <span className={`badge ${getStatusColor(f.status, 'field')}`}>
                      {getStatusText(f.status, 'field')}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-forest-900 font-serif flex items-center gap-2">
                  <Leaf
                    className={`w-4 h-4 ${
                      f.mainVariety === 'chrysanthemum'
                        ? 'text-chrysanthemum-500'
                        : 'text-forest-500'
                    }`}
                  />
                  {f.name}
                  <span className="text-xs font-normal text-forest-500 ml-1">
                    · {getStatusText(f.mainVariety, 'variety')}
                  </span>
                </h3>
              </div>

              <div className="p-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-forest-600">
                  <MapPin className="w-4 h-4 text-forest-400 flex-shrink-0" />
                  <span>{f.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-forest-600">
                    <Ruler className="w-4 h-4 text-forest-400 flex-shrink-0" />
                    <span>
                      <span className="font-semibold text-forest-800">{f.area}</span> 亩
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-forest-600">
                    <Sprout className="w-4 h-4 text-forest-400 flex-shrink-0" />
                    <span>{f.soilType}</span>
                  </div>
                </div>

                {(f.status === 'growing' || f.status === 'harvesting') && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-forest-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(f.plantedAt)} ~ {formatDate(f.harvestAt)}
                      </span>
                      <span className="font-semibold text-forest-700">{growth}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-bar ${
                          growth >= 90
                            ? '!bg-chrysanthemum-500'
                            : growth >= 60
                              ? '!bg-forest-400'
                              : ''
                        }`}
                        style={{ width: `${growth}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-cream-50/60 border-t border-b border-cream-100">
                <p className="text-xs text-forest-500 mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  近12个月产量趋势
                </p>
                <div className="h-20 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${f.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={
                              f.mainVariety === 'chrysanthemum' ? '#e8b923' : '#2d7750'
                            }
                            stopOpacity={0.25}
                          />
                          <stop offset="95%" stopColor="#e8b923" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid #e6dfcd',
                        }}
                        formatter={(val: number) => [`${formatNum(val)}枝`, '产量']}
                        labelFormatter={(l) => `月份: ${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="yield"
                        stroke={f.mainVariety === 'chrysanthemum' ? '#e8b923' : '#2d7750'}
                        strokeWidth={2}
                        fill={`url(#grad-${f.id})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-2">
                <button className="btn-secondary flex-1 !py-2 !px-3 text-xs">
                  <Eye className="w-4 h-4" />
                  详情
                </button>
                <button className="btn-secondary flex-1 !py-2 !px-3 text-xs">
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
                <button className="btn-primary flex-1 !py-2 !px-3 text-xs">
                  <BookOpen className="w-4 h-4" />
                  种植记录
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-base p-5">
          <h2 className="section-title mb-4">
            <Flower2 className="w-5 h-5 text-chrysanthemum-500" />
            菊花分区统计
          </h2>
          <div className="space-y-3">
            {varietyStats.chrysanthemum.areas.length === 0 ? (
              <p className="text-sm text-cream-500 py-6 text-center">暂无数据</p>
            ) : (
              varietyStats.chrysanthemum.areas.map((a, i) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-cream-50 hover:bg-cream-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-chrysanthemum-400/20 flex items-center justify-center text-chrysanthemum-600 font-semibold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-forest-800">{a.name}</p>
                      <p className="text-xs text-forest-500">菊花主产区</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-forest-900 font-serif">
                      {a.area}
                      <span className="text-sm font-normal text-forest-500 ml-1">亩</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-cream-200">
            <div className="p-4 rounded-lg bg-forest-50/60">
              <p className="text-xs text-forest-500 mb-1">种植批次</p>
              <p className="text-2xl font-bold text-forest-800 font-serif">
                {varietyStats.chrysanthemum.batchCount}
                <span className="text-sm font-normal text-forest-500 ml-1">批</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-chrysanthemum-400/10">
              <p className="text-xs text-forest-500 mb-1">预估产量</p>
              <p className="text-2xl font-bold text-chrysanthemum-600 font-serif">
                {(varietyStats.chrysanthemum.forecast / 10000).toFixed(1)}
                <span className="text-sm font-normal text-forest-500 ml-1">万枝</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <h2 className="section-title mb-4">
            <Trees className="w-5 h-5 text-forest-500" />
            百合分区统计
          </h2>
          <div className="space-y-3">
            {varietyStats.lily.areas.length === 0 ? (
              <p className="text-sm text-cream-500 py-6 text-center">暂无数据</p>
            ) : (
              varietyStats.lily.areas.map((a, i) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-cream-50 hover:bg-cream-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center text-forest-600 font-semibold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-forest-800">{a.name}</p>
                      <p className="text-xs text-forest-500">百合主产区</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-forest-900 font-serif">
                      {a.area}
                      <span className="text-sm font-normal text-forest-500 ml-1">亩</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-cream-200">
            <div className="p-4 rounded-lg bg-forest-50/60">
              <p className="text-xs text-forest-500 mb-1">种植批次</p>
              <p className="text-2xl font-bold text-forest-800 font-serif">
                {varietyStats.lily.batchCount}
                <span className="text-sm font-normal text-forest-500 ml-1">批</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-lily-100">
              <p className="text-xs text-forest-500 mb-1">预估产量</p>
              <p className="text-2xl font-bold text-forest-700 font-serif">
                {(varietyStats.lily.forecast / 10000).toFixed(1)}
                <span className="text-sm font-normal text-forest-500 ml-1">万枝</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h2 className="section-title mb-4">
          <Calendar className="w-5 h-5 text-forest-500" />
          种植历史追溯
          <span className="text-xs font-normal text-forest-500 ml-2">（最近 20 条）</span>
        </h2>
        <DataTable
          columns={historyColumns as any}
          data={historyRows}
          rowKey="id"
          emptyText="暂无种植历史数据"
        />
      </div>
    </div>
  );
}
