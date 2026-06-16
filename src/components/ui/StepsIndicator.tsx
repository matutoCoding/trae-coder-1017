import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepsIndicatorProps {
  steps: string[];
  current: number;
}

export function StepsIndicator({ steps, current }: StepsIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < current;
          const isCurrent = index === current;
          const isPending = index > current;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300",
                    isCompleted && "bg-forest-500 border-forest-500 text-white",
                    isCurrent && "bg-white border-forest-500 text-forest-500 ring-4 ring-forest-100 shadow-sm",
                    isPending && "bg-white border-cream-300 text-cream-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium whitespace-nowrap",
                    isCompleted && "text-forest-600",
                    isCurrent && "text-forest-700 font-semibold",
                    isPending && "text-cream-500"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mb-6 transition-colors duration-300",
                    isCompleted ? "bg-forest-400" : "bg-cream-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepsIndicator;
