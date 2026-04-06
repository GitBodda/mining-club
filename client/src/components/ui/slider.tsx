import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center h-[50px]",
      className
    )}
    {...props}
  >
    {/* iOS 26 thin track — 6px */}
    <SliderPrimitive.Track className="relative h-[6px] w-full grow overflow-hidden rounded-[3px] bg-[rgba(120,120,120,0.2)]">
      {/* Blue fill */}
      <SliderPrimitive.Range className="absolute h-full bg-[#0088FF] rounded-[3px]" />
    </SliderPrimitive.Track>
    {/* iOS 26 knob — 38×24 pill, white with shadow */}
    <SliderPrimitive.Thumb className="block w-[38px] h-[24px] rounded-[100px] bg-white shadow-[0px_0.5px_4px_rgba(0,0,0,0.12),0px_6px_13px_rgba(0,0,0,0.12)] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
