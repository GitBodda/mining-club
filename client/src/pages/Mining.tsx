import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { PoolCard } from "@/components/PoolCard";
import { HashRateChart } from "@/components/HashRateChart";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { MiningPool, UserSettings, ChartDataPoint } from "@/lib/types";

interface MiningProps {
  pools: MiningPool[];
  settings: UserSettings;
  chartData: ChartDataPoint[];
  onPoolSelect: (id: string) => void;
  onSettingsChange: (settings: Partial<UserSettings>) => void;
}

export function Mining({ pools, settings, chartData, onPoolSelect, onSettingsChange }: MiningProps) {
  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Mining Control</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your mining setup</p>
      </motion.header>

      <GlassCard delay={0.1}>
        <h2 className="text-base font-semibold text-foreground mb-4">Mining Intensity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Power Level</span>
            <span className="text-sm font-medium text-primary">{settings.miningIntensity}%</span>
          </div>
          <Slider
            data-testid="slider-intensity"
            value={[settings.miningIntensity]}
            onValueChange={(value) => onSettingsChange({ miningIntensity: value[0] })}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Eco</span>
            <span>Balanced</span>
            <span>Performance</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.15}>
        <h2 className="text-base font-semibold text-foreground mb-4">Quick Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="auto-mining" className="text-sm font-medium text-foreground">
                Auto Mining
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start mining when app opens
              </p>
            </div>
            <Switch
              id="auto-mining"
              data-testid="switch-auto-mining"
              checked={settings.autoMining}
              onCheckedChange={(checked) => onSettingsChange({ autoMining: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="power-saver" className="text-sm font-medium text-foreground">
                Power Saver
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reduce intensity when battery low
              </p>
            </div>
            <Switch
              id="power-saver"
              data-testid="switch-power-saver"
              checked={settings.powerSaver}
              onCheckedChange={(checked) => onSettingsChange({ powerSaver: checked })}
            />
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Mining Pools</h2>
        <div className="flex flex-col gap-3">
          {pools.map((pool, index) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              index={index}
              onSelect={onPoolSelect}
            />
          ))}
        </div>
      </div>

      <HashRateChart data={chartData} title="Pool Performance" />
    </motion.div>
  );
}
