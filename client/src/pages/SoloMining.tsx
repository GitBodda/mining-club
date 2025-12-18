import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  Target, 
  Award,
  HelpCircle,
  Sparkles,
  Cpu,
  Clock,
  ArrowRight
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import btcMine from "@assets/Bitcoin_Mine_1766014388617.png";
import btcCoin from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import serverMining from "@assets/Server_Mining_1766014388610.png";

const COST_PER_PH_PER_MONTH = 850;
const NETWORK_HASHRATE_EH = 650;

const faqItems = [
  {
    id: "faq-1",
    question: "What is Solo Mining?",
    answer: "Solo mining means you mine independently without sharing rewards with a pool. Unlike pool mining where rewards are split among participants, solo mining gives you the entire block reward (3 BTC) when you find a block. It's high-risk, high-reward - you might wait longer between rewards, but when you win, you win big."
  },
  {
    id: "faq-2",
    question: "How does block reward work?",
    answer: "When you successfully mine a Bitcoin block, you receive the full block reward of 3 BTC plus all transaction fees included in that block. This reward is significantly higher than what you'd earn from pool mining over the same period, making solo mining attractive for those willing to take the risk."
  },
  {
    id: "faq-3",
    question: "What are my chances of winning?",
    answer: "Your probability of finding a block depends on your hashpower relative to the total network hashrate. With 50 PH/s running for 6 months, you have approximately a 0.73% chance of finding a block. Higher hashpower and longer duration increase your odds significantly."
  },
  {
    id: "faq-4",
    question: "Can I cancel my contract?",
    answer: "Solo mining contracts can be cancelled within the first 7 days for a full refund. After 7 days, you may cancel with a 15% early termination fee. Once mining has been active for over 30 days, cancellation is subject to review and partial refunds based on remaining contract duration."
  },
  {
    id: "faq-5",
    question: "How do I receive my rewards?",
    answer: "If you successfully mine a block, the 3 BTC reward is automatically deposited to your connected wallet within 24 hours of block confirmation. You'll receive instant notifications via email and push notification when a block is found. All rewards are verifiable on the blockchain."
  }
];

function FloatingParticle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-primary/40 rounded-full"
      style={{ left: `${x}%` }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ 
        y: "-100%", 
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

export function SoloMining() {
  const [hashpower, setHashpower] = useState([50]);
  const [duration, setDuration] = useState([6]);

  const calculations = useMemo(() => {
    const ph = hashpower[0];
    const months = duration[0];
    const cost = ph * months * COST_PER_PH_PER_MONTH;
    
    const networkHashratePH = NETWORK_HASHRATE_EH * 1000;
    const blocksPerMonth = 4320;
    const totalBlocks = blocksPerMonth * months;
    const probabilityPerBlock = ph / networkHashratePH;
    const probabilityOfAtLeastOneBlock = 1 - Math.pow(1 - probabilityPerBlock, totalBlocks);
    
    return {
      cost,
      probability: (probabilityOfAtLeastOneBlock * 100).toFixed(2),
      expectedBlocks: (probabilityOfAtLeastOneBlock).toFixed(3)
    };
  }, [hashpower, duration]);

  const isRecommended = hashpower[0] === 50 && duration[0] === 6;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-8"
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <GlassCard className="relative overflow-visible p-6" glow="btc">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <FloatingParticle 
                key={i} 
                delay={i * 0.8} 
                x={10 + i * 12}
                duration={4 + Math.random() * 2}
              />
            ))}
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Badge 
                className="mb-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30"
                data-testid="badge-lottery-mining"
              >
                <Target className="w-3 h-3 mr-1" />
                Lottery Mining
              </Badge>
              
              <h1 
                className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                data-testid="heading-hero"
              >
                Win a Full Bitcoin Block
              </h1>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join forces to buy massive hashrate and compete for the ultimate prize - 
                a full 3 BTC block reward. High risk, high reward lottery-style mining.
              </p>
            </div>
            
            <motion.div 
              className="w-24 h-24 flex-shrink-0"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={btcMine} 
                alt="Bitcoin Mining"
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(247,147,26,0.3)]"
                data-testid="img-hero"
              />
            </motion.div>
          </div>
        </GlassCard>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6" variant="strong">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-16 h-16"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <img 
                  src={btcCoin} 
                  alt="Bitcoin"
                  className="w-full h-full object-contain"
                  data-testid="img-block-reward"
                />
              </motion.div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Block Reward</p>
                <div className="flex items-baseline gap-1">
                  <span 
                    className="text-4xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(247,147,26,0.5)]"
                    data-testid="text-block-reward"
                  >
                    3
                  </span>
                  <span className="text-xl font-semibold text-amber-400/80">BTC</span>
                </div>
              </div>
            </div>
            
            <Badge 
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30"
              data-testid="badge-potential-value"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              ~$180,000 Value
            </Badge>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
          
          {isRecommended && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Badge 
                className="w-full justify-center py-2 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 text-blue-400 border-blue-500/30"
                data-testid="badge-recommended"
              >
                <Award className="w-4 h-4 mr-2" />
                Recommended: 50 PH/s for 6 months
              </Badge>
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={serverMining} 
                alt="Server Mining"
                className="w-12 h-12 object-contain"
                data-testid="img-hashpower"
              />
              <h3 className="text-lg font-semibold text-foreground">Configure Your Mining Power</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Hashpower</span>
                  </div>
                  <span 
                    className="text-lg font-bold text-primary"
                    data-testid="text-hashpower-value"
                  >
                    {hashpower[0]} PH/s
                  </span>
                </div>
                <Slider
                  value={hashpower}
                  onValueChange={setHashpower}
                  min={1}
                  max={200}
                  step={1}
                  className="w-full"
                  data-testid="slider-hashpower"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>1 PH/s</span>
                  <span>200 PH/s</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Duration</span>
                  </div>
                  <span 
                    className="text-lg font-bold text-primary"
                    data-testid="text-duration-value"
                  >
                    {duration[0]} {duration[0] === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                  data-testid="slider-duration"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>1 month</span>
                  <span>12 months</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                <p 
                  className="text-2xl font-bold text-foreground"
                  data-testid="text-cost"
                >
                  ${calculations.cost.toLocaleString()}
                </p>
              </div>
              
              <div className="liquid-glass rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
                <p 
                  className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                  data-testid="text-probability"
                >
                  {calculations.probability}%
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 border-blue-400/50 text-white"
              data-testid="button-start-mining"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Solo Mining
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </GlassCard>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <AccordionItem 
                  value={item.id} 
                  className="border-border/50"
                  data-testid={`accordion-item-${item.id}`}
                >
                  <AccordionTrigger 
                    className="text-left text-foreground hover:no-underline hover:text-primary transition-colors"
                    data-testid={`accordion-trigger-${item.id}`}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent 
                    className="text-muted-foreground leading-relaxed"
                    data-testid={`accordion-content-${item.id}`}
                  >
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </GlassCard>
      </motion.section>
    </motion.div>
  );
}
