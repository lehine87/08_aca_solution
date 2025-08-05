import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🏫 학원관리 솔루션
        </h1>
        
        <p className="text-gray-600 mb-8">
          MVP 개발 중인 학원관리 시스템입니다.
        </p>

        <div className="space-y-4">
          <Link
            href="/test"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🧪 데이터베이스 연결 테스트
          </Link>
          
          <div className="text-sm text-gray-500">
            개발 단계: Phase 1 MVP
          </div>
        </div>
      </div>
    </div>
  )
}