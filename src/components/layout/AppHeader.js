'use client'

import { useState } from 'react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@/components/icons'

export default function AppHeader({ onMenuClick, onSidebarToggle }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* 왼쪽: 메뉴 버튼 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <Bars3Icon />
        </button>
        
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-lg hover:bg-gray-100 hidden lg:flex"
          title="사이드바 토글"
        >
          <Bars3Icon />
        </button>
      </div>

      {/* 오른쪽: 알림 & 사용자 정보 */}
      <div className="flex items-center gap-4">
        {/* 알림 버튼 */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 relative"
          >
            <BellIcon />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
          </button>

          {/* 알림 드롭다운 */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-theme-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">알림</h3>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">새로운 학생 등록</p>
                      <p className="text-xs text-gray-500 mt-1">김민준 학생이 등록되었습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">2분 전</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">수업료 미납 알림</p>
                      <p className="text-xs text-gray-500 mt-1">이서연 학생의 수업료 납부가 지연되었습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">1시간 전</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">출석 완료</p>
                      <p className="text-xs text-gray-500 mt-1">오늘 수업 출석이 모두 완료되었습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">3시간 전</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-brand-500 hover:text-brand-600 font-medium">
                    모든 알림 보기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 hidden sm:block">최고관리자님</span>
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">관</span>
          </div>
        </div>
      </div>

      {/* 백드롭 */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </header>
  )
}