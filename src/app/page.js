'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import AcademyMetrics from '@/components/dashboard/AcademyMetrics'
import AttendanceChart from '@/components/dashboard/AttendanceChart'
import RecentActivity from '@/components/dashboard/RecentActivity'
import ClassOverview from '@/components/dashboard/ClassOverview'

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="text-gray-600 mt-1">학원 운영 현황을 한눈에 확인하세요</p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* 주요 지표 */}
        <AcademyMetrics />

        {/* 출석 현황 & 오늘의 수업 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart />
          <ClassOverview />
        </div>

        {/* 최근 활동 */}
        <RecentActivity />
          
        {/* 빠른 작업 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">빠른 작업</h3>
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/students/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 text-xl">👨‍🎓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-600">새 학생 등록</p>
                <p className="text-sm text-gray-500">신규 학생을 등록합니다</p>
              </div>
            </a>

            <a
              href="/classes/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-green-600 text-xl">📚</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-green-600">새 클래스 개설</p>
                <p className="text-sm text-gray-500">새로운 클래스를 생성합니다</p>
                </div>
              </a>

            <a
              href="/instructors/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-purple-600 text-xl">👨‍🏫</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-purple-600">강사 등록</p>
                <p className="text-sm text-gray-500">새로운 강사를 등록합니다</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}