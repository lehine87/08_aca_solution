'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ClockIcon, MapPinIcon, UserGroupIcon } from '@/components/icons'
import Badge from '@/components/ui/Badge'

export default function ClassOverview() {
  const [todayClasses, setTodayClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayClasses()
  }, [])

  const fetchTodayClasses = async () => {
    try {
      const today = new Date().getDay() // 0: 일요일, 1: 월요일, ...

      const { data: schedules, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          classes!inner(
            class_name,
            classroom,
            instructor_name,
            max_students
          )
        `)
        .eq('day_of_week', today)
        .order('start_time', { ascending: true })

      if (error) throw error

      // 학생 수 정보 추가 (실제로는 class_students 테이블에서 조회)
      const classesWithStudents = schedules?.map(schedule => ({
        ...schedule,
        current_students: Math.floor(Math.random() * schedule.classes.max_students) + 1,
        status: getCurrentStatus(schedule.start_time, schedule.end_time)
      })) || []

      setTodayClasses(classesWithStudents)
    } catch (error) {
      console.error('오늘 수업 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStatus = (startTime, endTime) => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    if (currentTime < startTime) return 'upcoming'
    if (currentTime > endTime) return 'completed'
    return 'ongoing'
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return <Badge color="info" size="sm">예정</Badge>
      case 'ongoing':
        return <Badge color="success" size="sm">진행중</Badge>
      case 'completed':
        return <Badge color="light" size="sm">완료</Badge>
      default:
        return <Badge color="light" size="sm">-</Badge>
    }
  }

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '-'
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">오늘의 수업</h3>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('ko-KR', { 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
          })} 수업 일정
        </p>
      </div>

      <div className="space-y-4">
        {todayClasses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">오늘 예정된 수업이 없습니다.</p>
          </div>
        ) : (
          todayClasses.map((classItem) => (
            <div 
              key={`${classItem.class_id}-${classItem.start_time}`}
              className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">
                  {classItem.classes.class_name}
                </h4>
                {getStatusBadge(classItem.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{classItem.classes.classroom}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>
                    {classItem.current_students}/{classItem.classes.max_students}명
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{classItem.classes.instructor_name}</span>
                </div>
              </div>

              {/* 출석 진행 바 */}
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>수업 진행률</span>
                  <span>
                    {classItem.status === 'completed' ? '100%' : 
                     classItem.status === 'ongoing' ? '50%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      classItem.status === 'completed' ? 'bg-green-500 w-full' :
                      classItem.status === 'ongoing' ? 'bg-blue-500 w-1/2' : 'bg-gray-300 w-0'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {todayClasses.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">전체</div>
              <div className="text-lg font-semibold text-gray-800">
                {todayClasses.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">진행중</div>
              <div className="text-lg font-semibold text-blue-600">
                {todayClasses.filter(c => c.status === 'ongoing').length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">완료</div>
              <div className="text-lg font-semibold text-green-600">
                {todayClasses.filter(c => c.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}