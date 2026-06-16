import { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Sun,
  Snowflake,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { useAppStore } from '@/store';
import type { PlantingBatch } from '@/types';
import {
  formatDate,
  formatNum,
  getStatusText,
  getStatusColor,
  formatPercent,
  getDaysBetween,
  addDays,
} from '@/utils/format';

const CHRYSANTHEMUM_COLOR = '#e8b923';
const LILY_COLOR = '#4d946c';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

function PlantingSchedule() {
  const { batches, fields, festivalPredictions } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [viewMode] = useState<'month' | 'week'>('month');

  const todayStr = formatDate(new Date(), 'YYYY-MM-DD');
  const currentYear = new Date().getFullYear();
  const currentMonthStr = formatDate(currentMonth, 'YYYY-MM');

  const stats = useMemo(() => {
    const yearStart = `${currentYear}-01-01`;
    const yearPlantedBatches = batches.filter((b) => b.plantedAt >= yearStart);

    const growingStatuses = ['planted', 'growing', 'ready', 'harvesting'];
    const growingBatches = batches.filter((b) => growingStatuses.includes(b.status));

    const monthStart = formatDate(new Date(), 'YYYY-MM');
    const monthHarvestBatches = batches.filter((b) =>
      b.expectedHarvestAt.startsWith(monthStart)
    );

    const peakSeasons = ['清明高峰', '冬至高峰'];
    const peakPlantedArea = batches
      .filter((b) => peakSeasons.includes(b.season))
      .reduce((sum, b) => sum + b.area, 0);
    const totalArea = batches.reduce((sum, b) => sum + b.area, 0);
    const staggerCoverage = totalArea > 0 ? (peakPlantedArea / totalArea) * 100 : 0;

    return {
      yearPlantedCount: yearPlantedBatches.length,
      growingCount: growingBatches.length,
      monthHarvestCount: monthHarvestBatches.length,
      staggerCoverage,
    };
  }, [batches, currentYear]);

  const festivalCards = useMemo(() => {
    const qingming = festivalPredictions.find((f) => f.festival === '清明节');
    const dongzhi = festivalPredictions.find((f) => f.festival === '冬至');

    const calcFestival = (festival: any) => {
      if (!festival) return null;
      const daysTo = getDaysBetween(todayStr, festival.date);
      const relatedBatches = batches.filter((b) => {
        const harvest = new Date(b.expectedHarvestAt);
        const fest = new Date(festival.date);
        const diff = (fest.getTime() - harvest.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= -10 && diff <= 20;
      });
      const availableSupply = relatedBatches.reduce((sum, b) => sum + b.forecastYield, 0);
      const demand = festival.demandForecast;
      const gap = demand - availableSupply;
      const progress = Math.min((availableSupply / demand) * 100, 100);
      const advice = festival.varieties?.[0]
        ? `需在${formatDate(festival.plantingWindow?.start, 'M月D日')}前定植${festival.varieties[0].suggestedBreed}${festival.varieties[0].area}亩`
        : '';
      return {
        ...festival,
        daysTo,
        availableSupply,
        demand,
        gap,
        progress,
        advice,
      };
    };

    return {
      qingming: calcFestival(qingming),
      dongzhi: calcFestival(dongzhi),
    };
  }, [batches, festivalPredictions, todayStr]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const days: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: Array<{ type: 'plant' | 'harvest'; variety: string; batchId: string }>;
    }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(year, month - 1, d);
      const dateStr = formatDate(dateObj, 'YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: getDayEvents(dateStr),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatDate(dateObj, 'YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: getDayEvents(dateStr),
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const dateStr = formatDate(dateObj, 'YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: getDayEvents(dateStr),
      });
    }

    return days;
  }, [currentMonth, batches, todayStr]);

  function getDayEvents(dateStr: string) {
    const events: Array<{
      type: 'plant' | 'harvest';
      variety: string;
      batchId: string;
    }> = [];
    batches.forEach((b) => {
      if (b.plantedAt === dateStr) {
        events.push({ type: 'plant', variety: b.variety, batchId: b.id });
      }
      if (b.expectedHarvestAt === dateStr) {
        events.push({ type: 'harvest', variety: b.variety, batchId: b.id });
      }
    });
    return events;
  }

  const ganttData = useMemo(() => {
    const months: string[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(currentYear, m, 1);
      months.push(formatDate(d, 'YYYY-MM'));
    }

    const monthlyYield = months.map((m) => {
      const yieldChrysanthemum = batches
        .filter((b) => b.variety === 'chrysanthemum' && b.expectedHarvestAt.startsWith(m))
        .reduce((sum, b) => sum + b.forecastYield, 0);
      const yieldLily = batches
        .filter((b) => b.variety === 'lily' && b.expectedHarvestAt.startsWith(m))
        .reduce((sum, b) => sum + b.forecastYield, 0);
      return {
        month: m.slice(5) + '月',
        monthKey: m,
        菊花: Math.round(yieldChrysanthemum / 10000),
        百合: Math.round(yieldLily / 10000),
        总产量: Math.round((yieldChrysanthemum + yieldLily) / 10000),
      };
    });

    return monthlyYield;
  }, [batches, currentYear]);

  const ganttBars = useMemo(() => {
    return batches.slice(0, 15).map((b) => {
      const field = fields.find((f) => f.id === b.fieldId);
      const plantMonth = parseInt(b.plantedAt.slice(5, 7), 10) - 1;
      const harvestMonth = parseInt(b.expectedHarvestAt.slice(5, 7), 10) - 1;
      const plantDay = parseInt(b.plantedAt.slice(8, 10), 10);
      const harvestDay = parseInt(b.expectedHarvestAt.slice(8, 10), 10);
      const daysInMonth = 30;
      const start = plantMonth + plantDay / daysInMonth;
      const end = harvestMonth + harvestDay / daysInMonth;
      return {
        ...b,
        fieldName: field?.name || '',
        start,
        width: Math.max(end - start, 0.3),
      };
    });
  }, [batches, fields]);

  const festivalMonthIndices = useMemo(() => {
    const qingming = festivalPredictions.find((f) => f.festival === '清明节');
    const dongzhi = festivalPredictions.find((f) => f.festival === '冬至');
    return {
      qingming: qingming ? parseInt(qingming.date.slice(5, 7), 10) - 1 : null,
      dongzhi: dongzhi ? parseInt(dongzhi.date.slice(5, 7), 10) - 1 : null,
    };
  }, [festivalPredictions]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const columns = [
    {
      key: 'id',
      title: '批次号',
      render: (row: PlantingBatch) => (
        <span className="font-mono text-forest-700">{row.id}</span>
      ),
    },
    {
      key: 'variety',
      title: '品种',
      render: (row: PlantingBatch) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: row.variety === 'chrysanthemum' ? CHRYSANTHEMUM_COLOR : LILY_COLOR,
            }}
          />
          <span>{getStatusText(row.variety, 'variety')}</span>
        </div>
      ),
    },
    { key: 'breed', title: '具体品种' },
    {
      key: 'fieldId',
      title: '花田',
      render: (row: PlantingBatch) => {
        const field = fields.find((f) => f.id === row.fieldId);
        return field ? field.name : row.fieldId;
      },
    },
    {
      key: 'area',
      title: '面积(亩)',
      render: (row: PlantingBatch) => formatNum(row.area),
    },
    {
      key: 'plantedAt',
      title: '定植日期',
      render: (row: PlantingBatch) => formatDate(row.plantedAt),
    },
    {
      key: 'expectedHarvestAt',
      title: '预计采收',
      render: (row: PlantingBatch) => formatDate(row.expectedHarvestAt),
    },
    {
      key: 'forecastYield',
      title: '预估产量(枝)',
      render: (row: PlantingBatch) => formatNum(row.forecastYield),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: PlantingBatch) => (
        <span className={`badge ${getStatusColor(row.status, 'batch')}`}>
          {getStatusText(row.status, 'batch')}
        </span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      render: () => (
        <button className="btn-secondary !py-1.5 !px-3 text-xs">
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
      ),
    },
  ];

  const monthTitle = formatDate(currentMonth, 'YYYY年M月');

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="本年定植批次"
          value={`${stats.yearPlantedCount} 批`}
          icon={Calendar}
          trend="同比+15%"
          trendUp
          colorVariant="forest"
          delay={0}
        />
        <StatCard
          title="在养批次(种植中)"
          value={`${stats.growingCount} 批`}
          icon={TrendingUp}
          trend="占比65%"
          trendUp
          colorVariant="chrysanthemum"
          delay={80}
        />
        <StatCard
          title="本月采收批次"
          value={`${stats.monthHarvestCount} 批`}
          icon={Sun}
          trend="预计180万枝"
          trendUp
          colorVariant="blue"
          delay={160}
        />
        <StatCard
          title="错峰覆盖率"
          value={formatPercent(stats.staggerCoverage, 0)}
          icon={Snowflake}
          trend="高峰充足"
          trendUp
          colorVariant="warning"
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {festivalCards.qingming && (
          <div
            className="card-base p-5 opacity-0 animate-fadeInUp"
            style={{ animationDelay: '320ms' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-md">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-forest-900 font-serif">
                    {festivalCards.qingming.festival}
                  </h3>
                  <p className="text-sm text-cream-500">
                    {formatDate(festivalCards.qingming.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-serif text-warning-600">
                  {festivalCards.qingming.daysTo}
                </p>
                <p className="text-xs text-cream-500">天后</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-forest-600">
                  可供应 {formatNum(Math.round(festivalCards.qingming.availableSupply / 10000))} 万枝
                </span>
                <span className="text-cream-500">
                  需求 {formatNum(Math.round(festivalCards.qingming.demand / 10000))} 万枝
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${festivalCards.qingming.progress}%`,
                    backgroundColor:
                      festivalCards.qingming.gap > 0 ? '#ef4444' : CHRYSANTHEMUM_COLOR,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`badge ${
                  festivalCards.qingming.gap > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {festivalCards.qingming.gap > 0
                  ? `缺口 ${formatNum(Math.round(festivalCards.qingming.gap / 10000))} 万枝`
                  : '供应充足'}
              </span>
              <p className="text-xs text-forest-600 max-w-[60%] text-right">
                {festivalCards.qingming.advice}
              </p>
            </div>
          </div>
        )}

        {festivalCards.dongzhi && (
          <div
            className="card-base p-5 opacity-0 animate-fadeInUp"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-md">
                  <Snowflake className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-forest-900 font-serif">
                    {festivalCards.dongzhi.festival}
                  </h3>
                  <p className="text-sm text-cream-500">
                    {formatDate(festivalCards.dongzhi.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-serif text-sky-600">
                  {festivalCards.dongzhi.daysTo}
                </p>
                <p className="text-xs text-cream-500">天后</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-forest-600">
                  可供应 {formatNum(Math.round(festivalCards.dongzhi.availableSupply / 10000))} 万枝
                </span>
                <span className="text-cream-500">
                  需求 {formatNum(Math.round(festivalCards.dongzhi.demand / 10000))} 万枝
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${festivalCards.dongzhi.progress}%`,
                    backgroundColor:
                      festivalCards.dongzhi.gap > 0 ? '#ef4444' : LILY_COLOR,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`badge ${
                  festivalCards.dongzhi.gap > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {festivalCards.dongzhi.gap > 0
                  ? `缺口 ${formatNum(Math.round(festivalCards.dongzhi.gap / 10000))} 万枝`
                  : '供应充足'}
              </span>
              <p className="text-xs text-forest-600 max-w-[60%] text-right">
                {festivalCards.dongzhi.advice}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className="card-base p-5 opacity-0 animate-fadeInUp"
        style={{ animationDelay: '480ms' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-forest-600" />
            <h2 className="section-title !mb-0">错峰种植日历</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-cream-100 rounded-lg p-0.5">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-forest-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-medium text-forest-900 min-w-[100px] text-center">
                {monthTitle}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white text-forest-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-cream-100 rounded-lg p-0.5">
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-forest-700 shadow-sm'
                    : 'text-cream-500 hover:text-forest-700'
                }`}
              >
                月视图
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-forest-700 shadow-sm'
                    : 'text-cream-500 hover:text-forest-700'
                }`}
              >
                周视图
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-semibold py-2 ${
                i === 0 || i === 6 ? 'text-warning-500' : 'text-forest-600'
              }`}
            >
              周{d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell) => (
            <div
              key={cell.date}
              className={`
                min-h-[80px] p-1.5 rounded-lg border transition-all
                ${cell.isCurrentMonth ? 'bg-white border-cream-200' : 'bg-cream-50/50 border-transparent'}
                ${cell.isToday ? 'ring-2 ring-forest-500 border-forest-500' : ''}
                hover:border-forest-300
              `}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  cell.isToday
                    ? 'text-forest-600 font-bold'
                    : cell.isCurrentMonth
                    ? 'text-forest-700'
                    : 'text-cream-400'
                }`}
              >
                {cell.day}
              </div>
              <div className="space-y-1">
                {cell.events.slice(0, 2).map((ev, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] px-1 py-0.5 rounded text-white truncate flex items-center gap-1"
                    style={{
                      backgroundColor:
                        ev.variety === 'chrysanthemum' ? CHRYSANTHEMUM_COLOR : LILY_COLOR,
                    }}
                  >
                    <span>{ev.type === 'plant' ? '🌱' : '✂️'}</span>
                    <span className="truncate">
                      {ev.type === 'plant' ? '定植' : '采收'}
                    </span>
                  </div>
                ))}
                {cell.events.length > 2 && (
                  <div className="text-[10px] text-cream-500 pl-1">
                    +{cell.events.length - 2} 更多
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-cream-200">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: CHRYSANTHEMUM_COLOR }}
            />
            <span className="text-xs text-forest-600">菊花</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: LILY_COLOR }} />
            <span className="text-xs text-forest-600">百合</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🌱</span>
            <span className="text-xs text-forest-600">定植</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">✂️</span>
            <span className="text-xs text-forest-600">采收</span>
          </div>
        </div>
      </div>

      <div
        className="card-base p-5 opacity-0 animate-fadeInUp"
        style={{ animationDelay: '560ms' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-forest-600" />
          <h2 className="section-title !mb-0">年度排期甘特图</h2>
          <span className="text-xs text-cream-500 ml-2">
            （{currentYear}年度 · 含产量预估）
          </span>
        </div>

        <div className="mb-5 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[200px_1fr] gap-0">
              <div className="text-xs font-semibold text-forest-600 py-2 pr-3 border-b border-cream-200">
                批次 / 花田
              </div>
              <div className="grid grid-cols-12 border-b border-cream-200">
                {ganttData.map((m) => (
                  <div
                    key={m.month}
                    className="text-xs font-semibold text-forest-600 py-2 text-center border-l border-cream-100 relative"
                  >
                    {m.month}
                    {festivalMonthIndices.qingming === ganttData.indexOf(m) && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-warning-500/50"
                        style={{ left: '50%' }}
                      />
                    )}
                    {festivalMonthIndices.dongzhi === ganttData.indexOf(m) && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-sky-500/50"
                        style={{ left: '50%' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {ganttBars.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-[200px_1fr] gap-0 border-b border-cream-100 hover:bg-cream-50/50 transition-colors"
              >
                <div className="py-3 pr-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-forest-800">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          b.variety === 'chrysanthemum' ? CHRYSANTHEMUM_COLOR : LILY_COLOR,
                      }}
                    />
                    <span className="font-mono">{b.id}</span>
                    <span>{b.breed}</span>
                  </div>
                  <div className="text-[11px] text-cream-500 mt-0.5 truncate">
                    {b.fieldName}
                  </div>
                </div>
                <div className="relative py-3">
                  <div className="absolute inset-0 grid grid-cols-12">
                    {ganttData.map((_, i) => (
                      <div
                        key={i}
                        className="border-l border-cream-100 last:border-r"
                      />
                    ))}
                  </div>
                  <div
                    className="absolute h-6 rounded-md shadow-sm transition-all hover:h-7 hover:shadow-md flex items-center"
                    style={{
                      left: `${(b.start / 12) * 100}%`,
                      width: `${(b.width / 12) * 100}%`,
                      minWidth: '30px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor:
                        b.variety === 'chrysanthemum' ? CHRYSANTHEMUM_COLOR : LILY_COLOR,
                      opacity: 0.9,
                    }}
                    title={`${b.id} · ${formatDate(b.plantedAt)} ~ ${formatDate(b.expectedHarvestAt)}`}
                  >
                    <span className="text-[10px] text-white/90 px-1.5 truncate w-full text-center font-medium">
                      {formatNum(b.area)}亩
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream-200 pt-4">
          <h3 className="text-sm font-semibold text-forest-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            月度预估产量趋势（万枝）
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ganttData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#1f5d3d' }}
                  axisLine={{ stroke: '#d8cdb4' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#1f5d3d' }}
                  axisLine={{ stroke: '#d8cdb4' }}
                  tickLine={false}
                  label={{ value: '分类产量', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#7db694' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#1f5d3d' }}
                  axisLine={{ stroke: '#d8cdb4' }}
                  tickLine={false}
                  label={{ value: '总产量', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#7db694' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #f0ebe0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(31,77,58,0.1)',
                  }}
                  labelStyle={{ color: '#1a4a32', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {festivalMonthIndices.qingming !== null && (
                  <ReferenceLine
                    x={`${festivalMonthIndices.qingming + 1}月`}
                    yAxisId="left"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{ value: '清明', position: 'top', fill: '#ef4444', fontSize: 11 }}
                  />
                )}
                {festivalMonthIndices.dongzhi !== null && (
                  <ReferenceLine
                    x={`${festivalMonthIndices.dongzhi + 1}月`}
                    yAxisId="left"
                    stroke="#0284c7"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{ value: '冬至', position: 'top', fill: '#0284c7', fontSize: 11 }}
                  />
                )}
                <Bar yAxisId="left" dataKey="菊花" fill={CHRYSANTHEMUM_COLOR} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="百合" fill={LILY_COLOR} radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="总产量"
                  stroke="#2d7750"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2d7750', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        className="card-base p-5 opacity-0 animate-fadeInUp"
        style={{ animationDelay: '640ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-forest-600" />
            <h2 className="section-title !mb-0">种植批次详情</h2>
            <span className="text-xs text-cream-500 ml-2">共 {batches.length} 条记录</span>
          </div>
        </div>
        <DataTable<PlantingBatch>
          columns={columns}
          data={batches}
          rowKey="id"
          emptyText="暂无种植批次"
        />
      </div>
    </div>
  );
}

export default PlantingSchedule;
