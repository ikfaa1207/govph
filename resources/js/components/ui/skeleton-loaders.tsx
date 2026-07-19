import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface TableSkeletonProps {
  rows?: number
  cols?: number
  className?: string
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between pb-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <div className="border rounded-md">
        <div className="border-b px-4 py-3 flex space-x-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex space-x-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("border rounded-xl p-6 space-y-4 bg-card", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
  className?: string
}

export function FormSkeleton({ fields = 3, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6 w-full max-w-md p-6 border rounded-xl bg-card", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  )
}

interface TextSkeletonProps {
  lines?: number
  className?: string
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && "w-[60%]"
          )}
        />
      ))}
    </div>
  )
}
