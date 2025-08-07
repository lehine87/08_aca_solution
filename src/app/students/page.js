'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { PlusIcon, MagnifyingGlassIcon, UserGroupIcon, ArrowPathIcon } from '@/components/icons'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  // 학생 데이터 조회 함수
  const fetchStudents = useCallback(async () => {
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
  }, [])

  // 페이지 로드시 학생 데이터 가져오기
  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

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

  // 검색 및 상태 필터링
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || student.status === filter
    
    return matchesSearch && matchesFilter
  })

  // 상태별 스타일
  function getStatusBadge(status) {
    const styles = {
      active: 'bg-success-50 text-success-600 border border-success-200',
      inactive: 'bg-gray-50 text-gray-600 border border-gray-200',
      graduated: 'bg-brand-50 text-brand-600 border border-brand-200'
    }
    const labels = {
      active: '수강중',
      inactive: '휴학',
      graduated: '졸업'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  // 필터 옵션
  const filterOptions = [
    { value: 'all', label: '전체', count: students.length },
    { value: 'active', label: '수강중', count: students.filter(s => s.status === 'active').length },
    { value: 'inactive', label: '휴학', count: students.filter(s => s.status === 'inactive').length },
    { value: 'graduated', label: '졸업', count: students.filter(s => s.status === 'graduated').length }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">학생 관리</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              총 {filteredStudents.length}명의 학생이 등록되어 있습니다
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/students/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              새 학생 등록
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {/* 상단 필터 탭 */}
          <div className="flex flex-wrap gap-1 mb-6">
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

          {/* 검색 및 액션 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="이름, 학년, 과목으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4">
            <p className="text-error-600 font-medium">오류가 발생했습니다: {error}</p>
          </div>
        )}

        {/* 학생 목록 */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">학생 목록을 불러오는 중...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              {searchTerm || filter !== 'all' ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm && `"${searchTerm}"에 대한 `}검색 조건에 맞는 학생을 찾을 수 없습니다.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilter('all')
                    }}
                    className="text-brand-500 hover:text-brand-600 font-medium"
                  >
                    전체 목록 보기
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
                    등록된 학생이 없습니다
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    첫 번째 학생을 등록해보세요!
                  </p>
                  <Link
                    href="/students/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    첫 학생 등록하기
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* 데스크톱용 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        수강 정보
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        수강료
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                              <span className="text-brand-600 font-medium text-sm">
                                {student.name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white/90">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {student.grade || '학년 미설정'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white/90">
                            학생: {student.phone || '-'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            학부모: {student.parent_phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white/90">
                            {student.subject || '과목 미설정'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            등록일: {student.enrollment_date ? 
                              new Date(student.enrollment_date).toLocaleDateString('ko-KR') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white/90">
                            {student.monthly_fee ? 
                              `${student.monthly_fee.toLocaleString()}원` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/students/${student.id}/edit`}
                              className="text-brand-500 hover:text-brand-600 font-medium text-sm transition-colors"
                            >
                              수정
                            </Link>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => deleteStudent(student.id, student.name)}
                              className="text-error-500 hover:text-error-600 font-medium text-sm transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일용 카드 */}
              <div className="md:hidden space-y-4 p-6">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                          <span className="text-brand-600 font-medium text-sm">
                            {student.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white/90">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.grade} • {student.subject || '과목 미설정'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center justify-between">
                        <span>학부모 연락처</span>
                        <span className="font-medium">{student.parent_phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>월 수강료</span>
                        <span className="font-medium text-gray-900 dark:text-white/90">
                          {student.monthly_fee ? `${student.monthly_fee.toLocaleString()}원` : '미설정'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/students/${student.id}/edit`}
                        className="flex-1 text-center px-3 py-2 text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 font-medium text-sm transition-colors"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => deleteStudent(student.id, student.name)}
                        className="flex-1 px-3 py-2 text-error-600 border border-error-200 rounded-lg hover:bg-error-50 font-medium text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 요약 통계 */}
        {filteredStudents.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-4">요약 통계</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-600">
                  {filteredStudents.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">총 학생 수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {filteredStudents.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">수강중</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredStudents
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0)
                    .toLocaleString()}원
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">월 수강료 합계</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredStudents.length > 0 ? 
                    Math.round(filteredStudents
                      .filter(s => s.monthly_fee > 0)
                      .reduce((sum, s) => sum + s.monthly_fee, 0) / 
                      Math.max(filteredStudents.filter(s => s.monthly_fee > 0).length, 1)
                    ).toLocaleString() : '0'}원
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">평균 수강료</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}