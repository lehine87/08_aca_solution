'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'

export default function NewInstructorPage() {
  const router = useRouter()
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject_specialty: '',
    hire_date: new Date().toISOString().split('T')[0],
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

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

  // 강사 등록
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      console.log('👨‍🏫 강사 등록 중...', formData)

      // 강사 데이터 준비
      const instructorData = {
        ...formData,
        salary: formData.salary ? parseInt(formData.salary) : null,
        hire_date: formData.hire_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 강사 등록
      const { data: instructorResult, error: instructorError } = await supabase
        .from('instructors')
        .insert([instructorData])
        .select()
        .single()

      if (instructorError) throw instructorError

      console.log('✅ 강사 등록 완료:', instructorResult)

      alert(`${formData.name} 강사가 성공적으로 등록되었습니다!`)
      router.push('/instructors')
      
    } catch (error) {
      console.error('❌ 등록 오류:', error)
      alert(`강사 등록 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">➕ 새 강사 등록</h1>
              <p className="mt-1 text-gray-600">새로운 강사를 등록합니다</p>
            </div>
            <Link
              href="/instructors"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        {/* 등록 폼 */}
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
              <Link
                href="/instructors"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-md font-medium transition-colors"
              >
                {loading ? '등록 중...' : '강사 등록'}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 bg-orange-50 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-2">💡 강사 등록 안내</h4>
          <ul className="text-orange-800 text-sm space-y-1">
            <li>• 강사명, 연락처, 담당 과목은 필수 입력 항목입니다</li>
            <li>• 이메일은 선택사항이지만 올바른 형식으로 입력해주세요</li>
            <li>• 등록 후 클래스 배정에서 해당 강사를 선택할 수 있습니다</li>
            <li>• 급여 정보는 관리용이며 외부에 노출되지 않습니다</li>
            <li>• 비상연락처는 응급상황시 사용됩니다</li>
            <li>• 등록 후 언제든지 정보를 수정할 수 있습니다</li>
          </ul>
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}