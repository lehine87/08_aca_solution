'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AttendanceStatsPage() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayAttendance: { present: 0, absent: 0, late: 0, early_leave: 0 },
    weeklyStats: [],
    classStats: [],
    studentStats: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('week') // 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAttendanceStats()
  }, [selectedPeriod, selectedDate])

  // 출결 통계 데이터 조회
  const fetchAttendanceStats = async () => {
    try {
      setLoading(true)
      setError('')

      // 병렬로 모든 통계 데이터 조회
      const [
        totalClassesResult,
        totalStudentsResult,
        todayAttendanceResult,
        weeklyStatsResult,
        classStatsResult,
        studentStatsResult
      ] = await Promise.all([
        // 전체 클래스 수
        supabase.from('classes').select('*', { count: 'exact' }).eq('status', 'active'),
        
        // 전체 학생 수
        supabase.from('students').select('*', { count: 'exact' }).eq('status', 'active'),
        
        // 오늘 출결 현황
        getTodayAttendanceStats(),
        
        // 주간 출결 통계
        getWeeklyStats(),
        
        // 클래스별 출결 현황
        getClassStats(),
        
        // 학생별 출석률
        getStudentStats()
      ])

      setStats({
        totalClasses: totalClassesResult.count || 0,
        totalStudents: totalStudentsResult.count || 0,
        todayAttendance: todayAttendanceResult,
        weeklyStats: weeklyStatsResult,
        classStats: classStatsResult,
        studentStats: studentStatsResult
      })

      console.log('✅ 출결 통계 로딩 완료')

    } catch (err) {
      setError(err.message)
      console.error('❌ 통계 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 오늘 출결 현황 조회
  const getTodayAttendanceStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('attendance_date', today)

      if (error) throw error

      const stats = { present: 0, absent: 0, late: 0, early_leave: 0 }
      data?.forEach(record => {
        if (stats.hasOwnProperty(record.status)) {
          stats[record.status]++
        }
      })

      return stats
    } catch (error) {
      console.error('오늘 출결 통계 조회 오류:', error)
      return { present: 0, absent: 0, late: 0, early_leave: 0 }
    }
  }

  // 주간 출결 통계 조회
  const getWeeklyStats = async () => {
    try {
      const endDate = new Date(selectedDate)
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6) // 최근 7일

      const { data, error } = await supabase
        .from('attendance')
        .select('attendance_date, status')
        .gte('attendance_date', startDate.toISOString().split('T')[0])
        .lte('attendance_date', endDate.toISOString().split('T')[0])
        .order('attendance_date')

      if (error) throw error

      // 날짜별로 그룹화
      const dailyStats = {}
      
      // 지난 7일 날짜 초기화
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        dailyStats[dateStr] = { date: dateStr, present: 0, absent: 0, late: 0, early_leave: 0 }
      }

      // 데이터 집계
      data?.forEach(record => {
        const date = record.attendance_date
        if (dailyStats[date] && dailyStats[date].hasOwnProperty(record.status)) {
          dailyStats[date][record.status]++
        }
      })

      return Object.values(dailyStats)
    } catch (error) {
      console.error('주간 통계 조회 오류:', error)
      return []
    }
  }

  // 클래스별 출결 현황 조회
  const getClassStats = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          class_students(count),
          attendance(status, attendance_date)
        `)
        .eq('status', 'active')

      if (error) throw error

      const classStats = data?.map(cls => {
        const totalStudents = cls.class_students?.[0]?.count || 0
        const attendanceRecords = cls.attendance || []
        
        // 최근 30일 출결률 계산
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentAttendance = attendanceRecords.filter(record => 
          new Date(record.attendance_date) >= thirtyDaysAgo
        )

        const stats = { present: 0, absent: 0, late: 0, early_leave: 0 }
        recentAttendance.forEach(record => {
          if (stats.hasOwnProperty(record.status)) {
            stats[record.status]++
          }
        })

        const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
        const attendanceRate = totalRecords > 0 ? Math.round((stats.present / totalRecords) * 100) : 0

        return {
          id: cls.id,
          name: cls.name,
          totalStudents,
          attendanceRate,
          recentStats: stats
        }
      }) || []

      return classStats.sort((a, b) => b.attendanceRate - a.attendanceRate)
    } catch (error) {
      console.error('클래스별 통계 조회 오류:', error)
      return []
    }
  }

  // 학생별 출석률 조회
  const getStudentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          grade,
          attendance(status, attendance_date)
        `)
        .eq('status', 'active')

      if (error) throw error

      const studentStats = data?.map(student => {
        const attendanceRecords = student.attendance || []
        
        // 최근 30일 출결 기록
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentAttendance = attendanceRecords.filter(record => 
          new Date(record.attendance_date) >= thirtyDaysAgo
        )

        const stats = { present: 0, absent: 0, late: 0, early_leave: 0 }
        recentAttendance.forEach(record => {
          if (stats.hasOwnProperty(record.status)) {
            stats[record.status]++
          }
        })

        const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
        const attendanceRate = totalRecords > 0 ? Math.round((stats.present / totalRecords) * 100) : 0

        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          attendanceRate,
          totalDays: totalRecords,
          stats
        }
      }) || []

      // 출석률 기준 정렬 (낮은 순서)
      return studentStats.sort((a, b) => a.attendanceRate - b.attendanceRate)
    } catch (error) {
      console.error('학생별 통계 조회 오류:', error)
      return []
    }
  }

  // 출석률 색상 반환
  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 80) return 'text-yellow-600'
    if (rate >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  // 출석률 배경 색상 반환
  const getAttendanceRateBg = (rate) => {
    if (rate >= 90) return 'bg-green-100'
    if (rate >= 80) return 'bg-yellow-100'
    if (rate >= 70) return 'bg-orange-100'
    return 'bg-red-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">출결 통계를 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">📊 출결 통계</h1>
              <p className="mt-1 text-gray-600">출석 현황 및 통계 분석</p>
            </div>
            <div className="space-x-3">
              <Link
                href="/attendance"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📋 출결 관리
              </Link>
              <Link
                href="/classes"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📚 클래스 관리
              </Link>
            </div>
          </div>

          {/* 필터 */}
          <div className="mt-4 flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 전체 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📚</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 클래스</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 학생</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 출석</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayAttendance.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 결석</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayAttendance.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘 출결 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* 오늘 출결 차트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📅 오늘 출결 현황</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✅ {stats.todayAttendance.present}</div>
                <div className="text-sm text-green-700">출석</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">❌ {stats.todayAttendance.absent}</div>
                <div className="text-sm text-red-700">결석</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">⏰ {stats.todayAttendance.late}</div>
                <div className="text-sm text-yellow-700">지각</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">🏃 {stats.todayAttendance.early_leave}</div>
                <div className="text-sm text-blue-700">조퇴</div>
              </div>
            </div>
          </div>

          {/* 주간 출결 트렌드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 주간 출석 트렌드</h3>
            <div className="space-y-3">
              {stats.weeklyStats.map((day, index) => {
                const total = day.present + day.absent + day.late + day.early_leave
                const attendanceRate = total > 0 ? Math.round((day.present / total) * 100) : 0
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      {new Date(day.date).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${attendanceRate}%` }}
                        ></div>
                      </div>
                      <div className="text-sm font-medium text-gray-600 w-12">
                        {attendanceRate}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 클래스별 출결 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📚 클래스별 출석률</h3>
              <div className="space-y-4">
                {stats.classStats.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{cls.name}</div>
                      <div className="text-sm text-gray-500">학생 {cls.totalStudents}명</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getAttendanceRateColor(cls.attendanceRate)}`}>
                        {cls.attendanceRate}%
                      </div>
                      <Link
                        href={`/classes/${cls.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        상세보기
                      </Link>
                    </div>
                  </div>
                ))}
                {stats.classStats.length > 5 && (
                  <div className="pt-2 text-center">
                    <Link
                      href="/classes"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      모든 클래스 보기 →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 출석률 낮은 학생들 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚠️ 출석률 관리 대상</h3>
              <div className="space-y-3">
                {stats.studentStats.filter(student => student.attendanceRate < 80).slice(0, 5).map((student) => (
                  <div key={student.id} className={`p-3 rounded-lg ${getAttendanceRateBg(student.attendanceRate)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.grade} • 출결 {student.totalDays}일</div>
                      </div>
                      <div className={`text-lg font-bold ${getAttendanceRateColor(student.attendanceRate)}`}>
                        {student.attendanceRate}%
                      </div>
                    </div>
                    <div className="mt-2 flex space-x-2 text-xs">
                      <span className="text-green-600">출석 {student.stats.present}</span>
                      <span className="text-red-600">결석 {student.stats.absent}</span>
                      <span className="text-yellow-600">지각 {student.stats.late}</span>
                    </div>
                  </div>
                ))}
                {stats.studentStats.filter(student => student.attendanceRate < 80).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <p>모든 학생의 출석률이 80% 이상입니다!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 출결 통계 안내</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 통계는 최근 30일 데이터를 기준으로 계산됩니다</li>
            <li>• 출석률 90% 이상: 우수, 80% 이상: 양호, 70% 이상: 주의, 70% 미만: 관리 필요</li>
            <li>• 클래스별/학생별 상세 정보는 해당 링크를 클릭하여 확인하세요</li>
            <li>• 출석률이 낮은 학생은 별도 상담이 필요할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}