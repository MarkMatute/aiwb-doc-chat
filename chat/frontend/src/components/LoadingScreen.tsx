export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-6"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connecting to Customer
        </h3>
        <p className="text-gray-600">Preparing seamless handoff from AI...</p>
      </div>
    </div>
  )
}