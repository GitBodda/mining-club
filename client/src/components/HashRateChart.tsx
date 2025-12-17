import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "./GlassCard";
import type { ChartDataPoint } from "@/lib/types";

interface HashRateChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export function HashRateChart({ data, title = "Hash Rate" }: HashRateChartProps) {
  return (
    <GlassCard delay={0.3} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Hash Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">Earnings</span>
          </div>
        </div>
      </div>

      <div className="h-40 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hashRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(263, 70%, 58%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(263, 70%, 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(250, 10%, 55%)", fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(250, 10%, 55%)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(250, 18%, 10%)",
                border: "1px solid hsl(250, 15%, 20%)",
                borderRadius: "12px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "hsl(0, 0%, 98%)", marginBottom: 4 }}
              itemStyle={{ color: "hsl(0, 0%, 80%)", padding: 0 }}
            />
            <Area
              type="monotone"
              dataKey="hashRate"
              stroke="hsl(263, 70%, 58%)"
              strokeWidth={2}
              fill="url(#hashRateGradient)"
              name="Hash Rate"
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(142, 70%, 50%)"
              strokeWidth={2}
              fill="url(#earningsGradient)"
              name="Earnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
