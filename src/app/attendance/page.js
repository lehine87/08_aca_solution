'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">출결 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 출결 관리</h1>
              <p className="mt-1 text-gray-600">
                {selectedDate} ({getDayName(selectedDate)}) 수업 {todayClasses.length}개
              </p>
            </div>
            <div className="space-x-3">
              <Link
                href="/attendance/stats"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📊 출결 통계
              </Link>
              <Link
                href="/classes"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📚 클래스 관리
              </Link>
            </div>
          </div>

          {/* 날짜 선택 */}
          <div className="mt-4 flex items-center space-x-4">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              📅 출결 날짜:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex space-x-2">
              <Link href="/students" className="text-gray-600 hover:text-gray-800">
                👥 학생 관리
              </Link>
              <Link href="/classes" className="text-blue-600 hover:text-blue-800">
                📚 클래스 관리
              </Link>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 수업 목록 */}
        {todayClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getDayName(selectedDate)}에는 수업이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다른 날짜를 선택하거나 새로운 클래스를 생성해보세요.
            </p>
            <div className="space-x-4">
              <Link
                href="/classes/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 클래스 생성
              </Link>
              <Link
                href="/classes"
                className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                📚 클래스 목록
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {todayClasses.map((classItem) => {
              const schedule = classItem.class_schedules[0] // 해당 요일 스케줄
              const students = classItem.class_students || []
              
              return (
                <div key={classItem.id} className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    
                    {/* 클래스 헤더 */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {classItem.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>👨‍🏫 {classItem.instructors?.name || '강사 미배정'}</span>
                          <span>🏠 {classItem.classroom || '교실 미정'}</span>
                          <span>⏰ {formatTime(schedule?.start_time)}-{formatTime(schedule?.end_time)}</span>
                          <span>👥 {students.length}명</span>
                        </div>
                      </div>
                      <Link
                        href={`/attendance/class/${classItem.id}?date=${selectedDate}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        📋 출결 체크
                      </Link>
                    </div>

                    {/* 학생 목록 미리보기 */}
                    {students.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">🎒 등록 학생:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                          {students.map((cs) => (
                            <div key={cs.student_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              <span className="text-sm text-gray-700">{cs.students?.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>등록된 학생이 없습니다</p>
                        <Link
                          href={`/classes/${classItem.id}/students`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          학생 등록하기 →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}