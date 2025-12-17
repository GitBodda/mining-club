import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

function Skeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/[0.05]",
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="text-center mb-8">
          <Skeleton className="h-4 w-24 mx-auto mb-2" />
          <Skeleton className="h-12 w-40 mx-auto" />
        </div>

        <div className="flex justify-center mb-6">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06]">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function WalletSkeleton() {
  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08]">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-36 mb-2" />
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-3 mt-6">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-16 mb-4" />
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export { Skeleton };
