'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState('연결 테스트 중...')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // 페이지 로드시 연결 테스트 실행
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
      
      // 1. 환경변수 확인
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
      }

      console.log('✅ 환경변수 확인 완료')

      // 2. 기본 연결 테스트 (간단한 쿼리)
      setConnectionStatus('데이터베이스 연결 중...')
      
      // 더 간단한 연결 테스트 - 단순히 테이블에 접근만 해보기
      const { data: testData, error: testError } = await supabase
        .from('students')
        .select('id')
        .limit(1)

      if (testError) {
        throw new Error(`데이터베이스 연결 오류: ${testError.message}`)
      }

      console.log('✅ 데이터베이스 연결 성공')
      setConnectionStatus('연결 성공! 학생 데이터 조회 중...')

      // 3. 실제 학생 데이터 불러오기
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

  // 안전한 상태 확인 함수
  function getStatusColor() {
    if (loading) return 'bg-yellow-100 text-yellow-800'
    if (isSuccess) return 'bg-green-100 text-green-800'
    if (error) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🧪 Supabase 연결 테스트
        </h1>

        {/* 연결 상태 표시 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📡 연결 상태</h2>
          <div className={`p-4 rounded ${getStatusColor()}`}>
            {connectionStatus}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              <strong>🚨 오류 발생:</strong> {error}
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
          )}
        </div>

        {/* 새로고침 버튼 */}
        <div className="text-center mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            {loading ? '⏳ 테스트 중...' : '🔄 다시 테스트'}
          </button>
        </div>

        {/* 학생 데이터 표시 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            👥 학생 데이터 ({students.length}명)
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터 로딩 중...</p>
            </div>
          ) : students.length === 0 && !error ? (
            <div className="text-center py-8 text-gray-500">
              <p>📝 아직 등록된 학생이 없습니다.</p>
              <p className="text-sm mt-2">Supabase SQL Editor에서 테스트 데이터를 삽입해보세요.</p>
              <div className="mt-4 text-left bg-gray-50 p-4 rounded">
                <p className="font-medium mb-2">테스트 데이터 삽입 SQL:</p>
                <code className="text-xs bg-white p-2 block rounded">
                  INSERT INTO students (name, parent_phone, grade, subject, monthly_fee) VALUES<br/>
                  ('김철수', '010-1234-5678', '중3', '수학', 300000),<br/>
                  ('이영희', '010-2345-6789', '고1', '영어', 250000);
                </code>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>❌ 데이터를 불러올 수 없습니다.</p>
              <p className="text-sm mt-2">위의 오류 메시지를 확인해주세요.</p>
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
        </div>

        {/* 테스트 결과 요약 */}
        {isSuccess && (
          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🎉 테스트 성공!</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>✅ 환경변수 설정 확인</li>
              <li>✅ Supabase 연결 성공</li>
              <li>✅ students 테이블 접근 가능</li>
              <li>✅ 데이터 조회 및 표시 완료</li>
              <li>🚀 <strong>다음 단계로 진행 가능합니다!</strong></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}