'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowUpIcon, ArrowDownIcon } from '@/components/icons'

const MetricCard = ({ title, value, change, changeType, icon, isLoading }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-5">
      {icon}
    </div>

    <div className="flex items-end justify-between">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {isLoading ? '...' : value?.toLocaleString() || 0}
        </h4>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          changeType === 'increase' 
            ? 'bg-success-50 text-success-700' 
            : 'bg-error-50 text-error-700'
        }`}>
          {changeType === 'increase' ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : (
            <ArrowDownIcon className="w-3 h-3" />
          )}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  </div>
)

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeClasses: 0,
    totalInstructors: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      // 병렬로 데이터 가져오기
      const [studentsRes, classesRes, instructorsRes] = await Promise.all([
        supabase.from('students').select('id, status, monthly_fee').eq('status', 'active'),
        supabase.from('classes').select('id, status').eq('status', 'active'),
        supabase.from('instructors').select('id, status').eq('status', 'active')
      ])

      const totalStudents = studentsRes.data?.length || 0
      const activeClasses = classesRes.data?.length || 0
      const totalInstructors = instructorsRes.data?.length || 0
      
      // 월 수익 계산 (학생들의 월 수강료 합계)
      const monthlyRevenue = studentsRes.data?.reduce((sum, student) => 
        sum + (student.monthly_fee || 0), 0) || 0

      setMetrics({
        totalStudents,
        activeClasses,
        totalInstructors,
        monthlyRevenue
      })

    } catch (error) {
      console.error('메트릭 데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        title="총 학생 수"
        value={metrics.totalStudents}
        change={5.2}
        changeType="increase"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        }
      />

      <MetricCard
        title="진행중 클래스"
        value={metrics.activeClasses}
        change={2.1}
        changeType="increase"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-success-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
        }
      />

      <MetricCard
        title="재직중 강사"
        value={metrics.totalInstructors}
        change={1.5}
        changeType="decrease"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-warning-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        }
      />

      <MetricCard
        title="월 수익"
        value={metrics.monthlyRevenue}
        change={8.7}
        changeType="increase"
        isLoading={loading}
        icon={
          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  )
}