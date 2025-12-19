import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyPhoneLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mt-2 mx-auto" />
        </div>

        <div className="p-8 mb-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <Skeleton className="h-10 w-full" />
            
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  )
}