'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id

  // 상태 관리
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classNotFound, setClassNotFound] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [enrolling, setEnrolling] = useState(false)

  // 페이지 로드시 데이터 가져오기
  useEffect(() => {
    if (classId) {
      fetchClassDetail()
    }
  }, [classId])

  // 클래스 상세 정보 조회
  const fetchClassDetail = async () => {
    try {
      setLoading(true)
      setError('')

      // 클래스 기본 정보 조회
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(id, name, subject_specialty, phone, email),
          class_schedules(id, day_of_week, start_time, end_time),
          class_students(
            id, 
            enrollment_date, 
            status,
            students(id, name, phone, parent_phone, grade)
          )
        `)
        .eq('id', classId)
        .single()

      if (classError) {
        if (classError.code === 'PGRST116') {
          setClassNotFound(true)
          return
        }
        throw classError
      }

      if (!classInfo) {
        setClassNotFound(true)
        return
      }

      setClassData(classInfo)
      setStudents(classInfo.class_students || [])

      console.log('✅ 클래스 상세 정보 로딩 완료:', classInfo)

    } catch (err) {
      setError(err.message)
      console.error('❌ 클래스 상세 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 등록 가능한 학생 목록 조회
  const fetchAvailableStudents = async () => {
    try {
      // 현재 클래스에 등록되지 않은 활성 학생들 조회
      const enrolledStudentIds = students.map(cs => cs.students.id)
      
      let query = supabase
        .from('students')
        .select('id, name, grade, phone, parent_phone')
        .eq('status', 'active')
        .order('name')

      if (enrolledStudentIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledStudentIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error
      setAvailableStudents(data || [])

    } catch (error) {
      console.error('등록 가능한 학생 조회 오류:', error)
      alert(`학생 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  // 학생 등록 모달 열기
  const openStudentModal = () => {
    fetchAvailableStudents()
    setShowStudentModal(true)
    setSelectedStudents([])
  }

  // 학생 선택 토글
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  // 선택된 학생들 등록
  const enrollSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      alert('등록할 학생을 선택해주세요.')
      return
    }

    setEnrolling(true)
    
    try {
      const enrollmentData = selectedStudents.map(studentId => ({
        class_id: classId,
        student_id: studentId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      }))

      const { error } = await supabase
        .from('class_students')
        .insert(enrollmentData)

      if (error) throw error

      alert(`${selectedStudents.length}명의 학생이 성공적으로 등록되었습니다!`)
      setShowStudentModal(false)
      fetchClassDetail() // 데이터 새로고침

    } catch (error) {
      console.error('학생 등록 오류:', error)
      alert(`학생 등록 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setEnrolling(false)
    }
  }

  // 학생 등록 해제
  const unenrollStudent = async (enrollmentId, studentName) => {
    if (!confirm(`정말로 '${studentName}' 학생의 등록을 해제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error

      alert(`${studentName} 학생의 등록이 해제되었습니다.`)
      fetchClassDetail() // 데이터 새로고침

    } catch (error) {
      console.error('등록 해제 오류:', error)
      alert(`등록 해제 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  // 클래스 삭제 함수
  const deleteClass = async () => {
    if (!classData) return

    // 확인 대화상자
    const confirmMessage = `정말로 '${classData.name}' 클래스를 삭제하시겠습니까?\n\n⚠️ 주의사항:\n• 클래스와 관련된 모든 데이터가 삭제됩니다\n• 수업 스케줄이 모두 삭제됩니다\n• 등록된 ${students.length}명 학생의 등록 정보가 모두 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다`
    
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

      console.log('✅ 클래스 삭제 완료')
      alert(`${classData.name} 클래스가 성공적으로 삭제되었습니다.`)
      
      // 클래스 목록으로 이동
      router.push('/classes')

    } catch (error) {
      console.error('❌ 클래스 삭제 오류:', error)
      alert(`클래스 삭제 중 오류가 발생했습니다: ${error.message}`)
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

  // 상태 뱃지 스타일
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      preparing: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      active: '진행중',
      inactive: '종료',
      preparing: '준비중'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">클래스 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 클래스를 찾을 수 없는 경우
  if (classNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">클래스를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            요청하신 클래스 정보가 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
          <div className="space-x-4">
            <Link
              href="/classes"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              클래스 목록으로
            </Link>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900">📚 {classData?.name}</h1>
              <p className="mt-1 text-gray-600">클래스 상세 정보</p>
            </div>
            <div className="space-x-3">
              <Link
                href={`/classes/${classId}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ✏️ 수정
              </Link>
              <Link
                href="/classes"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← 목록으로
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

        {classData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 클래스 기본 정보 */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 기본 정보 카드 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">📋 기본 정보</h2>
                  {getStatusBadge(classData.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">클래스명</label>
                      <p className="text-gray-900 font-medium">{classData.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">과목</label>
                      <p className="text-gray-900">{classData.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">대상 학년</label>
                      <p className="text-gray-900">{classData.grade_level || '전체'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">교실</label>
                      <p className="text-gray-900">{classData.classroom || '미정'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">정원</label>
                      <p className="text-gray-900">
                        <span className="text-blue-600 font-medium">{students.length}</span>
                        <span className="text-gray-400"> / {classData.max_students}명</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">월 수강료</label>
                      <p className="text-gray-900 font-medium">
                        {classData.monthly_fee ? `${classData.monthly_fee.toLocaleString()}원` : '미설정'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">운영 기간</label>
                      <p className="text-gray-900">
                        {classData.start_date ? new Date(classData.start_date).toLocaleDateString() : '-'} ~ {classData.end_date ? new Date(classData.end_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {classData.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-500">클래스 설명</label>
                    <p className="mt-1 text-gray-900">{classData.description}</p>
                  </div>
                )}
              </div>

              {/* 강사 정보 카드 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">👨‍🏫 담당 강사</h2>
                {classData.instructors ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">👨‍🏫</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{classData.instructors.name}</h3>
                      <p className="text-sm text-gray-600">{classData.instructors.subject_specialty}</p>
                      <div className="mt-1 space-x-4 text-sm text-gray-500">
                        {classData.instructors.phone && (
                          <span>📞 {classData.instructors.phone}</span>
                        )}
                        {classData.instructors.email && (
                          <span>📧 {classData.instructors.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>담당 강사가 배정되지 않았습니다</p>
                    <Link
                      href={`/classes/${classId}/edit`}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      강사 배정하기 →
                    </Link>
                  </div>
                )}
              </div>

              {/* 수업 시간 카드 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 수업 시간</h2>
                {classData.class_schedules && classData.class_schedules.length > 0 ? (
                  <div className="space-y-3">
                    {classData.class_schedules
                      .sort((a, b) => a.day_of_week - b.day_of_week)
                      .map((schedule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {getDayName(schedule.day_of_week)}
                          </span>
                          <span className="font-medium">
                            {schedule.start_time.slice(0,5)} - {schedule.end_time.slice(0,5)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {Math.round((new Date(`1970-01-01T${schedule.end_time}`) - new Date(`1970-01-01T${schedule.start_time}`)) / (1000 * 60))}분
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>수업 시간이 설정되지 않았습니다</p>
                    <Link
                      href={`/classes/${classId}/edit`}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      수업 시간 설정하기 →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 등록 학생 목록 */}
            <div className="space-y-6">
              
              {/* 학생 목록 카드 */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">🎒 등록 학생 ({students.length}명)</h2>
                    <button
                      onClick={openStudentModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      ➕ 학생 추가
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {students.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {students.map((enrollment) => (
                        <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{enrollment.students.name}</h3>
                              <p className="text-sm text-gray-600">{enrollment.students.grade}</p>
                              <div className="mt-1 text-xs text-gray-500">
                                <p>📞 {enrollment.students.parent_phone}</p>
                                <p>📅 등록일: {new Date(enrollment.enrollment_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                enrollment.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {enrollment.status === 'active' ? '활성' : '비활성'}
                              </span>
                              <button
                                onClick={() => unenrollStudent(enrollment.id, enrollment.students.name)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                등록 해제
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>등록된 학생이 없습니다</p>
                      <button
                        onClick={openStudentModal}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        첫 학생 등록하기 →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 빠른 액션 카드 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 빠른 액션</h2>
                <div className="space-y-3">
                  <Link
                    href={`/attendance/class/${classId}`}
                    className="block w-full text-center bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded font-medium transition-colors"
                  >
                    📋 출결 관리
                  </Link>
                  <Link
                    href={`/classes/${classId}/edit`}
                    className="block w-full text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded font-medium transition-colors"
                  >
                    ✏️ 클래스 수정
                  </Link>
                  <button className="w-full text-center bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded font-medium transition-colors">
                    📊 성적 관리
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학생 등록 모달 */}
        {showStudentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 flex flex-col">
              
              {/* 모달 헤더 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">학생 등록</h3>
                  <button
                    onClick={() => setShowStudentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  등록할 학생을 선택하세요 (선택: {selectedStudents.length}명)
                </p>
              </div>

              {/* 모달 내용 */}
              <div className="flex-1 overflow-y-auto p-6">
                {availableStudents.length > 0 ? (
                  <div className="space-y-2">
                    {availableStudents.map((student) => (
                      <div key={student.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`student-${student.id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.grade}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              📞 {student.parent_phone}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>등록 가능한 학생이 없습니다</p>
                    <Link
                      href="/students/new"
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      새 학생 등록하기 →
                    </Link>
                  </div>
                )}
              </div>

              {/* 모달 버튼 */}
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={enrollSelectedStudents}
                  disabled={selectedStudents.length === 0 || enrolling}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  {enrolling ? '등록 중...' : `${selectedStudents.length}명 등록`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}