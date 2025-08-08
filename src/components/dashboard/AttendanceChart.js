'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AttendanceChart() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  const fetchAttendanceData = async () => {
    try {
      // 최근 7일간의 출석 데이터를 시뮬레이션
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date
      })

      const mockData = last7Days.map(date => ({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        attendance: Math.floor(Math.random() * 30) + 50, // 50-80 사이의 랜덤 출석률
        target: 75 // 목표 출석률
      }))

      setChartData(mockData)
    } catch (error) {
      console.error('출석 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => Math.max(d.attendance, d.target)))

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">주간 출석 현황</h3>
        <p className="text-sm text-gray-500 mt-1">최근 7일간 출석률 추이</p>
      </div>

      <div className="space-y-4">
        {/* 범례 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">실제 출석</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600">목표</span>
          </div>
        </div>

        {/* 차트 */}
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col items-center" style={{ height: '200px' }}>
                  {/* 목표선 */}
                  <div 
                    className="w-full bg-gray-200 rounded-t"
                    style={{ 
                      height: `${(data.target / maxValue) * 200}px`,
                      marginBottom: `-${(data.target / maxValue) * 200}px`
                    }}
                  />
                  {/* 실제 출석 */}
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                    style={{ height: `${(data.attendance / maxValue) * 200}px` }}
                  />
                  {/* 값 표시 */}
                  <span className="text-xs font-medium text-gray-700 mt-1">
                    {data.attendance}
                  </span>
                </div>
                {/* 날짜 */}
                <span className="text-xs text-gray-500">{data.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm text-gray-500">평균 출석률</div>
            <div className="text-lg font-semibold text-gray-800">
              {Math.round(chartData.reduce((sum, d) => sum + d.attendance, 0) / chartData.length)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">최고 출석률</div>
            <div className="text-lg font-semibold text-green-600">
              {Math.max(...chartData.map(d => d.attendance))}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">목표 달성률</div>
            <div className="text-lg font-semibold text-blue-600">
              {chartData.filter(d => d.attendance >= d.target).length}/{chartData.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}