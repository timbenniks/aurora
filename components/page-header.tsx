import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b-2 border-[#1a2540] pb-6",
        "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl leading-relaxed md:text-2xl lg:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-xl text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-col gap-3 md:w-auto md:flex-row">
          {action}
        </div>
      ) : null}
    </div>
  )
}
