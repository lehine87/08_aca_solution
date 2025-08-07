'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditInstructorPage() {
  const router = useRouter()
  const params = useParams()
  const instructorId = params.id

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject_specialty: '',
    hire_date: '',
    status: 'active',
    salary: '',
    education: '',
    experience: '',
    certification: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    memo: ''
  })

  // 페이지 상태
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [instructorNotFound, setInstructorNotFound] = useState(false)
  const [originalData, setOriginalData] = useState(null)

  // 페이지 로드시 강사 정보 가져오기
  useEffect(() => {
    if (instructorId) {
      fetchInstructorData()
    }
  }, [instructorId])

  // 강사 정보 조회
  const fetchInstructorData = async () => {
    try {
      setLoading(true)
      console.log('🔍 강사 정보 조회 중...', instructorId)

      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', instructorId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 강사를 찾을 수 없음
          setInstructorNotFound(true)
          return
        }
        throw error
      }

      if (!data) {
        setInstructorNotFound(true)
        return
      }

      // 폼 데이터에 기존 정보 설정
      const instructorData = {
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        subject_specialty: data.subject_specialty || '',
        hire_date: data.hire_date ? data.hire_date.split('T')[0] : '',
        status: data.status || 'active',
        salary: data.salary || '',
        education: data.education || '',
        experience: data.experience || '',
        certification: data.certification || '',
        address: data.address || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
        memo: data.memo || ''
      }

      setFormData(instructorData)
      setOriginalData(instructorData) // 변경사항 추적용
      console.log('✅ 강사 정보 로딩 완료:', data)

    } catch (error) {
      console.error('❌ 강사 정보 조회 오류:', error)
      alert(`강사 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setLoading(false)
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

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '강사명은 필수입니다'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '연락처는 필수입니다'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    if (!formData.subject_specialty.trim()) {
      newErrors.subject_specialty = '담당 과목은 필수입니다'
    }

    if (formData.salary && (isNaN(formData.salary) || formData.salary < 0)) {
      newErrors.salary = '올바른 급여를 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 변경사항 체크
  const hasChanges = () => {
    if (!originalData) return false
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  // 강사 정보 수정
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!hasChanges()) {
      alert('변경된 내용이 없습니다.')
      return
    }

    setSaving(true)
    
    try {
      console.log('💾 강사 정보 수정 중...', formData)

      const updateData = {
        ...formData,
        salary: formData.salary ? parseInt(formData.salary) : null,
        hire_date: formData.hire_date || null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('instructors')
        .update(updateData)
        .eq('id', instructorId)
        .select()

      if (error) throw error

      console.log('✅ 강사 정보 수정 완료:', data)
      alert(`${formData.name} 강사의 정보가 성공적으로 수정되었습니다!`)
      router.push(`/instructors/${instructorId}`)
      
    } catch (error) {
      console.error('❌ 수정 오류:', error)
      alert(`수정 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 취소 버튼 핸들러
  const handleCancel = () => {
    if (hasChanges()) {
      if (confirm('변경사항이 있습니다. 정말로 취소하시겠습니까?')) {
        router.push(`/instructors/${instructorId}`)
      }
    } else {
      router.push(`/instructors/${instructorId}`)
    }
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

  // 강사를 찾을 수 없는 경우
  if (instructorNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-6">👨‍🏫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">강사를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            요청하신 강사 정보가 존재하지 않거나 삭제되었을 수 있습니다.
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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">✏️ 강사 정보 수정</h1>
              <p className="mt-1 text-gray-600">
                {formData.name}님의 정보를 수정합니다
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/instructors/${instructorId}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← 상세 정보
              </Link>
              {hasChanges() && (
                <div className="text-sm text-orange-600 font-medium">
                  * 변경사항이 있습니다
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* 기본 정보 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">👨‍🏫 기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 강사명 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    강사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: 김선생"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* 연락처 */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: 010-1234-5678"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* 이메일 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="예: teacher@academy.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* 담당 과목 */}
                <div>
                  <label htmlFor="subject_specialty" className="block text-sm font-medium text-gray-700 mb-1">
                    담당 과목 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject_specialty"
                    name="subject_specialty"
                    value={formData.subject_specialty}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.subject_specialty ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">과목 선택</option>
                    <option value="수학">수학</option>
                    <option value="영어">영어</option>
                    <option value="국어">국어</option>
                    <option value="과학">과학</option>
                    <option value="사회">사회</option>
                    <option value="물리">물리</option>
                    <option value="화학">화학</option>
                    <option value="생물">생물</option>
                    <option value="지구과학">지구과학</option>
                    <option value="한국사">한국사</option>
                    <option value="세계사">세계사</option>
                    <option value="기타">기타</option>
                  </select>
                  {errors.subject_specialty && <p className="mt-1 text-sm text-red-600">{errors.subject_specialty}</p>}
                </div>

                {/* 입사일 */}
                <div>
                  <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
                    입사일
                  </label>
                  <input
                    type="date"
                    id="hire_date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* 재직 상태 */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    재직 상태
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">재직중</option>
                    <option value="on_leave">휴직중</option>
                    <option value="inactive">퇴사</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 추가 정보 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 추가 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 급여 */}
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                    급여 (월)
                  </label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.salary ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2500000"
                    min="0"
                    step="10000"
                  />
                  {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
                </div>

                {/* 학력 */}
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                    최종 학력
                  </label>
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 서울대학교 수학과 졸업"
                  />
                </div>

                {/* 경력 */}
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                    주요 경력
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 고등학교 수학 교사 5년"
                  />
                </div>

                {/* 자격증 */}
                <div>
                  <label htmlFor="certification" className="block text-sm font-medium text-gray-700 mb-1">
                    보유 자격증
                  </label>
                  <input
                    type="text"
                    id="certification"
                    name="certification"
                    value={formData.certification}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 중등학교 정교사 2급 (수학)"
                  />
                </div>
              </div>

              {/* 주소 */}
              <div className="mt-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                />
              </div>

              {/* 비상연락처 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-1">
                    비상연락처 (관계)
                  </label>
                  <input
                    type="text"
                    id="emergency_contact"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 김○○ (배우자)"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    비상연락처 번호
                  </label>
                  <input
                    type="tel"
                    id="emergency_phone"
                    name="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="예: 010-9876-5432"
                  />
                </div>
              </div>
            </div>

            {/* 메모 섹션 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 메모</h3>
              <div>
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                  기타 사항
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="강사에 대한 특이사항, 주의사항 등을 입력하세요"
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges()}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  hasChanges()
                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : hasChanges() ? '변경사항 저장' : '변경사항 없음'}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 bg-orange-50 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-2">💡 강사 수정 안내</h4>
          <ul className="text-orange-800 text-sm space-y-1">
            <li>• 강사명, 연락처, 담당 과목은 필수 입력 항목입니다</li>
            <li>• 재직 상태를 '퇴사'로 변경하면 담당 클래스에서 자동으로 제외됩니다</li>
            <li>• 급여 정보는 관리용이며 강사에게 공개되지 않습니다</li>
            <li>• 담당 클래스가 있는 강사는 삭제할 수 없으며, 먼저 클래스 배정을 해제해야 합니다</li>
            <li>• 변경된 정보는 즉시 반영되며 관련된 모든 기능에서 업데이트됩니다</li>
          </ul>
        </div>

        {/* 추가 액션 */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h4 className="font-medium text-gray-900 mb-3">⚡ 추가 작업</h4>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/instructors/${instructorId}`}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              👁️ 상세 정보 보기
            </Link>
            <Link
              href={`/classes?instructor=${instructorId}`}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              📚 담당 클래스 관리
            </Link>
            <Link
              href="/attendance"
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              📋 출결 관리
            </Link>
            <Link
              href="/classes/new"
              className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              ➕ 새 클래스 생성
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}