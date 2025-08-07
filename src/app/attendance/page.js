'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { CalendarIcon, ClipboardDocumentCheckIcon, ChartBarIcon, AcademicCapIcon, UserGroupIcon, ClockIcon, MapPinIcon, PlusIcon } from '@/components/icons'

export default function AttendancePage() {
  const [todayClasses, setTodayClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // 오늘 요일에 해당하는 클래스들 조회
  const fetchTodayClasses = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const date = new Date(selectedDate)
      const dayOfWeek = date.getDay() // 0=일, 1=월, ..., 6=토

      console.log('선택된 날짜:', selectedDate, '요일:', dayOfWeek)

      // 해당 요일에 수업이 있는 클래스들 조회
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(name),
          class_schedules!inner(day_of_week, start_time, end_time),
          class_students(
            student_id,
            students(id, name, phone, parent_phone)
          )
        `)
        .eq('class_schedules.day_of_week', dayOfWeek)
        .eq('status', 'active')

      if (error) throw error

      setTodayClasses(data || [])
      console.log('오늘 수업 클래스들:', data)

    } catch (err) {
      setError(err.message)
      console.error('클래스 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchTodayClasses()
  }, [fetchTodayClasses])

  // 요일 이름 반환
  const getDayName = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return days[date.getDay()]
  }

  // 시간 포맷팅
  const formatTime = (timeStr) => {
    return timeStr ? timeStr.slice(0, 5) : ''
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">출결 정보를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-6 h-6" />
              출결 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedDate} ({getDayName(selectedDate)}) • 오늘 수업 {todayClasses.length}개
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/attendance/stats"
              className="inline-flex items-center gap-2 px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium transition-colors"
            >
              <ChartBarIcon className="w-5 h-5" />
              출결 통계
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              <AcademicCapIcon className="w-5 h-5" />
              클래스 관리
            </Link>
          </div>
        </div>

        {/* 날짜 선택 및 필터 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                출결 날짜:
              </label>
            </div>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors dark:bg-gray-900"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4">
            <p className="text-error-600 font-medium">오류가 발생했습니다: {error}</p>
          </div>
        )}

        {/* 수업 목록 */}
        {todayClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
              {getDayName(selectedDate)}에는 수업이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              다른 날짜를 선택하거나 새로운 클래스를 생성해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/classes/new"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                클래스 생성
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <AcademicCapIcon className="w-5 h-5" />
                클래스 목록
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {todayClasses.map((classItem) => {
              const schedule = classItem.class_schedules[0] // 해당 요일 스케줄
              const students = classItem.class_students || []
              
              return (
                <div key={classItem.id} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-all dark:border-gray-800 dark:bg-white/[0.03]">
                    {/* 클래스 헤더 */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90 mb-3">
                          {classItem.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{classItem.instructors?.name || '강사 미배정'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{classItem.classroom || '교실 미정'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{formatTime(schedule?.start_time)}-{formatTime(schedule?.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-semibold text-brand-600">{students.length}명</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/attendance/class/${classItem.id}?date=${selectedDate}`}
                        className="ml-6 inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex-shrink-0"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        출결 체크
                      </Link>
                    </div>

                    {/* 학생 목록 미리보기 */}
                    {students.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          <UserGroupIcon className="w-4 h-4" />
                          등록 학생
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                          {students.map((cs) => (
                            <div key={cs.student_id} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0"></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{cs.students?.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">등록된 학생이 없습니다</p>
                        <Link
                          href={`/classes/${classItem.id}/students`}
                          className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                        >
                          학생 등록하기 →
                        </Link>
                      </div>
                    )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}