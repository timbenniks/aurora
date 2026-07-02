import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import {
  voxelButtonOutlineClass,
  voxelButtonPrimaryClass,
} from "@/lib/aurora/voxel"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none bg-clip-padding whitespace-nowrap transition-all duration-100 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: voxelButtonPrimaryClass,
        outline: cn(
          voxelButtonOutlineClass,
          "disabled:border-border disabled:bg-card disabled:text-muted-foreground"
        ),
        secondary: cn(
          voxelButtonOutlineClass,
          "bg-accent hover:bg-accent"
        ),
        ghost:
          "rounded-none font-pixel-heading text-xs uppercase tracking-wide hover:bg-white/6",
        destructive: cn(
          voxelButtonOutlineClass,
          "border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25"
        ),
        link: "font-pixel text-lg text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 px-2 text-[8px]",
        sm: "h-8 gap-1.5 px-3 text-[9px]",
        lg: "h-11 gap-2 px-5 text-[11px]",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
