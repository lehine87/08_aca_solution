'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    todayClasses: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  // 대시보드 통계 조회
  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // 학생 수 조회
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('monthly_fee, status')

      // 클래스 수 조회
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, status, class_schedules(day_of_week)')

      if (studentsError) throw studentsError
      if (classesError) throw classesError

      // 오늘 요일 계산
      const today = new Date().getDay()
      const todayClassesCount = classes?.filter(cls => 
        cls.class_schedules?.some(schedule => schedule.day_of_week === today)
      ).length || 0

      // 통계 계산
      const totalStudents = students?.length || 0
      const activeClasses = classes?.filter(cls => cls.status === 'active').length || 0
      const totalRevenue = students?.filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.monthly_fee || 0), 0) || 0

      setStats({
        totalStudents,
        activeClasses,
        todayClasses: todayClassesCount,
        totalRevenue
      })

    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏫 학원 관리 시스템
          </h1>
          <p className="text-lg text-gray-600">
            효율적인 학원 운영을 위한 통합 솔루션
          </p>
        </div>

        {/* 통계 카드 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* 총 학생 수 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="text-blue-500 text-3xl mr-4">👥</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">총 학생 수</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}명</p>
                </div>
              </div>
            </div>

            {/* 진행 중인 클래스 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="text-green-500 text-3xl mr-4">📚</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">진행 중인 클래스</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClasses}개</p>
                </div>
              </div>
            </div>

            {/* 오늘 수업 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="text-purple-500 text-3xl mr-4">📅</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">오늘 수업</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayClasses}개</p>
                </div>
              </div>
            </div>

            {/* 월 수강료 합계 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="text-yellow-500 text-3xl mr-4">💰</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">월 수강료 합계</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메인 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* 학생 관리 */}
          <Link 
            href="/students"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-blue-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">학생 관리</h3>
              <p className="text-gray-600 mb-4">
                학생 등록, 수정, 조회 및 기본정보 관리
              </p>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                관리하기 →
              </div>
            </div>
          </Link>

          {/* 클래스 관리 */}
          <Link 
            href="/classes"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                📚
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">클래스 관리</h3>
              <p className="text-gray-600 mb-4">
                클래스 생성, 스케줄 관리 및 학생 배정
              </p>
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium">
                관리하기 →
              </div>
            </div>
          </Link>

          {/* 출결 관리 */}
          <Link 
            href="/attendance"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-purple-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                📋
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">출결 관리</h3>
              <p className="text-gray-600 mb-4">
                일별 출석 체크 및 출결 현황 관리
              </p>
              <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">
                관리하기 →
              </div>
            </div>
          </Link>

          {/* 강사 관리 */}
          <Link 
            href="/instructors"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-orange-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                👨‍🏫
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">강사 관리</h3>
              <p className="text-gray-600 mb-4">
                강사 정보 관리 및 클래스 배정
              </p>
              <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium">
                관리하기 →
              </div>
            </div>
          </Link>

          {/* 수강료 관리 */}
          <Link 
            href="/payments"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-yellow-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                💰
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">수강료 관리</h3>
              <p className="text-gray-600 mb-4">
                수강료 납부 현황 및 미납자 관리
              </p>
              <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium">
                관리하기 →
              </div>
            </div>
          </Link>

          {/* 시스템 테스트 */}
          <Link 
            href="/test"
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-6 group"
          >
            <div className="text-center">
              <div className="text-gray-500 text-5xl mb-4 group-hover:scale-110 transition-transform">
                🧪
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">시스템 테스트</h3>
              <p className="text-gray-600 mb-4">
                데이터베이스 연결 및 기능 테스트
              </p>
              <div className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium">
                테스트하기 →
              </div>
            </div>
          </Link>
        </div>

        {/* 오늘의 할 일 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-blue-500 mr-2">📅</span>
            오늘의 할 일
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 출결 체크</h3>
              <p className="text-blue-700 text-sm mb-3">
                오늘 수업 {stats.todayClasses}개의 출결을 확인하세요
              </p>
              <Link 
                href="/attendance"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                바로가기 →
              </Link>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">👥 신규 학생</h3>
              <p className="text-green-700 text-sm mb-3">
                새로운 학생을 등록하거나 상담 관리
              </p>
              <Link 
                href="/students/new"
                className="text-green-600 hover:text-green-800 font-medium text-sm"
              >
                학생 등록 →
              </Link>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">📚 클래스 점검</h3>
              <p className="text-purple-700 text-sm mb-3">
                진행 중인 클래스 현황을 점검하세요
              </p>
              <Link 
                href="/classes"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              >
                클래스 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            🚀 학원 관리 시스템 v1.0 | 
            마지막 업데이트: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}