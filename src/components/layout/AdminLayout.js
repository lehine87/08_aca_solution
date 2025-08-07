'use client'

import { useState, useEffect } from 'react'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // 모바일에서는 기본적으로 사이드바를 접음
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false)
        setSidebarOpen(false)
      } else {
        setSidebarExpanded(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mainContentMargin = sidebarOpen
    ? "ml-0"
    : sidebarExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <AppSidebar 
        isExpanded={sidebarExpanded}
        isMobileOpen={sidebarOpen}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* 모바일 백드롭 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 메인 콘텐츠 */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSidebarToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
        
        <main className="p-4 mx-auto max-w-[1920px] md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}