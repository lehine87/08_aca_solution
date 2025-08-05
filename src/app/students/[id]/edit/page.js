'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    grade: '',
    subject: '',
    monthly_fee: '',
    memo: '',
    status: 'active'
  })

  // 페이지 상태
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [studentNotFound, setStudentNotFound] = useState(false)

  // 페이지 로드시 학생 정보 가져오기
  useEffect(() => {
    if (studentId) {
      fetchStudentData()
    }
  }, [studentId])

  // 학생 정보 조회
  const fetchStudentData = async () => {
    try {
      setLoading(true)
      console.log('🔍 학생 정보 조회 중...', studentId)

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 학생을 찾을 수 없음
          setStudentNotFound(true)
          return
        }
        throw error
      }

      if (!data) {
        setStudentNotFound(true)
        return
      }

      // 폼 데이터에 기존 정보 설정
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        grade: data.grade || '',
        subject: data.subject || '',
        monthly_fee: data.monthly_fee || '',
        memo: data.memo || '',
        status: data.status || 'active'
      })

      console.log('✅ 학생 정보 로딩 완료:', data)

    } catch (error) {
      console.error('❌ 학생 정보 조회 오류:', error)
      alert(`학생 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`)
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
      newErrors.name = '학생 이름은 필수입니다'
    }
    
    if (!formData.parent_phone.trim()) {
      newErrors.parent_phone = '학부모 연락처는 필수입니다'
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = '010-0000-0000 형식으로 입력해주세요'
    }
    
    if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '010-0000-0000 형식으로 입력해주세요'
    }
    
    if (formData.monthly_fee && (isNaN(formData.monthly_fee) || formData.monthly_fee < 0)) {
      newErrors.monthly_fee = '올바른 금액을 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 학생 정보 수정
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    
    try {
      console.log('💾 학생 정보 수정 중...', formData)

      const updateData = {
        ...formData,
        monthly_fee: formData.monthly_fee ? parseInt(formData.monthly_fee) : 0,
        phone: formData.phone || null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .select()

      if (error) throw error

      console.log('✅ 학생 정보 수정 완료:', data)
      alert(`${formData.name} 학생의 정보가 성공적으로 수정되었습니다!`)
      router.push('/students')
      
    } catch (error) {
      console.error('❌ 수정 오류:', error)
      alert(`수정 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">학생 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 학생을 찾을 수 없는 경우
  if (studentNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-6">👤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">학생을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            요청하신 학생 정보가 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
          <div className="space-x-4">
            <Link
              href="/students"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              학생 목록으로
            </Link>
            <Link
              href="/students/new"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              새 학생 등록
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
              <h1 className="text-3xl font-bold text-gray-900">✏️ 학생 정보 수정</h1>
              <p className="mt-1 text-gray-600">
                {formData.name}님의 정보를 수정합니다
              </p>
            </div>
            <Link
              href="/students"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← 목록으로
            </Link>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 기본 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📋 기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 학생 이름 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      학생 이름 <span className="text-red-500">*</span>
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
                      placeholder="예: 김철수"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* 학년 */}
                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                      학년
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">학년 선택</option>
                      <option value="초1">초등 1학년</option>
                      <option value="초2">초등 2학년</option>
                      <option value="초3">초등 3학년</option>
                      <option value="초4">초등 4학년</option>
                      <option value="초5">초등 5학년</option>
                      <option value="초6">초등 6학년</option>
                      <option value="중1">중학 1학년</option>
                      <option value="중2">중학 2학년</option>
                      <option value="중3">중학 3학년</option>
                      <option value="고1">고등 1학년</option>
                      <option value="고2">고등 2학년</option>
                      <option value="고3">고등 3학년</option>
                      <option value="재수">재수생</option>
                    </select>
                  </div>

                  {/* 학생 상태 */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      학생 상태
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">활성 (수강 중)</option>
                      <option value="inactive">비활성 (휴학)</option>
                      <option value="graduated">졸업</option>
                    </select>
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
                </div>
              </div>

              {/* 연락처 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📞 연락처 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 학생 연락처 */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      학생 연락처
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  {/* 학부모 이름 */}
                  <div>
                    <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-1">
                      학부모 이름
                    </label>
                    <input
                      type="text"
                      id="parent_name"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 김부모"
                    />
                  </div>

                  {/* 학부모 연락처 */}
                  <div className="md:col-span-2">
                    <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      학부모 연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="parent_phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.parent_phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-0000-0000"
                    />
                    {errors.parent_phone && <p className="mt-1 text-sm text-red-600">{errors.parent_phone}</p>}
                  </div>
                </div>
              </div>

              {/* 수강 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">📚 수강 정보</h3>
                
                {/* 수강 과목 */}
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    수강 과목
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 수학, 영어, 과학"
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                    메모 (특이사항)
                  </label>
                  <textarea
                    id="memo"
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="특이사항이나 참고할 내용을 입력하세요"
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/students"
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
        </div>

        {/* 추가 정보 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 수정 안내</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 이름과 학부모 연락처는 필수 입력 항목입니다</li>
            <li>• 학생 상태 변경으로 활성/휴학/졸업 관리가 가능합니다</li>
            <li>• 수정된 정보는 즉시 학생 목록에 반영됩니다</li>
            <li>• 연락처는 010-0000-0000 형식으로 입력해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}