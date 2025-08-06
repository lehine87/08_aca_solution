'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditClassPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade_level: '',
    max_students: 20,
    monthly_fee: '',
    main_instructor_id: '',
    classroom: '',
    status: 'active',
    start_date: '',
    end_date: '',
    description: '',
    memo: ''
  })

  // 스케줄 데이터 상태
  const [schedules, setSchedules] = useState([
    { id: null, day_of_week: '', start_time: '', end_time: '' }
  ])

  // 페이지 상태
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [classNotFound, setClassNotFound] = useState(false)

  // 페이지 로드시 데이터 가져오기
  useEffect(() => {
    if (classId) {
      Promise.all([
        fetchClassData(),
        fetchInstructors()
      ])
    }
  }, [classId])

  // 클래스 정보 조회
  const fetchClassData = async () => {
    try {
      setLoading(true)
      console.log('🔍 클래스 정보 조회 중...', classId)

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules(id, day_of_week, start_time, end_time)
        `)
        .eq('id', classId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setClassNotFound(true)
          return
        }
        throw error
      }

      if (!data) {
        setClassNotFound(true)
        return
      }

      // 폼 데이터 설정
      setFormData({
        name: data.name || '',
        subject: data.subject || '',
        grade_level: data.grade_level || '',
        max_students: data.max_students || 20,
        monthly_fee: data.monthly_fee || '',
        main_instructor_id: data.main_instructor_id || '',
        classroom: data.classroom || '',
        status: data.status || 'active',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        description: data.description || '',
        memo: data.memo || ''
      })

      // 스케줄 데이터 설정
      if (data.class_schedules && data.class_schedules.length > 0) {
        setSchedules(data.class_schedules.map(schedule => ({
          id: schedule.id,
          day_of_week: schedule.day_of_week.toString(),
          start_time: schedule.start_time,
          end_time: schedule.end_time
        })))
      }

      console.log('✅ 클래스 정보 로딩 완료:', data)

    } catch (error) {
      console.error('❌ 클래스 정보 조회 오류:', error)
      alert(`클래스 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 강사 목록 조회
  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, name, subject_specialty')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setInstructors(data || [])
    } catch (error) {
      console.error('강사 목록 조회 오류:', error)
    }
  }

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // 스케줄 변경 핸들러
  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...schedules]
    updatedSchedules[index][field] = value
    setSchedules(updatedSchedules)
  }

  // 스케줄 추가
  const addSchedule = () => {
    setSchedules([...schedules, { id: null, day_of_week: '', start_time: '', end_time: '' }])
  }

  // 스케줄 제거
  const removeSchedule = (index) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index))
    }
  }

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '클래스명은 필수입니다'
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = '과목은 필수입니다'
    }
    
    if (!formData.max_students || formData.max_students < 1) {
      newErrors.max_students = '정원은 1명 이상이어야 합니다'
    }

    if (formData.monthly_fee && (isNaN(formData.monthly_fee) || formData.monthly_fee < 0)) {
      newErrors.monthly_fee = '올바른 수강료를 입력해주세요'
    }

    // 스케줄 유효성 검사
    const validSchedules = schedules.filter(s => s.day_of_week && s.start_time && s.end_time)
    if (validSchedules.length === 0) {
      newErrors.schedules = '최소 하나의 수업 시간을 설정해주세요'
    }

    // 시간 순서 검사
    validSchedules.forEach((schedule, index) => {
      if (schedule.start_time >= schedule.end_time) {
        newErrors.schedules = `${index + 1}번째 스케줄의 시작 시간이 종료 시간보다 늦습니다`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 클래스 수정
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    
    try {
      console.log('💾 클래스 수정 중...', formData)

      // 클래스 데이터 준비
      const classData = {
        ...formData,
        max_students: parseInt(formData.max_students),
        monthly_fee: formData.monthly_fee ? parseInt(formData.monthly_fee) : 0,
        main_instructor_id: formData.main_instructor_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        updated_at: new Date().toISOString()
      }

      // 클래스 수정
      const { error: classError } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', classId)

      if (classError) throw classError

      console.log('✅ 클래스 수정 완료')

      // 기존 스케줄 삭제
      const { error: deleteError } = await supabase
        .from('class_schedules')
        .delete()
        .eq('class_id', classId)

      if (deleteError) throw deleteError

      // 새로운 스케줄 데이터 준비
      const validSchedules = schedules.filter(s => s.day_of_week && s.start_time && s.end_time)
      const scheduleData = validSchedules.map(schedule => ({
        class_id: classId,
        day_of_week: parseInt(schedule.day_of_week),
        start_time: schedule.start_time,
        end_time: schedule.end_time
      }))

      // 스케줄 재생성
      if (scheduleData.length > 0) {
        const { error: scheduleError } = await supabase
          .from('class_schedules')
          .insert(scheduleData)

        if (scheduleError) throw scheduleError
        console.log('✅ 스케줄 수정 완료')
      }

      alert(`${formData.name} 클래스 정보가 성공적으로 수정되었습니다!`)
      router.push('/classes')
      
    } catch (error) {
      console.error('❌ 수정 오류:', error)
      alert(`클래스 수정 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 요일 옵션
  const dayOptions = [
    { value: 0, label: '일요일' },
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' }
  ]

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
            <Link
              href="/classes/new"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              새 클래스 생성
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">✏️ 클래스 수정</h1>
              <p className="mt-1 text-gray-600">
                {formData.name} 클래스 정보를 수정합니다
              </p>
            </div>
            <Link
              href="/classes"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* 기본 정보 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 클래스명 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    클래스명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: 중3 수학 정규반"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* 과목 */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    과목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: 수학"
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>

                {/* 학년 */}
                <div>
                  <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-1">
                    대상 학년
                  </label>
                  <select
                    id="grade_level"
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">학년 선택</option>
                    <option value="초등">초등</option>
                    <option value="초1">초등 1학년</option>
                    <option value="초2">초등 2학년</option>
                    <option value="초3">초등 3학년</option>
                    <option value="초4">초등 4학년</option>
                    <option value="초5">초등 5학년</option>
                    <option value="초6">초등 6학년</option>
                    <option value="중등">중등</option>
                    <option value="중1">중학 1학년</option>
                    <option value="중2">중학 2학년</option>
                    <option value="중3">중학 3학년</option>
                    <option value="고등">고등</option>
                    <option value="고1">고등 1학년</option>
                    <option value="고2">고등 2학년</option>
                    <option value="고3">고등 3학년</option>
                    <option value="재수">재수생</option>
                  </select>
                </div>

                {/* 클래스 상태 */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    클래스 상태
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">진행중</option>
                    <option value="inactive">종료</option>
                    <option value="preparing">준비중</option>
                  </select>
                </div>

                {/* 정원 */}
                <div>
                  <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-1">
                    정원 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="max_students"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.max_students ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    max="50"
                  />
                  {errors.max_students && <p className="mt-1 text-sm text-red-600">{errors.max_students}</p>}
                </div>

                {/* 월 수강료 */}
                <div>
                  <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    월 수강료 (원)
                  </label>
                  <input
                    type="number"
                    id="monthly_fee"
                    name="monthly_fee"
                    value={formData.monthly_fee}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.monthly_fee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="300000"
                    min="0"
                    step="10000"
                  />
                  {errors.monthly_fee && <p className="mt-1 text-sm text-red-600">{errors.monthly_fee}</p>}
                </div>

                {/* 교실 */}
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-1">
                    교실
                  </label>
                  <input
                    type="text"
                    id="classroom"
                    name="classroom"
                    value={formData.classroom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 201호"
                  />
                </div>
              </div>
            </div>

            {/* 강사 배정 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">👨‍🏫 강사 배정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 담당 강사 */}
                <div>
                  <label htmlFor="main_instructor_id" className="block text-sm font-medium text-gray-700 mb-1">
                    담당 강사
                  </label>
                  <select
                    id="main_instructor_id"
                    name="main_instructor_id"
                    value={formData.main_instructor_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">강사 선택</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name} ({instructor.subject_specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 수업 시간 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📅 수업 시간</h3>
              {errors.schedules && (
                <p className="mb-4 text-sm text-red-600">{errors.schedules}</p>
              )}
              
              <div className="space-y-4">
                {schedules.map((schedule, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    
                    {/* 요일 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        요일
                      </label>
                      <select
                        value={schedule.day_of_week}
                        onChange={(e) => handleScheduleChange(index, 'day_of_week', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">요일 선택</option>
                        {dayOptions.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 시작 시간 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        시작 시간
                      </label>
                      <input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 종료 시간 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        종료 시간
                      </label>
                      <input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 삭제 버튼 */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        disabled={schedules.length === 1}
                        className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-red-700 disabled:text-gray-400 rounded-md font-medium text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* 스케줄 추가 버튼 */}
                <button
                  type="button"
                  onClick={addSchedule}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 rounded-lg font-medium transition-colors"
                >
                  ➕ 수업 시간 추가
                </button>
              </div>
            </div>

            {/* 기간 설정 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📆 운영 기간</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 시작일 */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 종료일 */}
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 추가 정보 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 추가 정보</h3>
              
              {/* 클래스 설명 */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  클래스 설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="클래스에 대한 상세 설명을 입력하세요"
                />
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                  관리자 메모
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="관리용 메모나 특이사항을 입력하세요"
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/classes"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
              >
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 클래스 수정 안내</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 클래스명과 과목, 정원은 필수 입력 항목입니다</li>
            <li>• 수업 시간 변경시 기존 스케줄이 모두 새로 생성됩니다</li>
            <li>• 클래스 상태 변경으로 진행/종료 관리가 가능합니다</li>
            <li>• 정원 변경시 현재 등록 학생 수를 확인해주세요</li>
            <li>• 수정된 정보는 즉시 반영됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}