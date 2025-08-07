'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { ArrowLeftIcon, ClipboardDocumentCheckIcon, UserIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArrowRightOnRectangleIcon, UserGroupIcon, CalendarIcon, BookmarkIcon } from '@/components/icons'

export default function ClassAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const classId = params.id
  const attendanceDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

  // 상태 관리
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [classNotFound, setClassNotFound] = useState(false)

  // 출결 상태 옵션
  const attendanceStatusOptions = [
    { value: 'present', label: '출석', color: 'bg-success-50 text-success-600 border-success-200', icon: CheckCircleIcon },
    { value: 'absent', label: '결석', color: 'bg-error-50 text-error-600 border-error-200', icon: XCircleIcon },
    { value: 'late', label: '지각', color: 'bg-warning-50 text-warning-600 border-warning-200', icon: ClockIcon },
    { value: 'early_leave', label: '조퇴', color: 'bg-brand-50 text-brand-600 border-brand-200', icon: ArrowRightOnRectangleIcon }
  ]

  // 페이지 로드시 데이터 가져오기
  useEffect(() => {
    if (classId) {
      fetchClassAndStudents()
    }
  }, [classId, attendanceDate])

  // 클래스와 학생 정보 조회
  const fetchClassAndStudents = async () => {
    try {
      setLoading(true)
      setError('')

      // 클래스 정보와 등록 학생들 조회
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          instructors!main_instructor_id(id, name),
          class_schedules(day_of_week, start_time, end_time),
          class_students(
            id,
            student_id,
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
      const studentsList = classInfo.class_students?.map(cs => cs.students) || []
      setStudents(studentsList)

      // 해당 날짜의 기존 출결 기록 조회
      if (studentsList.length > 0) {
        await fetchAttendanceRecords(studentsList)
      }

      console.log('✅ 클래스 및 학생 정보 로딩 완료:', classInfo)

    } catch (err) {
      setError(err.message)
      console.error('❌ 데이터 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 출결 기록 조회
  const fetchAttendanceRecords = async (studentsList) => {
    try {
      const studentIds = studentsList.map(student => student.id)
      
      const { data: records, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('attendance_date', attendanceDate)
        .in('student_id', studentIds)

      if (error) throw error

      // 기록을 student_id를 키로 하는 객체로 변환
      const recordsMap = {}
      records?.forEach(record => {
        recordsMap[record.student_id] = record
      })

      setAttendanceRecords(recordsMap)
      console.log('✅ 출결 기록 로딩 완료:', recordsMap)

    } catch (err) {
      console.error('❌ 출결 기록 조회 오류:', err)
    }
  }

  // 출결 상태 변경
  const updateAttendanceStatus = (studentId, status) => {
    const currentTime = new Date().toTimeString().slice(0, 5)
    
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        class_id: parseInt(classId),
        attendance_date: attendanceDate,
        status: status,
        check_in_time: status === 'present' || status === 'late' ? currentTime : prev[studentId]?.check_in_time || null,
        check_out_time: status === 'early_leave' ? currentTime : prev[studentId]?.check_out_time || null,
        updated_at: new Date().toISOString()
      }
    }))
  }

  // 메모 업데이트
  const updateMemo = (studentId, memo) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        class_id: parseInt(classId),
        attendance_date: attendanceDate,
        memo: memo,
        updated_at: new Date().toISOString()
      }
    }))
  }

  // 출결 저장
  const saveAttendance = async () => {
    setSaving(true)
    
    try {
      console.log('💾 출결 기록 저장 중...', attendanceRecords)

      const recordsToSave = Object.values(attendanceRecords).filter(record => 
        record.status || record.memo || record.check_in_time || record.check_out_time
      )

      if (recordsToSave.length === 0) {
        alert('저장할 출결 기록이 없습니다.')
        return
      }

      // 기존 기록 삭제 후 재생성 (UPSERT 방식)
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId)
        .eq('attendance_date', attendanceDate)

      if (deleteError) throw deleteError

      // 새로운 기록 삽입
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(recordsToSave)

      if (insertError) throw insertError

      console.log('✅ 출결 저장 완료')
      alert(`${attendanceDate} 출결이 성공적으로 저장되었습니다!`)

    } catch (error) {
      console.error('❌ 출결 저장 오류:', error)
      alert(`출결 저장 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 일괄 출석 처리
  const markAllPresent = () => {
    students.forEach(student => {
      updateAttendanceStatus(student.id, 'present')
    })
  }

  // 상태별 카운트
  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, early_leave: 0, unmarked: 0 }
    
    students.forEach(student => {
      const record = attendanceRecords[student.id]
      if (record?.status) {
        counts[record.status]++
      } else {
        counts.unmarked++
      }
    })
    
    return counts
  }

  // 요일 이름 반환
  const getDayName = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return days[date.getDay()]
  }

  // 로딩 중 화면
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

  // 클래스를 찾을 수 없는 경우
  if (classNotFound) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-4">클래스를 찾을 수 없습니다</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              요청하신 클래스 정보가 존재하지 않거나 삭제되었을 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                출결 관리로
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                클래스 목록으로
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const statusCounts = getStatusCounts()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-6 h-6" />
              {classData?.name} 출결 체크
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {attendanceDate} ({getDayName(attendanceDate)}) • 학생 {students.length}명
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-success-500 hover:bg-success-600 disabled:bg-success-300 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <BookmarkIcon className="w-4 h-4" />
                  출결 저장
                </>
              )}
            </button>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              출결 관리
            </Link>
          </div>
        </div>

        {/* 클래스 정보 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">강사:</span>
              <span className="text-gray-900 dark:text-white/90">{classData?.instructors?.name || '미배정'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <ClipboardDocumentCheckIcon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">교실:</span>
              <span className="text-gray-900 dark:text-white/90">{classData?.classroom || '미정'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">대상:</span>
              <span className="text-gray-900 dark:text-white/90">{classData?.grade_level || '전체 학년'}</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4">
            <p className="text-error-600 font-medium">오류가 발생했습니다: {error}</p>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-success-50 border border-success-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="text-2xl font-bold text-success-600">{statusCounts.present}</div>
            <div className="text-sm text-success-700 font-medium">출석</div>
          </div>
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="w-6 h-6 text-error-600" />
            </div>
            <div className="text-2xl font-bold text-error-600">{statusCounts.absent}</div>
            <div className="text-sm text-error-700 font-medium">결석</div>
          </div>
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="text-2xl font-bold text-warning-600">{statusCounts.late}</div>
            <div className="text-sm text-warning-700 font-medium">지각</div>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-brand-600">{statusCounts.early_leave}</div>
            <div className="text-sm text-brand-700 font-medium">조퇴</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-gray-400 rounded-full opacity-50"></div>
            </div>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.unmarked}</div>
            <div className="text-sm text-gray-700 font-medium">미체크</div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={markAllPresent}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <UserGroupIcon className="w-4 h-4" />
              전체 출석 처리
            </button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">날짜 변경:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => {
                  const newDate = e.target.value
                  router.push(`/attendance/class/${classId}?date=${newDate}`)
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* 학생 출결 목록 */}
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
              등록된 학생이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              클래스에 학생을 먼저 등록해주세요.
            </p>
            <Link
              href={`/classes/${classId}`}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <UserGroupIcon className="w-5 h-5" />
              학생 등록하러 가기
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      학생 정보
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      출결 상태
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      체크인 시간
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      체크아웃 시간
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      메모
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => {
                    const record = attendanceRecords[student.id]
                    const currentStatus = record?.status
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        {/* 학생 정보 */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                              <span className="text-brand-600 font-medium text-sm">
                                {student.name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white/90">{student.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{student.grade}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">{student.parent_phone}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* 출결 상태 */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {attendanceStatusOptions.map((option) => {
                              const IconComponent = option.icon
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => updateAttendanceStatus(student.id, option.value)}
                                  className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                                    currentStatus === option.value
                                      ? option.color + ' ring-2 ring-offset-2 ring-brand-200'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                                  }`}
                                  title={option.label}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </button>
                              )
                            })}
                          </div>
                          {currentStatus && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attendanceStatusOptions.find(opt => opt.value === currentStatus)?.color
                              }`}>
                                {attendanceStatusOptions.find(opt => opt.value === currentStatus)?.label}
                              </span>
                            </div>
                          )}
                        </td>
                        
                        {/* 체크인 시간 */}
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-mono text-gray-900 dark:text-white/90">
                            {record?.check_in_time ? (
                              <span className="bg-success-50 text-success-600 px-2 py-1 rounded">
                                {record.check_in_time}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        
                        {/* 체크아웃 시간 */}
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-mono text-gray-900 dark:text-white/90">
                            {record?.check_out_time ? (
                              <span className="bg-warning-50 text-warning-600 px-2 py-1 rounded">
                                {record.check_out_time}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        
                        {/* 메모 */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={record?.memo || ''}
                            onChange={(e) => updateMemo(student.id, e.target.value)}
                            placeholder="메모 입력..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 저장 버튼 (하단) */}
        {students.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-success-500 hover:bg-success-600 disabled:bg-success-300 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <BookmarkIcon className="w-5 h-5" />
                  출결 기록 저장
                </>
              )}
            </button>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h4 className="font-semibold text-brand-900 mb-3 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
            출결 체크 안내
          </h4>
          <ul className="text-brand-800 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              각 학생의 출결 상태를 아이콘 버튼으로 선택할 수 있습니다
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              출석 또는 지각 선택시 자동으로 체크인 시간이 기록됩니다
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              조퇴 선택시 자동으로 체크아웃 시간이 기록됩니다
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              메모 필드에 특이사항을 입력할 수 있습니다
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="font-semibold">'전체 출석 처리' 버튼으로 모든 학생을 한 번에 출석 처리할 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="font-semibold">변경사항은 '출결 저장' 버튼을 눌러야 저장됩니다</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}