import { cn } from "@/lib/utils"

const textareaClassName =
  "min-h-64 w-full min-w-0 resize-y rounded-none border-2 border-[#243049] border-t-white/15 border-l-white/10 bg-input px-3 py-3 text-xl transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 shadow-[3px_3px_0_0_#010204]"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaClassName, className)}
      {...props}
    />
  )
}

export { Textarea, textareaClassName }
