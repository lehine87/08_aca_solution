'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 페이지 로드시 학생 데이터 가져오기
  useEffect(() => {
    fetchStudents()
  }, [])

  // 학생 데이터 조회 함수
  async function fetchStudents() {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setStudents(data || [])
    } catch (err) {
      setError(err.message)
      console.error('학생 데이터 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 학생 삭제 함수
  async function deleteStudent(id, name) {
    if (!confirm(`정말로 '${name}' 학생을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 로컬 상태에서도 제거 (화면 즉시 업데이트)
      setStudents(students.filter(student => student.id !== id))
      alert('학생이 삭제되었습니다.')
    } catch (err) {
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`)
    }
  }

  // 검색 필터링
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 상태별 스타일
  function getStatusBadge(status) {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      graduated: 'bg-blue-100 text-blue-800'
    }
    const labels = {
      active: '활성',
      inactive: '비활성',
      graduated: '졸업'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👥 학생 관리</h1>
              <p className="mt-1 text-gray-600">
                등록된 학생 {filteredStudents.length}명 
                {searchTerm && ` (검색: "${searchTerm}")`}
              </p>
            </div>
            <Link
              href="/students/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ➕ 새 학생 등록
            </Link>
          </div>

          {/* 빠른 메뉴 */}
          <div className="mt-4 flex space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              🏠 홈으로
            </Link>
            <Link href="/test" className="text-gray-600 hover:text-gray-800">
              🧪 연결 테스트
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                🔍 학생 검색
              </label>
              <input
                type="text"
                id="search"
                placeholder="이름, 학년, 과목으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? '⏳' : '🔄'} 새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* 학생 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">학생 목록을 불러오는 중...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    "{searchTerm}"과 일치하는 학생을 찾을 수 없습니다.
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    전체 목록 보기
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    등록된 학생이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    첫 번째 학생을 등록해보세요!
                  </p>
                  <Link
                    href="/students/new"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    ➕ 첫 학생 등록하기
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* 데스크톱용 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수강 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수강료
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.grade || '학년 미설정'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            학생: {student.phone || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            학부모: {student.parent_phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {student.subject || '과목 미설정'}
                          </div>
                          <div className="text-sm text-gray-500">
                            등록일: {student.enrollment_date ? 
                              new Date(student.enrollment_date).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.monthly_fee ? 
                              `${student.monthly_fee.toLocaleString()}원` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Link
                            href={`/students/${student.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            ✏️ 수정
                          </Link>
                          <button
                            onClick={() => deleteStudent(student.id, student.name)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ 삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일용 카드 */}
              <div className="md:hidden">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="border-b border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student.grade} | {student.subject || '과목 미설정'}
                        </p>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <p>📞 학부모: {student.parent_phone}</p>
                      <p>💰 수강료: {student.monthly_fee ? 
                        `${student.monthly_fee.toLocaleString()}원` : '미설정'}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Link
                        href={`/students/${student.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        ✏️ 수정
                      </Link>
                      <button
                        onClick={() => deleteStudent(student.id, student.name)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 정보 */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📊 요약 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">총 학생 수:</span>
                <span className="font-medium ml-1">{filteredStudents.length}명</span>
              </div>
              <div>
                <span className="text-blue-700">활성 학생:</span>
                <span className="font-medium ml-1">
                  {filteredStudents.filter(s => s.status === 'active').length}명
                </span>
              </div>
              <div>
                <span className="text-blue-700">월 수강료 합계:</span>
                <span className="font-medium ml-1">
                  {filteredStudents
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0)
                    .toLocaleString()}원
                </span>
              </div>
              <div>
                <span className="text-blue-700">평균 수강료:</span>
                <span className="font-medium ml-1">
                  {filteredStudents.length > 0 ? 
                    Math.round(filteredStudents
                      .filter(s => s.monthly_fee > 0)
                      .reduce((sum, s) => sum + s.monthly_fee, 0) / 
                      filteredStudents.filter(s => s.monthly_fee > 0).length
                    ).toLocaleString() : '0'}원
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}