import { TrendingDown, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CostSavingBannerProps {
  savings: number;
  overtimeCost: number;
  netOptimisation: number;
}

export function CostSavingBanner({ savings, overtimeCost, netOptimisation }: CostSavingBannerProps) {
  return (
    <div className="bg-civic-surface border border-civic-green/30 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-civic-green/10">
          <TrendingDown className="h-5 w-5 text-civic-green" />
        </div>
        <div>
          <p className="text-xs text-civic-muted">Potential savings today</p>
          <p className="font-mono text-xl font-semibold text-civic-green">{formatCurrency(savings)}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-[10px] text-civic-muted">Overtime cost</p>
          <p className="font-mono text-sm text-civic-red">{formatCurrency(overtimeCost)}</p>
        </div>
        <div>
          <p className="text-[10px] text-civic-muted">Net optimisation</p>
          <p className="font-mono text-sm text-civic-green">{formatCurrency(netOptimisation)}</p>
        </div>
      </div>
    </div>
  );
}
