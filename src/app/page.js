import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🏫 학원관리 솔루션
        </h1>
        
        <p className="text-gray-600 mb-8">
          효율적인 학원 운영을 위한 통합 관리 시스템
        </p>

        <div className="space-y-3">
          <Link
            href="/students"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            👥 학생 관리
          </Link>
          
          <Link
            href="/test"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🧪 시스템 테스트
          </Link>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          개발 단계: Phase 1 MVP
        </div>
      </div>
    </div>
  )
}