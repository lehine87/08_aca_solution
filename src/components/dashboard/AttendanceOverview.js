'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AttendanceOverview() {
  const [attendanceData, setAttendanceData] = useState({
    todayAttendance: {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    },
    upcomingClasses: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)

      const today = new Date().toISOString().split('T')[0]
      
      // 오늘의 출석 데이터 가져오기
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('status')
        .gte('created_at', today)
        .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      // 오늘의 클래스 목록 가져오기 (간단한 예시)
      const { data: todayClasses } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          subject,
          classroom,
          instructors!inner(name),
          class_schedules!inner(start_time, end_time)
        `)
        .eq('status', 'active')
        .limit(5)

      // 출석 통계 계산
      const present = attendanceRecords?.filter(record => record.status === 'present').length || 0
      const absent = attendanceRecords?.filter(record => record.status === 'absent').length || 0
      const late = attendanceRecords?.filter(record => record.status === 'late').length || 0
      const total = attendanceRecords?.length || 0

      setAttendanceData({
        todayAttendance: { present, absent, late, total },
        upcomingClasses: todayClasses || []
      })

    } catch (error) {
      console.error('출석 데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceRate = () => {
    const { present, total } = attendanceData.todayAttendance
    if (total === 0) return 0
    return Math.round((present / total) * 100)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 오늘의 출석 현황 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white/90">오늘의 출석 현황</h3>
          <Link 
            href="/attendance" 
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            상세보기
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">출석률</span>
                <span className="text-2xl font-bold text-gray-900">{getAttendanceRate()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getAttendanceRate()}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-success-50 rounded-lg">
                <div className="text-2xl font-bold text-success-600">
                  {attendanceData.todayAttendance.present}
                </div>
                <div className="text-sm text-success-600 font-medium">출석</div>
              </div>
              
              <div className="text-center p-3 bg-warning-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600">
                  {attendanceData.todayAttendance.late}
                </div>
                <div className="text-sm text-warning-600 font-medium">지각</div>
              </div>
              
              <div className="text-center p-3 bg-error-50 rounded-lg">
                <div className="text-2xl font-bold text-error-600">
                  {attendanceData.todayAttendance.absent}
                </div>
                <div className="text-sm text-error-600 font-medium">결석</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 오늘의 수업 일정 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white/90">오늘의 수업</h3>
          <Link 
            href="/classes" 
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            전체보기
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : attendanceData.upcomingClasses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-gray-500">오늘 예정된 수업이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1">
            {attendanceData.upcomingClasses.map((classItem) => (
              <Link
                key={classItem.id}
                href={`/classes/${classItem.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center">
                  <span className="text-brand-600 text-lg">📚</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                    {classItem.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {classItem.subject} • {classItem.classroom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {classItem.instructors?.name} • 
                    {classItem.class_schedules?.[0]?.start_time} - {classItem.class_schedules?.[0]?.end_time}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}