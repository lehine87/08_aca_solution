'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError('')

      // 클래스 정보와 관련 데이터 조인하여 가져오기
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(name),
          class_schedules(day_of_week, start_time, end_time),
          class_students(student_id, students(name))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setClasses(data || [])
    } catch (err) {
      setError(err.message)
      console.error('클래스 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 요일 변환 함수
  const getDayName = (dayNumber) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[dayNumber]
  }

  // 수업 시간 포맷팅
  const formatSchedule = (schedules) => {
    if (!schedules || schedules.length === 0) return '시간 미설정'
    
    return schedules
      .sort((a, b) => a.day_of_week - b.day_of_week)
      .map(schedule => 
        `${getDayName(schedule.day_of_week)} ${schedule.start_time.slice(0,5)}-${schedule.end_time.slice(0,5)}`
      )
      .join(', ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">클래스 목록을 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">📚 클래스 관리</h1>
              <p className="mt-1 text-gray-600">
                등록된 클래스 {classes.length}개
              </p>
            </div>
            <div className="space-x-3">
              <Link
                href="/classes/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 새 클래스
              </Link>
              <Link
                href="/instructors"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                👨‍🏫 강사 관리
              </Link>
            </div>
          </div>

          {/* 빠른 메뉴 */}
          <div className="mt-4 flex space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              🏠 홈으로
            </Link>
            <Link href="/students" className="text-gray-600 hover:text-gray-800">
              👥 학생 관리
            </Link>
            <Link href="/attendance" className="text-purple-600 hover:text-purple-800 font-medium">
              📋 출결 관리
            </Link>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 클래스 목록 */}
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 클래스가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 클래스를 만들어보세요!
            </p>
            <Link
              href="/classes/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ 첫 클래스 생성하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  
                  {/* 클래스 헤더 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {classItem.name}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {classItem.subject}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      classItem.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {classItem.status === 'active' ? '진행중' : '종료'}
                    </span>
                  </div>

                  {/* 클래스 정보 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">👨‍🏫 강사:</span>
                      <span>{classItem.instructors?.name || '미배정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">🎓 학년:</span>
                      <span>{classItem.grade_level || '전체'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">🏠 교실:</span>
                      <span>{classItem.classroom || '미정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">👥 정원:</span>
                      <span>{classItem.class_students?.length || 0}/{classItem.max_students}명</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">💰 수강료:</span>
                      <span>{classItem.monthly_fee?.toLocaleString() || 0}원</span>
                    </div>
                  </div>

                  {/* 수업 시간 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">📅 수업 시간</p>
                    <p className="text-sm text-gray-600">
                      {formatSchedule(classItem.class_schedules)}
                    </p>
                  </div>

                  {/* 등록 학생 */}
                  {classItem.class_students && classItem.class_students.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">🎒 등록 학생</p>
                      <div className="flex flex-wrap gap-1">
                        {classItem.class_students.slice(0, 3).map((cs, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {cs.students?.name}
                          </span>
                        ))}
                        {classItem.class_students.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{classItem.class_students.length - 3}명
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/attendance/class/${classItem.id}`}
                      className="flex-1 text-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      📋 출결
                    </Link>
                    <Link
                      href={`/classes/${classItem.id}/edit`}
                      className="flex-1 text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      ✏️ 수정
                    </Link>
                    <Link
                      href={`/classes/${classItem.id}`}
                      className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                    >
                      👁️ 상세
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}