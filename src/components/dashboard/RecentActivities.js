'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RecentActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)

      // 최근 등록된 학생들
      const { data: students } = await supabase
        .from('students')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      // 최근 등록된 강사들
      const { data: instructors } = await supabase
        .from('instructors')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      // 최근 생성된 클래스들
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      // 활동을 시간순으로 정렬
      const allActivities = [
        ...(students || []).map(student => ({
          id: `student-${student.id}`,
          type: 'student',
          title: '새 학생 등록',
          description: `${student.name} 학생이 등록되었습니다`,
          time: student.created_at,
          link: `/students/${student.id}`,
          icon: '👨‍🎓',
          color: 'bg-blue-100 text-blue-600'
        })),
        ...(instructors || []).map(instructor => ({
          id: `instructor-${instructor.id}`,
          type: 'instructor',
          title: '새 강사 등록',
          description: `${instructor.name} 강사가 등록되었습니다`,
          time: instructor.created_at,
          link: `/instructors/${instructor.id}`,
          icon: '👨‍🏫',
          color: 'bg-green-100 text-green-600'
        })),
        ...(classes || []).map(cls => ({
          id: `class-${cls.id}`,
          type: 'class',
          title: '새 클래스 개설',
          description: `${cls.name} 클래스가 개설되었습니다`,
          time: cls.created_at,
          link: `/classes/${cls.id}`,
          icon: '📚',
          color: 'bg-purple-100 text-purple-600'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)

      setActivities(allActivities)

    } catch (error) {
      console.error('최근 활동 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timeString) => {
    const now = new Date()
    const time = new Date(timeString)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white/90">최근 활동</h3>
        <Link 
          href="/activity" 
          className="text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          전체 보기
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500">최근 활동이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={activity.link}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {getTimeAgo(activity.time)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}