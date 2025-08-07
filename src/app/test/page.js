'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PageLayout from '@/components/layout/PageLayout'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState('연결 테스트 중...')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    runTests()
  }, [])

  async function runTests() {
    setLoading(true)
    setError('')
    setIsSuccess(false)
    setConnectionStatus('연결 테스트 중...')

    try {
      console.log('🔍 Supabase 연결 테스트 시작')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
      }

      console.log('✅ 환경변수 확인 완료')

      setConnectionStatus('데이터베이스 연결 중...')
      
      const { data: testData, error: testError } = await supabase
        .from('students')
        .select('id')
        .limit(1)

      if (testError) {
        throw new Error(`데이터베이스 연결 오류: ${testError.message}`)
      }

      console.log('✅ 데이터베이스 연결 성공')
      setConnectionStatus('연결 성공! 학생 데이터 조회 중...')

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (studentsError) {
        throw new Error(`학생 데이터 조회 오류: ${studentsError.message}`)
      }

      console.log('✅ 학생 데이터 조회 성공:', studentsData)
      
      setStudents(studentsData || [])
      setConnectionStatus('모든 테스트 완료! 연결 성공')
      setIsSuccess(true)

    } catch (err) {
      console.error('❌ 테스트 실패:', err)
      setError(err.message || '알 수 없는 오류가 발생했습니다')
      setConnectionStatus('연결 실패')
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor() {
    if (loading) return 'bg-yellow-100 text-yellow-800'
    if (isSuccess) return 'bg-green-100 text-green-800'
    if (error) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <PageLayout title="시스템 테스트">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 연결 상태 */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <span className="material-icons mr-2">wifi</span>
              연결 상태
            </h2>
          </CardHeader>
          <CardBody>
            <div className={`p-4 rounded flex items-center ${getStatusColor()}`}>
              <span className="material-icons mr-2">
                {loading ? 'hourglass_empty' : isSuccess ? 'check_circle' : 'error'}
              </span>
              {connectionStatus}
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-800 rounded border border-red-200">
                <div className="flex items-start">
                  <span className="material-icons mr-2 mt-0.5">error</span>
                  <div>
                    <strong>오류 발생:</strong> {error}
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">해결 방법 보기</summary>
                      <div className="mt-2 text-sm">
                        <p><strong>1. 환경변수 오류인 경우:</strong></p>
                        <ul className="ml-4 list-disc">
                          <li>.env.local 파일이 프로젝트 루트에 있는지 확인</li>
                          <li>NEXT_PUBLIC_SUPABASE_URL 값이 올바른지 확인</li>
                          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY 값이 올바른지 확인</li>
                          <li>개발 서버 재시작 (npm run dev)</li>
                        </ul>
                        <p className="mt-2"><strong>2. 테이블 오류인 경우:</strong></p>
                        <ul className="ml-4 list-disc">
                          <li>Supabase에서 students 테이블이 생성되었는지 확인</li>
                          <li>RLS 정책이 올바르게 설정되었는지 확인</li>
                        </ul>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 테스트 버튼 */}
        <div className="text-center">
          <Button
            onClick={runTests}
            disabled={loading}
            loading={loading}
            icon={loading ? null : "refresh"}
          >
            {loading ? '테스트 중...' : '다시 테스트'}
          </Button>
        </div>

        {/* 학생 데이터 */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <span className="material-icons mr-2">people</span>
              학생 데이터 ({students.length}명)
            </h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
                <p className="text-gray-600">데이터 로딩 중...</p>
              </div>
            ) : students.length === 0 && !error ? (
              <div className="text-center py-8 text-gray-500">
                <span className="material-icons text-6xl mb-4">school</span>
                <p className="text-lg mb-2">아직 등록된 학생이 없습니다.</p>
                <p className="text-sm">Supabase SQL Editor에서 테스트 데이터를 삽입해보세요.</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <span className="material-icons text-6xl mb-4">error_outline</span>
                <p className="text-lg mb-2">데이터를 불러올 수 없습니다.</p>
                <p className="text-sm">위의 오류 메시지를 확인해주세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">이름</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">학년</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">수강과목</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">월수강료</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                          {student.id}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {student.name || '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.grade || '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.subject || '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.monthly_fee ? `${student.monthly_fee.toLocaleString()}원` : '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${ 
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status === 'active' ? '활성' : (student.status || '-')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 성공 메시지 */}
        {isSuccess && (
          <Card className="border-green-200 bg-green-50">
            <CardBody>
              <div className="flex items-start">
                <span className="material-icons text-green-600 mr-3">check_circle</span>
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">테스트 성공!</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li className="flex items-center">
                      <span className="material-icons text-sm mr-1">check</span>
                      환경변수 설정 확인
                    </li>
                    <li className="flex items-center">
                      <span className="material-icons text-sm mr-1">check</span>
                      Supabase 연결 성공
                    </li>
                    <li className="flex items-center">
                      <span className="material-icons text-sm mr-1">check</span>
                      students 테이블 접근 가능
                    </li>
                    <li className="flex items-center">
                      <span className="material-icons text-sm mr-1">check</span>
                      데이터 조회 및 표시 완료
                    </li>
                    <li className="flex items-center font-bold">
                      <span className="material-icons text-sm mr-1">rocket_launch</span>
                      다음 단계로 진행 가능합니다!
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 고급 테스트 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="material-icons mr-2">science</span>
              고급 테스트
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                as="a"
                href="/test/instructor"
                variant="outline"
                className="h-20 justify-start text-left p-4"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="material-icons text-orange-600">assignment_ind</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">강사 관리 시스템 테스트</h4>
                  <p className="text-sm text-gray-600 mt-1">강사 CRUD, 데이터베이스 스키마 검증</p>
                </div>
              </Button>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="material-icons text-gray-400">payment</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500">수강료 관리 테스트</h4>
                  <p className="text-sm text-gray-400 mt-1">🚧 개발 예정</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageLayout>
  )
}