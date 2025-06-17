export default function AuthErrorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-12 rounded-full bg-gray-200 mx-auto" />
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-64 bg-gray-200 rounded mx-auto" />
        <div className="h-10 w-32 bg-gray-200 rounded mx-auto mt-6" />
      </div>
    </div>
  )
}
