'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      setLoading(true)
      setError('')

      // 강사 정보와 담당 클래스 수 조회
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          *,
          classes(id, name, status)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInstructors(data || [])
      console.log('✅ 강사 목록 로딩 완료:', data)

    } catch (err) {
      setError(err.message)
      console.error('❌ 강사 목록 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 강사 삭제 함수
  const deleteInstructor = async (instructorId, instructorName, hasClasses) => {
    if (hasClasses) {
      alert(`${instructorName} 강사는 현재 담당 중인 클래스가 있어 삭제할 수 없습니다.\n먼저 담당 클래스의 강사를 변경해주세요.`)
      return
    }

    // 확인 대화상자
    const confirmMessage = `정말로 '${instructorName}' 강사를 삭제하시겠습니까?\n\n⚠️ 주의사항:\n• 강사 정보가 완전히 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log('🗑️ 강사 삭제 중...', instructorId)

      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', instructorId)

      if (error) throw error

      // 로컬 상태에서도 제거 (화면 즉시 업데이트)
      setInstructors(instructors.filter(instructor => instructor.id !== instructorId))
      
      console.log('✅ 강사 삭제 완료')
      alert(`${instructorName} 강사가 성공적으로 삭제되었습니다.`)

    } catch (err) {
      console.error('❌ 강사 삭제 오류:', err)
      alert(`강사 삭제 중 오류가 발생했습니다: ${err.message}`)
    }
  }

  // 필터링된 강사 목록
  const filteredInstructors = instructors.filter(instructor => {
    const matchesStatus = filterStatus === 'all' || instructor.status === filterStatus
    const matchesSearch = instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.subject_specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // 상태별 카운트
  const statusCounts = instructors.reduce((counts, instructor) => {
    counts[instructor.status] = (counts[instructor.status] || 0) + 1
    counts.total = (counts.total || 0) + 1
    return counts
  }, {})

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

  // 담당 클래스 수 계산
  const getActiveClassCount = (classes) => {
    return classes?.filter(cls => cls.status === 'active').length || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">강사 목록을 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">👨‍🏫 강사 관리</h1>
              <p className="mt-1 text-gray-600">
                등록된 강사 {statusCounts.total || 0}명 • 재직중 {statusCounts.active || 0}명
              </p>
            </div>
            <div className="space-x-3">
              <Link
                href="/instructors/new"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 새 강사 등록
              </Link>
              <Link
                href="/classes"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📚 클래스 관리
              </Link>
            </div>
          </div>

          {/* 빠른 메뉴 */}
          <div className="mt-4 flex space-x-4">
            <Link href="/" className="text-orange-600 hover:text-orange-800 font-medium">
              🏠 홈으로
            </Link>
            <Link href="/students" className="text-gray-600 hover:text-gray-800">
              👥 학생 관리
            </Link>
            <Link href="/attendance" className="text-purple-600 hover:text-purple-800">
              📋 출결 관리
            </Link>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            
            {/* 상태 필터 */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({statusCounts.total || 0})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                재직중 ({statusCounts.active || 0})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                퇴사 ({statusCounts.inactive || 0})
              </button>
            </div>

            {/* 검색 */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="강사명, 전공, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 강사 목록 */}
        {filteredInstructors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 강사가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 강사를 등록해보세요!'}
            </p>
            {!searchTerm && (
              <Link
                href="/instructors/new"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ 첫 강사 등록하기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => {
              const activeClasses = getActiveClassCount(instructor.classes)
              const hasClasses = activeClasses > 0
              
              return (
                <div key={instructor.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    
                    {/* 강사 헤더 */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-orange-600 text-xl">👨‍🏫</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {instructor.name}
                          </h3>
                          <p className="text-sm text-gray-600">{instructor.subject_specialty || '전공 미설정'}</p>
                        </div>
                      </div>
                      {getStatusBadge(instructor.status)}
                    </div>

                    {/* 강사 정보 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-16">📞 연락처:</span>
                        <span>{instructor.phone || '미등록'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-16">📧 이메일:</span>
                        <span className="truncate">{instructor.email || '미등록'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-16">📅 입사일:</span>
                        <span>{instructor.hire_date ? new Date(instructor.hire_date).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-16">📚 담당:</span>
                        <span className="font-medium text-blue-600">{activeClasses}개 클래스</span>
                      </div>
                    </div>

                    {/* 담당 클래스 미리보기 */}
                    {instructor.classes && instructor.classes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">🏫 담당 클래스</p>
                        <div className="flex flex-wrap gap-1">
                          {instructor.classes
                            .filter(cls => cls.status === 'active')
                            .slice(0, 3)
                            .map((cls, index) => (
                              <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                {cls.name}
                              </span>
                            ))}
                          {activeClasses > 3 && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              +{activeClasses - 3}개
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 메모 */}
                    {instructor.memo && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">📝 메모</p>
                        <p className="text-sm text-gray-800">{instructor.memo}</p>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      {/* 첫 번째 줄 */}
                      <div className="flex space-x-2">
                        <Link
                          href={`/instructors/${instructor.id}`}
                          className="flex-1 text-center bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                        >
                          👁️ 상세
                        </Link>
                        <Link
                          href={`/instructors/${instructor.id}/edit`}
                          className="flex-1 text-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                        >
                          ✏️ 수정
                        </Link>
                        <Link
                          href={`/classes?instructor=${instructor.id}`}
                          className="flex-1 text-center bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded font-medium text-sm transition-colors"
                        >
                          📚 클래스
                        </Link>
                      </div>
                      
                      {/* 두 번째 줄 - 삭제 버튼 */}
                      <button
                        onClick={() => deleteInstructor(instructor.id, instructor.name, hasClasses)}
                        disabled={hasClasses}
                        className={`w-full text-center py-2 px-3 rounded font-medium text-sm transition-colors ${
                          hasClasses
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title={hasClasses ? '담당 클래스가 있어 삭제할 수 없습니다' : '강사 삭제'}
                      >
                        🗑️ 강사 삭제 {hasClasses && '(불가)'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}