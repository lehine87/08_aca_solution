'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { PlusIcon, AcademicCapIcon, UserGroupIcon, ClockIcon, CurrencyDollarIcon, MapPinIcon, CalendarIcon, PencilSquareIcon, EyeIcon, TrashIcon } from '@/components/icons'

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

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

  // 클래스 삭제 함수
  const deleteClass = async (classId, className) => {
    // 확인 대화상자
    const confirmMessage = `정말로 '${className}' 클래스를 삭제하시겠습니까?\n\n⚠️ 주의사항:\n• 클래스와 관련된 모든 데이터가 삭제됩니다\n• 수업 스케줄이 모두 삭제됩니다\n• 학생 등록 정보가 모두 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log('🗑️ 클래스 삭제 중...', classId)

      // 클래스 삭제 (CASCADE로 관련 데이터 자동 삭제)
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error

      // 로컬 상태에서도 제거 (화면 즉시 업데이트)
      setClasses(classes.filter(cls => cls.id !== classId))
      
      console.log('✅ 클래스 삭제 완료')
      alert(`${className} 클래스가 성공적으로 삭제되었습니다.`)

    } catch (err) {
      console.error('❌ 클래스 삭제 오류:', err)
      alert(`클래스 삭제 중 오류가 발생했습니다: ${err.message}`)
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

  // 상태 필터링
  const filteredClasses = classes.filter(cls => {
    if (filter === 'all') return true
    return cls.status === filter
  })

  // 필터 옵션
  const filterOptions = [
    { value: 'all', label: '전체', count: classes.length },
    { value: 'active', label: '진행중', count: classes.filter(c => c.status === 'active').length },
    { value: 'completed', label: '종료', count: classes.filter(c => c.status === 'completed').length },
    { value: 'pending', label: '개설예정', count: classes.filter(c => c.status === 'pending').length }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">클래스 목록을 불러오는 중...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">클래스 관리</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              총 {filteredClasses.length}개의 클래스가 등록되어 있습니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/classes/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              새 클래스
            </Link>
            <Link
              href="/instructors"
              className="inline-flex items-center gap-2 px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium transition-colors"
            >
              <UserGroupIcon className="w-5 h-5" />
              강사 관리
            </Link>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap gap-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-brand-50 text-brand-600 border border-brand-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4">
            <p className="text-error-600 font-medium">오류가 발생했습니다: {error}</p>
          </div>
        )}

        {/* 클래스 목록 */}
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
              {filter === 'all' ? '등록된 클래스가 없습니다' : '해당 조건의 클래스가 없습니다'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' ? '첫 번째 클래스를 만들어보세요!' : '다른 필터를 선택해보세요.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/classes/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                첫 클래스 생성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-all dark:border-gray-800 dark:bg-white/[0.03]">
                  {/* 클래스 헤더 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">
                        {classItem.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-200">
                        {classItem.subject}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      classItem.status === 'active' 
                        ? 'bg-success-50 text-success-600 border-success-200' 
                        : classItem.status === 'completed'
                        ? 'bg-gray-50 text-gray-600 border-gray-200'
                        : 'bg-warning-50 text-warning-600 border-warning-200'
                    }`}>
                      {classItem.status === 'active' ? '진행중' : classItem.status === 'completed' ? '종료' : '개설예정'}
                    </span>
                  </div>

                  {/* 클래스 정보 */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium w-12">강사:</span>
                      <span className="text-gray-900 dark:text-white/90">{classItem.instructors?.name || '미배정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <AcademicCapIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium w-12">학년:</span>
                      <span className="text-gray-900 dark:text-white/90">{classItem.grade_level || '전체'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium w-12">교실:</span>
                      <span className="text-gray-900 dark:text-white/90">{classItem.classroom || '미정'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium w-12">정원:</span>
                      <span className="text-gray-900 dark:text-white/90">
                        <span className="font-semibold text-brand-600">{classItem.class_students?.length || 0}</span>
                        /{classItem.max_students}명
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium w-12">수강료:</span>
                      <span className="text-gray-900 dark:text-white/90 font-semibold">{classItem.monthly_fee?.toLocaleString() || 0}원</span>
                    </div>
                  </div>

                  {/* 수업 시간 */}
                  <div className="mb-6">
                    <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      수업 시간
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white/90">
                        {formatSchedule(classItem.class_schedules)}
                      </p>
                    </div>
                  </div>

                  {/* 등록 학생 */}
                  {classItem.class_students && classItem.class_students.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        등록 학생
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {classItem.class_students.slice(0, 3).map((cs, index) => (
                          <span key={index} className="inline-block px-2.5 py-1 text-xs bg-brand-50 text-brand-600 rounded-lg border border-brand-200">
                            {cs.students?.name}
                          </span>
                        ))}
                        {classItem.class_students.length > 3 && (
                          <span className="inline-block px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg">
                            +{classItem.class_students.length - 3}명
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* 첫 번째 줄 */}
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href={`/attendance/class/${classItem.id}`}
                        className="flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 py-2 px-3 rounded-lg font-medium text-sm transition-colors border border-purple-200"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        출결
                      </Link>
                      <Link
                        href={`/classes/${classItem.id}/edit`}
                        className="flex items-center justify-center gap-1 bg-brand-50 hover:bg-brand-100 text-brand-600 py-2 px-3 rounded-lg font-medium text-sm transition-colors border border-brand-200"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        수정
                      </Link>
                      <Link
                        href={`/classes/${classItem.id}`}
                        className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-3 rounded-lg font-medium text-sm transition-colors border border-gray-200"
                      >
                        <EyeIcon className="w-4 h-4" />
                        상세
                      </Link>
                    </div>
                    
                    {/* 두 번째 줄 - 삭제 버튼 */}
                    <button
                      onClick={() => deleteClass(classItem.id, classItem.name)}
                      className="w-full flex items-center justify-center gap-2 bg-error-50 hover:bg-error-100 text-error-600 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors border border-error-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                      클래스 삭제
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}