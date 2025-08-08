'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import { ArrowUpIcon, ArrowDownIcon, UserGroupIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, BanknotesIcon } from '@/components/icons'

export default function AcademyMetrics() {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayAttendance: 0,
    monthlyRevenue: 0,
    attendanceRate: 0,
    activeStudents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      // 전체 학생 수
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact' })

      if (studentsError) throw studentsError

      // 전체 클래스 수
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact' })

      if (classesError) throw classesError

      // 활성 학생 수 (상태가 active인 학생)
      const { data: activeStudents, error: activeError } = await supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      if (activeError) throw activeError

      // 월별 수익 (월 수강료 합계)
      const { data: revenueData, error: revenueError } = await supabase
        .from('students')
        .select('monthly_fee')
        .eq('status', 'active')

      if (revenueError) throw revenueError

      const monthlyRevenue = revenueData?.reduce((sum, student) => 
        sum + (parseInt(student.monthly_fee) || 0), 0) || 0

      // 출석률 계산 (임시로 85%로 설정)
      const attendanceRate = 85

      setMetrics({
        totalStudents: students?.length || 0,
        totalClasses: classes?.length || 0,
        activeStudents: activeStudents?.length || 0,
        monthlyRevenue,
        attendanceRate,
        todayAttendance: Math.floor((activeStudents?.length || 0) * 0.85) // 임시로 85% 출석률 적용
      })
    } catch (error) {
      console.error('메트릭스 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 animate-pulse">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="mt-5">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: "전체 원생",
      value: metrics.totalStudents,
      icon: UserGroupIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      isPositive: true
    },
    {
      title: "진행 클래스",
      value: metrics.totalClasses,
      icon: AcademicCapIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      change: "+5%",
      isPositive: true
    },
    {
      title: "오늘 출석",
      value: metrics.todayAttendance,
      icon: ClipboardDocumentCheckIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `${metrics.attendanceRate}%`,
      isPositive: metrics.attendanceRate >= 80
    },
    {
      title: "월 수익",
      value: `₩${(metrics.monthlyRevenue / 10000).toFixed(0)}만`,
      icon: BanknotesIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+8%",
      isPositive: true
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metricCards.map((metric, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 md:p-6">
          <div className={`flex items-center justify-center w-12 h-12 ${metric.bgColor} rounded-xl`}>
            <metric.icon className={`${metric.color} size-6`} />
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-xl">
                {metric.value}
              </h4>
            </div>
            <Badge color={metric.isPositive ? "success" : "error"} size="sm">
              {metric.isPositive ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3" />
              )}
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}