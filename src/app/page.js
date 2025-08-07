'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'
import AttendanceOverview from '@/components/dashboard/AttendanceOverview'
import RecentActivities from '@/components/dashboard/RecentActivities'

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
        <DashboardMetrics />

        {/* 출석 현황 & 오늘의 수업 */}
        <AttendanceOverview />

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentActivities />
          </div>
          
          {/* 빠른 작업 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-6">빠른 작업</h3>
            
            <div className="space-y-3">
              <a
                href="/students/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600">👨‍🎓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-600">새 학생 등록</p>
                  <p className="text-sm text-gray-500">신규 학생을 등록합니다</p>
                </div>
              </a>

              <a
                href="/classes/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <span className="text-green-600">📚</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-600">새 클래스 개설</p>
                  <p className="text-sm text-gray-500">새로운 클래스를 생성합니다</p>
                </div>
              </a>

              <a
                href="/instructors/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <span className="text-purple-600">👨‍🏫</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-600">강사 등록</p>
                  <p className="text-sm text-gray-500">새로운 강사를 등록합니다</p>
                </div>
              </a>

              <a
                href="/attendance"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <span className="text-orange-600">✅</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-brand-600">출결 관리</p>
                  <p className="text-sm text-gray-500">출석을 체크합니다</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}