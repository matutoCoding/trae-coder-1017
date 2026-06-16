import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorVariant = "forest" | "chrysanthemum" | "warning" | "blue";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  colorVariant?: ColorVariant;
  delay?: number;
}

const gradientMap: Record<ColorVariant, { bg: string; icon: string; badge: string }> = {
  forest: {
    bg: "bg-gradient-to-br from-forest-500 to-forest-700",
    icon: "text-white",
    badge: "bg-forest-100 text-forest-700",
  },
  chrysanthemum: {
    bg: "bg-gradient-to-br from-chrysanthemum-400 to-chrysanthemum-600",
    icon: "text-white",
    badge: "bg-chrysanthemum-400/20 text-chrysanthemum-600",
  },
  warning: {
    bg: "bg-gradient-to-br from-warning-500 to-warning-700",
    icon: "text-white",
    badge: "bg-warning-100 text-warning-600",
  },
  blue: {
    bg: "bg-gradient-to-br from-sky-500 to-sky-700",
    icon: "text-white",
    badge: "bg-sky-100 text-sky-700",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  colorVariant = "forest",
  delay = 0,
}: StatCardProps) {
  const styles = gradientMap[colorVariant];

  return (
    <div
      className="card-base card-hover p-5 flex items-center gap-4 opacity-0 animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md",
          styles.bg
        )}
      >
        <Icon className={cn("w-7 h-7", styles.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-forest-500 font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-forest-900 font-serif tracking-wide truncate">
          {value}
        </p>
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
              styles.badge
            )}
          >
            {trendUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
