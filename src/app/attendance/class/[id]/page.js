'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
    { value: 'present', label: '출석', color: 'bg-green-100 text-green-800', icon: '✅' },
    { value: 'absent', label: '결석', color: 'bg-red-100 text-red-800', icon: '❌' },
    { value: 'late', label: '지각', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
    { value: 'early_leave', label: '조퇴', color: 'bg-blue-100 text-blue-800', icon: '🏃' }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">출결 정보를 불러오는 중...</p>
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
              href="/attendance"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              출결 관리로
            </Link>
            <Link
              href="/classes"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              클래스 목록으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 {classData?.name} 출결 체크</h1>
              <p className="mt-1 text-gray-600">
                {attendanceDate} ({getDayName(attendanceDate)}) • 학생 {students.length}명
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? '저장 중...' : '💾 출결 저장'}
              </button>
              <Link
                href="/attendance"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← 출결 관리
              </Link>
            </div>
          </div>

          {/* 클래스 정보 */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <span>👨‍🏫 {classData?.instructors?.name || '강사 미배정'}</span>
            <span>🏠 {classData?.classroom || '교실 미정'}</span>
            <span>🎓 {classData?.grade_level || '전체 학년'}</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">✅ {statusCounts.present}</div>
            <div className="text-sm text-green-700">출석</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">❌ {statusCounts.absent}</div>
            <div className="text-sm text-red-700">결석</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">⏰ {statusCounts.late}</div>
            <div className="text-sm text-yellow-700">지각</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">🏃 {statusCounts.early_leave}</div>
            <div className="text-sm text-blue-700">조퇴</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">⚪ {statusCounts.unmarked}</div>
            <div className="text-sm text-gray-700">미체크</div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={markAllPresent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🎯 전체 출석 처리
            </button>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => {
                const newDate = e.target.value
                router.push(`/attendance/class/${classId}?date=${newDate}`)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 학생 출결 목록 */}
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 학생이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              클래스에 학생을 먼저 등록해주세요.
            </p>
            <Link
              href={`/classes/${classId}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              학생 등록하러 가기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학생 정보
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출결 상태
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      체크인 시간
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      체크아웃 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메모
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const record = attendanceRecords[student.id]
                    const currentStatus = record?.status
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        {/* 학생 정보 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.grade}</div>
                            <div className="text-xs text-gray-400">{student.parent_phone}</div>
                          </div>
                        </td>
                        
                        {/* 출결 상태 */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-1">
                            {attendanceStatusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => updateAttendanceStatus(student.id, option.value)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  currentStatus === option.value
                                    ? option.color + ' ring-2 ring-offset-2 ring-gray-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                title={option.label}
                              >
                                {option.icon}
                              </button>
                            ))}
                          </div>
                          {currentStatus && (
                            <div className="mt-1 text-xs text-gray-500">
                              {attendanceStatusOptions.find(opt => opt.value === currentStatus)?.label}
                            </div>
                          )}
                        </td>
                        
                        {/* 체크인 시간 */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {record?.check_in_time || '-'}
                          </div>
                        </td>
                        
                        {/* 체크아웃 시간 */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {record?.check_out_time || '-'}
                          </div>
                        </td>
                        
                        {/* 메모 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={record?.memo || ''}
                            onChange={(e) => updateMemo(student.id, e.target.value)}
                            placeholder="메모 입력..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          <div className="mt-6 flex justify-center">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors shadow-lg"
            >
              {saving ? '저장 중...' : '💾 출결 기록 저장'}
            </button>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 출결 체크 안내</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 각 학생의 출결 상태를 아이콘 버튼으로 선택할 수 있습니다</li>
            <li>• 출석(✅) 또는 지각(⏰) 선택시 자동으로 체크인 시간이 기록됩니다</li>
            <li>• 조퇴(🏃) 선택시 자동으로 체크아웃 시간이 기록됩니다</li>
            <li>• 메모 필드에 특이사항을 입력할 수 있습니다</li>
            <li>• '전체 출석 처리' 버튼으로 모든 학생을 한 번에 출석 처리할 수 있습니다</li>
            <li>• 변경사항은 '출결 저장' 버튼을 눌러야 저장됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}