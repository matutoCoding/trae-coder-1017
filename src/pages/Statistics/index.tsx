import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { DataTable } from '@/components/ui/DataTable';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Leaf,
  Target,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Label,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

type TimeRange = 'month' | 'quarter' | 'year' | 'custom';

const COLORS = {
  chrysanthemum: '#e8b923',
  lily: '#4d946c',
  loss: '#c0392b',
  inventoryBlue: '#3b82f6',
  forestDark: '#123222',
  cream: '#e6dfcd',
};

const LOSS_COLORS = ['#4d946c', '#e8b923', '#f59e0b', '#3b82f6', '#c0392b'];

interface BigScreenCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  gradient: string;
  accent: string;
  trend?: { value: string; up: boolean };
  miniData: { name: string; value: number }[];
  delay: number;
}

function BigScreenStatCard({
  title,
  value,
  unit,
  icon: Icon,
  gradient,
  accent,
  trend,
  miniData,
  delay,
}: BigScreenCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 opacity-0 animate-fadeInUp shadow-xl"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: `${accent}22` }}
            >
              <Icon className="w-6 h-6" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium">{title}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className="text-3xl font-bold font-serif tracking-wide"
                  style={{ color: accent }}
                >
                  {value}
                </span>
                {unit && (
                  <span className="text-sm text-white/70 font-medium">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm',
                trend.up
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              )}
            >
              {trend.up ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div className="h-14 -mx-1 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={miniData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`mini-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accent}
                strokeWidth={2}
                fill={`url(#mini-${title})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
  delay,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'card-base p-5 opacity-0 animate-fadeInUp',
        className
      )}
      style={{ animationDelay: `${delay ?? 100}ms` }}
    >
      <div className="section-title mb-4">
        {Icon && <Icon className="w-5 h-5 text-forest-600" />}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function StatisticsPage() {
  const { fields, harvests, orders, inventory, customers, prices, lossStats, monthlyReports } =
    useAppStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('year');

  const filteredMonthlyReports = useMemo(() => {
    const now = new Date('2026-06-17');
    switch (timeRange) {
      case 'month':
        return monthlyReports.slice(-1);
      case 'quarter':
        return monthlyReports.slice(-3);
      case 'year':
      default:
        return monthlyReports;
    }
  }, [timeRange, monthlyReports]);

  const filteredLossStats = useMemo(() => {
    const ls = lossStats.length > 0 ? lossStats : [
      { month: '2025-07', planting: 3.2, harvesting: 4.1, grading: 2.5, coldChain: 1.8, returns: 0.9 },
      { month: '2025-08', planting: 3.5, harvesting: 4.3, grading: 2.7, coldChain: 2.0, returns: 1.1 },
      { month: '2025-09', planting: 2.8, harvesting: 3.8, grading: 2.3, coldChain: 1.5, returns: 0.7 },
      { month: '2025-10', planting: 2.5, harvesting: 3.5, grading: 2.1, coldChain: 1.3, returns: 0.6 },
      { month: '2025-11', planting: 2.7, harvesting: 3.7, grading: 2.2, coldChain: 1.4, returns: 0.8 },
      { month: '2025-12', planting: 3.8, harvesting: 5.2, grading: 3.1, coldChain: 2.2, returns: 1.5 },
      { month: '2026-01', planting: 4.0, harvesting: 5.5, grading: 3.3, coldChain: 2.4, returns: 1.6 },
      { month: '2026-02', planting: 4.2, harvesting: 5.8, grading: 3.5, coldChain: 2.6, returns: 1.8 },
      { month: '2026-03', planting: 4.5, harvesting: 6.2, grading: 3.8, coldChain: 2.8, returns: 2.1 },
      { month: '2026-04', planting: 4.8, harvesting: 6.5, grading: 4.0, coldChain: 3.0, returns: 2.5 },
      { month: '2026-05', planting: 3.0, harvesting: 4.0, grading: 2.6, coldChain: 1.7, returns: 1.0 },
      { month: '2026-06', planting: 2.6, harvesting: 3.6, grading: 2.2, coldChain: 1.4, returns: 0.8 },
    ];
    switch (timeRange) {
      case 'month':
        return ls.slice(-1);
      case 'quarter':
        return ls.slice(-3);
      case 'year':
      default:
        return ls;
    }
  }, [timeRange, lossStats]);

  const stats = useMemo(() => {
    const totalProduction = monthlyReports.reduce((s, r) => s + (r.production || 0), 0);
    const totalSales = monthlyReports.reduce((s, r) => s + (r.sales || 0), 0);
    const totalRevenue = monthlyReports.reduce((s, r) => s + (r.revenue || 0), 0);
    const currentInventory = monthlyReports.length > 0
      ? monthlyReports[monthlyReports.length - 1].inventory
      : 0;
    const avgLoss = filteredLossStats.length > 0
      ? filteredLossStats.reduce((s, r) => {
          const sum = (r.planting || 0) + (r.harvesting || 0) + (r.grading || 0) + (r.coldChain || 0) + (r.returns || 0);
          return s + sum;
        }, 0) / filteredLossStats.length
      : 0;
    const avgUnitPrice = totalSales > 0 ? (totalRevenue / totalSales) * 10000 : 0;

    return {
      totalProduction: (totalProduction / 10000).toFixed(1),
      totalSales: (totalSales / 10000).toFixed(1),
      currentInventory: (currentInventory / 10000).toFixed(1),
      avgLoss: avgLoss.toFixed(1),
      totalRevenue: (totalRevenue / 10000).toFixed(1),
      avgUnitPrice: avgUnitPrice.toFixed(2),
    };
  }, [monthlyReports, filteredLossStats]);

  const miniTrend = (base: number, variance = 0.3) =>
    ['1', '2', '3', '4', '5', '6'].map((m) => ({
      name: m,
      value: Math.round(base * (0.7 + Math.random() * variance)),
    }));

  const lossVarietyData = useMemo(() => [
    { name: '白菊', value: 15.2 },
    { name: '黄菊', value: 12.8 },
    { name: '粉菊', value: 8.5 },
    { name: '多头菊', value: 6.2 },
    { name: '西伯利亚百合', value: 5.8 },
    { name: '索邦百合', value: 4.5 },
    { name: '其他', value: 3.2 },
  ], []);

  const priceTrendData = useMemo(() => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    return months.map((m, i) => ({
      month: m.slice(5) + '月',
      菊A: +(3.2 + i * 0.3 + Math.random() * 0.4).toFixed(2),
      菊B: +(2.3 + i * 0.2 + Math.random() * 0.3).toFixed(2),
      菊C: +(1.4 + i * 0.1 + Math.random() * 0.2).toFixed(2),
      百A: +(7.5 + i * 0.4 + Math.random() * 0.6).toFixed(2),
      百B: +(5.6 + i * 0.3 + Math.random() * 0.4).toFixed(2),
      百C: +(3.8 + i * 0.2 + Math.random() * 0.3).toFixed(2),
    }));
  }, []);

  const priceListData = useMemo(() => [
    { variety: '白菊', grade: 'A', price: 3.8, yoy: 12.5 },
    { variety: '白菊', grade: 'B', price: 2.7, yoy: 8.3 },
    { variety: '白菊', grade: 'C', price: 1.6, yoy: -2.1 },
    { variety: '黄菊', grade: 'A', price: 3.6, yoy: 10.2 },
    { variety: '黄菊', grade: 'B', price: 2.5, yoy: 6.8 },
    { variety: '黄菊', grade: 'C', price: 1.5, yoy: -1.5 },
    { variety: '粉菊', grade: 'A', price: 4.2, yoy: 15.6 },
    { variety: '多头菊', grade: 'A', price: 5.5, yoy: 18.2 },
    { variety: '西伯利亚', grade: 'A', price: 8.8, yoy: 8.5 },
    { variety: '西伯利亚', grade: 'B', price: 6.5, yoy: 5.2 },
    { variety: '索邦', grade: 'A', price: 9.2, yoy: 12.8 },
    { variety: '黄天霸', grade: 'A', price: 10.5, yoy: 22.1 },
  ], []);

  const customerRankData = useMemo(() => {
    const rank = [
      { name: '昆明斗南花卉批发', value: 852 },
      { name: '深圳花卉世界', value: 689 },
      { name: '北京八宝山', value: 456 },
      { name: '上海龙华', value: 328 },
      { name: '广州银河园', value: 218 },
      { name: '南京花卉集散', value: 168 },
      { name: '西安殡仪馆', value: 152 },
      { name: '重庆鲜花批发', value: 98 },
      { name: '锦绣花艺', value: 29 },
      { name: '花语轩精品', value: 38 },
    ];
    return rank.sort((a, b) => b.value - a.value);
  }, []);

  const reportTableData = useMemo(() => {
    return monthlyReports.map((r, idx) => {
      const salesRate = r.production > 0 ? ((r.sales / r.production) * 100).toFixed(1) : '0';
      const avgPrice = r.sales > 0 ? ((r.revenue / 10000) / (r.sales / 10000)).toFixed(2) : '0';
      const ls = lossStats[idx] || { planting: 3, harvesting: 4, grading: 2.5, coldChain: 1.8, returns: 1 };
      const lossRate = ((ls.planting + ls.harvesting + ls.grading + ls.coldChain + ls.returns)).toFixed(1);
      return {
        month: r.month,
        production: (r.production / 10000).toFixed(1),
        sales: (r.sales / 10000).toFixed(1),
        salesRate,
        inventory: (r.inventory / 10000).toFixed(1),
        revenue: (r.revenue / 10000).toFixed(1),
        avgPrice,
        lossRate,
      };
    });
  }, [monthlyReports, lossStats]);

  const timeRangeTabs: { key: TimeRange; label: string }[] = [
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季' },
    { key: 'year', label: '本年' },
    { key: 'custom', label: '自定义' },
  ];

  const composedData = useMemo(() => {
    return monthlyReports.map((r) => ({
      month: r.month.slice(5) + '月',
      产量: Math.round(r.production / 10000),
      销量: Math.round(r.sales / 10000),
      库存: Math.round(r.inventory / 10000),
    }));
  }, [monthlyReports]);

  return (
    <div className="space-y-6 p-6">
      <div className="opacity-0 animate-fadeInUp">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-forest-900 font-serif">产销统计中心</h1>
            <p className="text-sm text-forest-600 mt-1">全面掌握种植、销售、库存与损耗数据</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-forest-600">
            <Calendar className="w-4 h-4" />
            <span>数据更新至 2026-06-17</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <BigScreenStatCard
          title="本年总产量"
          value={stats.totalProduction}
          unit="万枝"
          icon={Leaf}
          gradient="linear-gradient(135deg, #123222 0%, #1f4d3a 100%)"
          accent="#4d946c"
          trend={{ value: '+8.6%', up: true }}
          miniData={miniTrend(120)}
          delay={0}
        />
        <BigScreenStatCard
          title="本年总销量"
          value={stats.totalSales}
          unit="万枝"
          icon={BarChart3}
          gradient="linear-gradient(135deg, #3a2e12 0%, #5d4a1f 100%)"
          accent="#e8b923"
          trend={{ value: '+10.2%', up: true }}
          miniData={miniTrend(100)}
          delay={80}
        />
        <BigScreenStatCard
          title="当前库存"
          value={stats.currentInventory}
          unit="万枝"
          icon={Package}
          gradient="linear-gradient(135deg, #122238 0%, #1f3a5d 100%)"
          accent="#60a5fa"
          trend={{ value: '-3.2%', up: false }}
          miniData={miniTrend(80)}
          delay={160}
        />
        <BigScreenStatCard
          title="综合损耗率"
          value={stats.avgLoss}
          unit="%"
          icon={Target}
          gradient="linear-gradient(135deg, #3a1212 0%, #5d1f1f 100%)"
          accent="#ef4444"
          trend={{ value: '-0.8%', up: false }}
          miniData={miniTrend(12, 0.4)}
          delay={240}
        />
        <BigScreenStatCard
          title="本年营收"
          value={stats.totalRevenue}
          unit="万元"
          icon={DollarSign}
          gradient="linear-gradient(135deg, #0f2a1e 0%, #1a4532 100%)"
          accent="#34d399"
          trend={{ value: '+15.8%', up: true }}
          miniData={miniTrend(250)}
          delay={320}
        />
        <BigScreenStatCard
          title="平均单价"
          value={stats.avgUnitPrice}
          unit="元/枝"
          icon={TrendingUp}
          gradient="linear-gradient(135deg, #2e2a1e 0%, #4a4332 100%)"
          accent="#e6dfcd"
          trend={{ value: '+5.2%', up: true }}
          miniData={miniTrend(3)}
          delay={400}
        />
      </div>

      <div className="flex items-center gap-2 opacity-0 animate-fadeInUp" style={{ animationDelay: '450ms' }}>
        <div className="inline-flex p-1 bg-white rounded-xl shadow-sm border border-cream-200">
          {timeRangeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeRange(tab.key)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                timeRange === tab.key
                  ? 'bg-forest-600 text-white shadow-md'
                  : 'text-forest-700 hover:bg-cream-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-cream-200">
            <Calendar className="w-4 h-4 text-forest-500" />
            <span className="text-sm text-forest-700">选择日期范围</span>
            <ChevronDown className="w-4 h-4 text-forest-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SectionCard title="各环节损耗分布（堆叠）" icon={Target} delay={500}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredLossStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e6dfcd' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#123222',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, {
                    planting: '种植损耗',
                    harvesting: '采收损耗',
                    grading: '分级损耗',
                    coldChain: '冷链损耗',
                    returns: '退货损耗',
                  }[name] || name]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value: string) => ({
                    planting: '种植损耗',
                    harvesting: '采收损耗',
                    grading: '分级损耗',
                    coldChain: '冷链损耗',
                    returns: '退货损耗',
                  }[value] || value)}
                />
                <Bar dataKey="planting" stackId="loss" radius={[0, 0, 0, 0]}>
                  {filteredLossStats.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[0]} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Bar dataKey="harvesting" stackId="loss">
                  {filteredLossStats.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[1]} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Bar dataKey="grading" stackId="loss">
                  {filteredLossStats.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[2]} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Bar dataKey="coldChain" stackId="loss">
                  {filteredLossStats.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[3]} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Bar dataKey="returns" stackId="loss" radius={[4, 4, 0, 0]}>
                  {filteredLossStats.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[4]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="各品种损耗率占比" icon={Target} delay={580}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lossVarietyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {lossVarietyData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        '#e8b923',
                        '#f0c94f',
                        '#c99c12',
                        '#4d946c',
                        '#7db694',
                        '#2d7750',
                        '#c0392b',
                      ][index % 7]}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 8}
                              fontSize={20}
                              fill="#123222"
                              fontWeight="bold"
                              fontFamily="serif"
                            >
                              56.2
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 14}
                              fontSize={11}
                              fill="#2d7750"
                            >
                              总损耗率%
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e6dfcd',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, '损耗率']}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SectionCard title="近6月价格走势（菊花+百合各等级）" icon={TrendingUp} delay={600}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e6dfcd' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e6dfcd',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`¥${value}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="菊A"
                  stroke={COLORS.chrysanthemum}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.chrysanthemum }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="菊B"
                  stroke="#f0c94f"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 2.5, fill: '#f0c94f' }}
                />
                <Line
                  type="monotone"
                  dataKey="菊C"
                  stroke="#c99c12"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#c99c12' }}
                />
                <Line
                  type="monotone"
                  dataKey="百A"
                  stroke={COLORS.lily}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.lily }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="百B"
                  stroke="#7db694"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 2.5, fill: '#7db694' }}
                />
                <Line
                  type="monotone"
                  dataKey="百C"
                  stroke="#2d7750"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#2d7750' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="本月价格行情 & 同比涨跌" icon={DollarSign} delay={680}>
          <div className="h-72 overflow-auto">
            <table className="w-full min-w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-head">品种</th>
                  <th className="table-head text-center">等级</th>
                  <th className="table-head text-right">价格(元/枝)</th>
                  <th className="table-head text-right">同比</th>
                </tr>
              </thead>
              <tbody>
                {priceListData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'transition-colors duration-150 hover:bg-cream-50',
                      idx % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'
                    )}
                  >
                    <td className="table-cell font-medium text-forest-900">{row.variety}</td>
                    <td className="table-cell text-center">
                      <span
                        className={cn(
                          'badge',
                          row.grade === 'A' && 'bg-forest-100 text-forest-700',
                          row.grade === 'B' && 'bg-chrysanthemum-400/20 text-chrysanthemum-600',
                          row.grade === 'C' && 'bg-cream-200 text-forest-600'
                        )}
                      >
                        {row.grade}级
                      </span>
                    </td>
                    <td className="table-cell text-right font-serif font-semibold text-forest-900">
                      ¥{row.price.toFixed(2)}
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                          row.yoy >= 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-500'
                        )}
                      >
                        {row.yoy >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {row.yoy >= 0 ? '+' : ''}
                        {row.yoy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <SectionCard title="产销存对比（12个月）" icon={BarChart3} delay={700}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={composedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e6dfcd' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}万`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#3b82f6' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}万`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e6dfcd',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}万枝`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="产量"
                  fill={COLORS.lily}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Bar
                  yAxisId="left"
                  dataKey="销量"
                  fill={COLORS.chrysanthemum}
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="库存"
                  stroke={COLORS.inventoryBlue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS.inventoryBlue, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="客户销售排名 Top10" icon={BarChart3} delay={780}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerRankData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#2d7750' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e6dfcd' }}
                  tickFormatter={(v) => `${v}万`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#123222' }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e6dfcd',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}万元`, '采购额']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                  {customerRankData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index < 3
                          ? [COLORS.chrysanthemum, COLORS.lily, COLORS.inventoryBlue][index]
                          : `hsl(${150 + index * 12}, 45%, ${55 - index * 2}%)`
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="月度产销报表"
        icon={BarChart3}
        delay={800}
      >
        <DataTable
          columns={[
            { key: 'month', title: '月份' },
            { key: 'production', title: '产量(万枝)', render: (r: any) => <span className="font-serif">{r.production}</span> },
            { key: 'sales', title: '销量(万枝)', render: (r: any) => <span className="font-serif">{r.sales}</span> },
            {
              key: 'salesRate',
              title: '产销率%',
              render: (r: any) => (
                <span
                  className={cn(
                    'font-serif font-medium',
                    parseFloat(r.salesRate) >= 90 ? 'text-emerald-600' : 'text-forest-700'
                  )}
                >
                  {r.salesRate}%
                </span>
              ),
            },
            { key: 'inventory', title: '月末库存(万枝)', render: (r: any) => <span className="font-serif text-sky-600">{r.inventory}</span> },
            { key: 'revenue', title: '营收(万元)', render: (r: any) => <span className="font-serif font-semibold text-forest-900">¥{r.revenue}</span> },
            { key: 'avgPrice', title: '均价(元/枝)', render: (r: any) => <span className="font-serif">¥{r.avgPrice}</span> },
            {
              key: 'lossRate',
              title: '损耗率%',
              render: (r: any) => (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                    parseFloat(r.lossRate) > 15 ? 'bg-red-50 text-red-600' : 'bg-cream-100 text-forest-700'
                  )}
                >
                  {parseFloat(r.lossRate) > 15 && <Target className="w-3 h-3" />}
                  {r.lossRate}%
                </span>
              ),
            },
          ]}
          data={reportTableData}
          rowKey="month"
          emptyText="暂无月度报表数据"
        />
      </SectionCard>
    </div>
  );
}
