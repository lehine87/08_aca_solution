'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function InstructorDetailPage() {
  const params = useParams()
  const instructorId = params.id

  // 상태 관리
  const [instructor, setInstructor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'classes', 'schedule', 'salary'

  // 페이지 로드시 강사 정보 가져오기
  useEffect(() => {
    if (instructorId) {
      fetchInstructorDetail()
    }
  }, [instructorId])

  // 강사 상세 정보 조회
  const fetchInstructorDetail = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('🔍 강사 상세 정보 조회 중...', instructorId)

      // 강사 정보와 관련된 모든 데이터를 한 번에 조회
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          *,
          classes (
            id,
            name,
            subject,
            grade,
            classroom,
            max_students,
            status,
            created_at,
            students_classes (
              student_id,
              students (
                id,
                name,
                grade,
                status
              )
            ),
            class_schedules (
              id,
              day_of_week,
              start_time,
              end_time
            )
          )
        `)
        .eq('id', instructorId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('강사를 찾을 수 없습니다.')
          return
        }
        throw error
      }

      if (!data) {
        setError('강사 정보가 존재하지 않습니다.')
        return
      }

      setInstructor(data)
      console.log('✅ 강사 상세 정보 로딩 완료:', data)

    } catch (err) {
      console.error('❌ 강사 상세 정보 조회 오류:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 상태 뱃지 스타일
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      active: '재직중',
      inactive: '퇴사',
      on_leave: '휴직중'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  // 클래스 상태 뱃지
  const getClassStatusBadge = (status) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-800'
    }
    const labels = {
      active: '진행중',
      completed: '완료',
      cancelled: '취소됨'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  // 요일 변환
  const getDayLabel = (day) => {
    const days = {
      'monday': '월',
      'tuesday': '화',
      'wednesday': '수',
      'thursday': '목',
      'friday': '금',
      'saturday': '토',
      'sunday': '일'
    }
    return days[day] || day
  }

  // 시간 포맷팅
  const formatTime = (time) => {
    if (!time) return '-'
    return time.slice(0, 5) // HH:MM 형식으로 변환
  }

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">강사 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 오류 화면
  if (error || !instructor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-6">👨‍🏫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">강사를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            {error || '요청하신 강사 정보가 존재하지 않거나 삭제되었을 수 있습니다.'}
          </p>
          <div className="space-x-4">
            <Link
              href="/instructors"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              강사 목록으로
            </Link>
            <Link
              href="/instructors/new"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              새 강사 등록
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 통계 계산
  const activeClasses = instructor.classes?.filter(cls => cls.status === 'active') || []
  const totalStudents = activeClasses.reduce((sum, cls) => sum + (cls.students_classes?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/instructors"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← 강사 목록
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">👨‍🏫 {instructor.name}</h1>
                <p className="mt-1 text-gray-600">{instructor.subject_specialty || '전공 미설정'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(instructor.status)}
              <Link
                href={`/instructors/${instructor.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ✏️ 수정
              </Link>
            </div>
          </div>
        </div>

        {/* 핵심 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{activeClasses.length}</p>
                <p className="text-sm text-gray-600">담당 클래스</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-600">담당 학생 수</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {instructor.hire_date ? 
                    Math.floor((new Date() - new Date(instructor.hire_date)) / (1000 * 60 * 60 * 24 * 30)) : '-'
                  }
                </p>
                <p className="text-sm text-gray-600">근무 개월</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 기본정보
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'classes'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📚 담당 클래스 ({activeClasses.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedule'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ⏰ 시간표
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'salary'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💰 급여정보
              </button>
            </nav>
          </div>

          {/* 탭 내용 */}
          <div className="p-6">
            
            {/* 기본정보 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 개인 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">👤 개인정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">강사명</label>
                        <p className="text-lg font-semibold text-gray-900">{instructor.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                        {getStatusBadge(instructor.status)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                        <p className="text-gray-900">{instructor.phone || '미등록'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <p className="text-gray-900 break-all">{instructor.email || '미등록'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">전공/담당과목</label>
                        <p className="text-gray-900">{instructor.subject_specialty || '미설정'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                        <p className="text-gray-900">
                          {instructor.hire_date ? 
                            new Date(instructor.hire_date).toLocaleDateString() : '미설정'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {instructor.memo && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">📝 메모</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{instructor.memo}</p>
                    </div>
                  </div>
                )}

                {/* 등록 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📅 시스템 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600 mb-1">등록일시</label>
                        <p className="text-gray-900">
                          {new Date(instructor.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">수정일시</label>
                        <p className="text-gray-900">
                          {instructor.updated_at ? 
                            new Date(instructor.updated_at).toLocaleString() : '수정된 적 없음'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-1">강사 ID</label>
                        <p className="text-gray-900 font-mono">#{instructor.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 담당 클래스 탭 */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">📚 담당 클래스 ({activeClasses.length}개)</h3>
                  <Link
                    href="/classes/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    + 새 클래스 생성
                  </Link>
                </div>

                {activeClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📚</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">담당 클래스가 없습니다</h4>
                    <p className="text-gray-600 mb-4">새로운 클래스를 생성하거나 기존 클래스에 강사를 배정해보세요.</p>
                    <Link
                      href="/classes"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      클래스 관리로 이동
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeClasses.map((cls) => (
                      <div key={cls.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{cls.name}</h4>
                              <StatusBadge status={cls.status}>{getClassStatusLabel(cls.status)}</StatusBadge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">과목:</span>
                                <span className="ml-2 font-medium">{cls.subject || '미설정'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">학년:</span>
                                <span className="ml-2 font-medium">{cls.grade || '미설정'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">교실:</span>
                                <span className="ml-2 font-medium">{cls.classroom || '미설정'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">학생 수:</span>
                                <span className="ml-2 font-medium text-blue-600">
                                  {cls.students_classes?.length || 0} / {cls.max_students || '∞'}
                                </span>
                              </div>
                            </div>

                            {/* 시간표 미리보기 */}
                            {cls.class_schedules && cls.class_schedules.length > 0 && (
                              <div className="mt-3">
                                <span className="text-gray-600 text-sm">수업시간:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {cls.class_schedules.map((schedule, index) => (
                                    <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {getDayLabel(schedule.day_of_week)} {formatTime(schedule.start_time)}-{formatTime(schedule.end_time)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-2 ml-4">
                            <Link
                              href={`/classes/${cls.id}`}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              상세
                            </Link>
                            <Link
                              href={`/attendance/class/${cls.id}`}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              출결
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 시간표 탭 */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">⏰ 주간 시간표</h3>
                
                {/* 시간표 테이블 */}
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">시간</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">월</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">화</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">수</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">목</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">금</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">토</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 시간대별 스케줄 표시 */}
                      {Array.from({ length: 14 }, (_, i) => {
                        const hour = 9 + i
                        const timeSlot = `${hour.toString().padStart(2, '0')}:00`
                        
                        return (
                          <tr key={timeSlot} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-sm text-gray-600 font-medium">{timeSlot}</td>
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                              const dayClasses = activeClasses.filter(cls => 
                                cls.class_schedules?.some(schedule => 
                                  schedule.day_of_week === day &&
                                  hour >= parseInt(schedule.start_time.split(':')[0]) &&
                                  hour < parseInt(schedule.end_time.split(':')[0])
                                )
                              )
                              
                              return (
                                <td key={day} className="py-2 px-1 text-center">
                                  {dayClasses.map((cls, index) => (
                                    <div key={index} className="bg-blue-100 text-blue-700 text-xs p-1 rounded mb-1">
                                      <div className="font-medium truncate" title={cls.name}>
                                        {cls.name}
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {cls.classroom}
                                      </div>
                                    </div>
                                  ))}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 스케줄 요약 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📊 스케줄 요약</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">주간 수업:</span>
                      <span className="ml-2 font-bold">
                        {activeClasses.reduce((sum, cls) => 
                          sum + (cls.class_schedules?.length || 0), 0)}회
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">수업 일수:</span>
                      <span className="ml-2 font-bold">
                        {new Set(activeClasses.flatMap(cls => 
                          cls.class_schedules?.map(s => s.day_of_week) || []
                        )).size}일
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">가장 이른 수업:</span>
                      <span className="ml-2 font-bold">
                        {activeClasses
                          .flatMap(cls => cls.class_schedules?.map(s => s.start_time) || [])
                          .sort()[0] || '-'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">가장 늦은 수업:</span>
                      <span className="ml-2 font-bold">
                        {activeClasses
                          .flatMap(cls => cls.class_schedules?.map(s => s.end_time) || [])
                          .sort()
                          .reverse()[0] || '-'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 급여정보 탭 */}
            {activeTab === 'salary' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">💰 급여 정보</h3>
                  <button
                    disabled
                    className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    🚧 개발 예정
                  </button>
                </div>

                {/* 급여 정보 미리보기 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-yellow-600 text-xl mr-2">🚧</span>
                    <h4 className="font-medium text-yellow-900">급여 관리 시스템 개발 중</h4>
                  </div>
                  <p className="text-yellow-800 text-sm mb-4">
                    다음 버전에서 다음 기능들이 추가될 예정입니다:
                  </p>
                  <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                    <li>시급제/월급제/수업당 등 다양한 급여 체계</li>
                    <li>자동 급여 계산 (출근일수, 수업 횟수 기반)</li>
                    <li>원천징수 및 4대보험 자동 계산</li>
                    <li>급여 지급 내역 관리</li>
                    <li>급여명세서 자동 생성</li>
                    <li>연말정산 데이터 제공</li>
                  </ul>
                </div>

                {/* 임시 급여 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">기본 급여 정보 (수동 관리)</h4>
                  <div className="text-sm text-gray-600">
                    현재는 기본적인 메모 기능만 제공됩니다. 
                    상세한 급여 정보는 강사 수정 페이지의 메모 란을 활용해주세요.
                  </div>
                  
                  {instructor.memo && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <label className="block text-gray-700 text-sm font-medium mb-1">현재 메모:</label>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{instructor.memo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 액션 버튼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ 빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href={`/instructors/${instructor.id}/edit`}
              className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2">✏️</span>
              정보 수정
            </Link>
            <Link
              href={`/classes?instructor=${instructor.id}`}
              className="flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2">📚</span>
              클래스 관리
            </Link>
            <Link
              href="/attendance"
              className="flex items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2">📋</span>
              출결 관리
            </Link>
            <Link
              href="/classes/new"
              className="flex items-center justify-center bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2">➕</span>
              클래스 생성
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}