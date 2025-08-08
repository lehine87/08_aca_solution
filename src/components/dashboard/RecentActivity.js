'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserIcon, AcademicCapIcon, CheckCircleIcon, XCircleIcon } from '@/components/icons'

export default function RecentActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      // 최근 생성된 학생들
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      // 최근 생성된 클래스들
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('class_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const mockActivities = [
        {
          id: 1,
          type: 'student_registered',
          title: '새 원생 등록',
          description: '김민수 학생이 등록되었습니다.',
          time: '2분 전',
          icon: UserIcon,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50'
        },
        {
          id: 2,
          type: 'class_created',
          title: '새 클래스 생성',
          description: '수학 심화반이 개설되었습니다.',
          time: '15분 전',
          icon: AcademicCapIcon,
          iconColor: 'text-indigo-500',
          iconBg: 'bg-indigo-50'
        },
        {
          id: 3,
          type: 'attendance_marked',
          title: '출석 체크',
          description: '영어 중급반 출석이 완료되었습니다.',
          time: '32분 전',
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
          iconBg: 'bg-green-50'
        },
        {
          id: 4,
          type: 'student_absent',
          title: '결석 알림',
          description: '이영희 학생이 결석 처리되었습니다.',
          time: '1시간 전',
          icon: XCircleIcon,
          iconColor: 'text-red-500',
          iconBg: 'bg-red-50'
        },
        {
          id: 5,
          type: 'class_completed',
          title: '수업 완료',
          description: '과학 실험반 수업이 종료되었습니다.',
          time: '2시간 전',
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
          iconBg: 'bg-green-50'
        }
      ]

      // 실제 데이터와 목업 데이터 조합 (실제 프로젝트에서는 실제 활동 로그를 사용)
      setActivities(mockActivities)
    } catch (error) {
      console.error('최근 활동 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">최근 활동</h3>
        <p className="text-sm text-gray-500 mt-1">학원 운영 활동 내역</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className={`flex items-center justify-center w-10 h-10 ${activity.iconBg} rounded-full`}>
              <activity.icon className={`${activity.iconColor} size-5`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-800 truncate">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 ml-2">
                  {activity.time}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
          모든 활동 보기 →
        </button>
      </div>
    </div>
  )
}