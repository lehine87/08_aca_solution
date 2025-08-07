'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function InstructorTestPage() {
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentTest, setCurrentTest] = useState('')

  // 테스트 결과 추가
  const addTestResult = (test, success, message, data = null) => {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    console.log(`${success ? '✅' : '❌'} ${test}: ${message}`, data)
    setTestResults(prev => [...prev, result])
  }

  // 모든 테스트 실행
  const runAllTests = async () => {
    setLoading(true)
    setTestResults([])
    setCurrentTest('테스트 시작...')

    try {
      // 1. 강사 목록 조회 테스트
      setCurrentTest('강사 목록 조회 중...')
      await testInstructorsList()

      // 2. 강사 등록 테스트
      setCurrentTest('강사 등록 테스트 중...')
      const newInstructorId = await testInstructorCreate()

      if (newInstructorId) {
        // 3. 강사 상세 조회 테스트
        setCurrentTest('강사 상세 조회 중...')
        await testInstructorDetail(newInstructorId)

        // 4. 강사 정보 수정 테스트
        setCurrentTest('강사 정보 수정 중...')
        await testInstructorUpdate(newInstructorId)

        // 5. 강사 삭제 테스트 (테스트 데이터 정리)
        setCurrentTest('테스트 데이터 정리 중...')
        await testInstructorDelete(newInstructorId)
      }

      // 6. 데이터베이스 스키마 확인 테스트
      setCurrentTest('데이터베이스 스키마 확인 중...')
      await testDatabaseSchema()

      setCurrentTest('모든 테스트 완료!')

    } catch (error) {
      addTestResult('전체 테스트', false, `테스트 중 오류 발생: ${error.message}`)
    } finally {
      setLoading(false)
      setCurrentTest('')
    }
  }

  // 1. 강사 목록 조회 테스트
  const testInstructorsList = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          *,
          classes(id, name, status)
        `)
        .limit(5)

      if (error) throw error

      addTestResult(
        '강사 목록 조회', 
        true, 
        `총 ${data.length}명의 강사 조회 성공`,
        data
      )
    } catch (error) {
      addTestResult('강사 목록 조회', false, error.message)
    }
  }

  // 2. 강사 등록 테스트
  const testInstructorCreate = async () => {
    try {
      const testInstructor = {
        name: `테스트강사_${Date.now()}`,
        phone: '010-1234-5678',
        email: `test${Date.now()}@test.com`,
        subject_specialty: '수학',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        salary: 2500000,
        education: '테스트대학교 수학과 졸업',
        experience: '학원 강사 3년',
        certification: '중등학교 정교사 2급',
        address: '서울시 테스트구 테스트동',
        emergency_contact: '김응급 (배우자)',
        emergency_phone: '010-9999-9999',
        memo: '테스트용 강사 데이터입니다.'
      }

      const { data, error } = await supabase
        .from('instructors')
        .insert([testInstructor])
        .select()
        .single()

      if (error) throw error

      addTestResult(
        '강사 등록', 
        true, 
        `강사 등록 성공 (ID: ${data.id})`,
        data
      )

      return data.id
    } catch (error) {
      addTestResult('강사 등록', false, error.message)
      return null
    }
  }

  // 3. 강사 상세 조회 테스트
  const testInstructorDetail = async (instructorId) => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          *,
          classes (
            id,
            name,
            subject,
            grade,
            status,
            students_classes (
              student_id
            )
          )
        `)
        .eq('id', instructorId)
        .single()

      if (error) throw error

      addTestResult(
        '강사 상세 조회', 
        true, 
        `강사 상세 정보 조회 성공 (이름: ${data.name})`,
        data
      )
    } catch (error) {
      addTestResult('강사 상세 조회', false, error.message)
    }
  }

  // 4. 강사 정보 수정 테스트
  const testInstructorUpdate = async (instructorId) => {
    try {
      const updateData = {
        salary: 2800000,
        memo: '테스트 수정: 급여 인상됨',
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('instructors')
        .update(updateData)
        .eq('id', instructorId)
        .select()

      if (error) throw error

      addTestResult(
        '강사 정보 수정', 
        true, 
        `강사 정보 수정 성공 (새 급여: ${data[0].salary.toLocaleString()}원)`,
        data[0]
      )
    } catch (error) {
      addTestResult('강사 정보 수정', false, error.message)
    }
  }

  // 5. 강사 삭제 테스트
  const testInstructorDelete = async (instructorId) => {
    try {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', instructorId)

      if (error) throw error

      addTestResult(
        '강사 삭제 (테스트 정리)', 
        true, 
        `테스트 데이터 정리 완료 (ID: ${instructorId})`
      )
    } catch (error) {
      addTestResult('강사 삭제 (테스트 정리)', false, error.message)
    }
  }

  // 6. 데이터베이스 스키마 확인 테스트
  const testDatabaseSchema = async () => {
    try {
      // 테이블 존재 확인
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['instructors', 'classes', 'students', 'attendance'])

      if (tablesError) throw tablesError

      // instructors 테이블의 컬럼 확인
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'instructors')
        .order('ordinal_position')

      if (columnsError) throw columnsError

      const requiredColumns = [
        'id', 'name', 'phone', 'email', 'subject_specialty', 
        'hire_date', 'status', 'salary', 'education', 'experience',
        'certification', 'address', 'emergency_contact', 'emergency_phone', 'memo'
      ]

      const existingColumns = columns.map(col => col.column_name)
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

      addTestResult(
        '데이터베이스 스키마 확인', 
        missingColumns.length === 0, 
        missingColumns.length === 0 
          ? '모든 필수 컬럼 존재 확인'
          : `누락된 컬럼: ${missingColumns.join(', ')}`,
        { tables: tables.map(t => t.table_name), columns: existingColumns, missing: missingColumns }
      )
    } catch (error) {
      addTestResult('데이터베이스 스키마 확인', false, error.message)
    }
  }

  // 개별 테스트 함수들
  const testConnection = async () => {
    setLoading(true)
    setCurrentTest('연결 테스트 중...')
    
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('count')
        .limit(1)

      if (error) throw error

      addTestResult('연결 테스트', true, 'Supabase 연결 성공')
    } catch (error) {
      addTestResult('연결 테스트', false, error.message)
    } finally {
      setLoading(false)
      setCurrentTest('')
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 강사 관리 시스템 테스트</h1>
              <p className="mt-1 text-gray-600">강사 관리 기능의 동작을 테스트합니다</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/instructors"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                강사 관리
              </Link>
              <Link
                href="/test"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                메인 테스트
              </Link>
            </div>
          </div>
        </div>

        {/* 테스트 컨트롤 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎮 테스트 컨트롤</h3>
          <div className="flex space-x-4">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? '테스트 실행 중...' : '🚀 전체 테스트 실행'}
            </button>
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📶 연결 테스트
            </button>
            <button
              onClick={clearResults}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ 결과 지우기
            </button>
          </div>

          {loading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">{currentTest}</span>
              </div>
            </div>
          )}
        </div>

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">📋 테스트 결과</h3>
                <div className="text-sm text-gray-600">
                  총 {testResults.length}개 테스트 • 
                  <span className="text-green-600 ml-1">
                    성공 {testResults.filter(r => r.success).length}개
                  </span> • 
                  <span className="text-red-600 ml-1">
                    실패 {testResults.filter(r => !r.success).length}개
                  </span>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !result.success ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <h4 className="font-medium text-gray-900">{result.test}</h4>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <p className={`text-sm ${result.success ? 'text-gray-600' : 'text-red-800'}`}>
                        {result.message}
                      </p>
                      
                      {/* 상세 데이터 표시 */}
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            상세 데이터 보기
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 테스트 항목 설명 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">🔍 테스트 항목</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">기본 CRUD 테스트</h5>
              <ul className="text-blue-700 space-y-1">
                <li>• 강사 목록 조회</li>
                <li>• 강사 등록 (모든 필드)</li>
                <li>• 강사 상세 정보 조회</li>
                <li>• 강사 정보 수정</li>
                <li>• 강사 데이터 삭제</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-800 mb-2">고급 기능 테스트</h5>
              <ul className="text-blue-700 space-y-1">
                <li>• 데이터베이스 연결</li>
                <li>• 테이블 스키마 검증</li>
                <li>• 관계형 데이터 조회</li>
                <li>• 필수 컬럼 존재 확인</li>
                <li>• 데이터 무결성 검사</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 추가 리소스 */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">🔗 관련 리소스</h4>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/instructors/new"
              className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              새 강사 등록
            </Link>
            <Link
              href="/classes"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              클래스 관리
            </Link>
            <Link
              href="/attendance"
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              출결 관리
            </Link>
            <a
              href="/doc/database_schema_update.sql"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              DB 스키마 문서
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}