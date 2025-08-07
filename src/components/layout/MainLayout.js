'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  { 
    name: '대시보드', 
    href: '/', 
    icon: 'dashboard',
    exact: true
  },
  { 
    name: '수업관리', 
    href: '/classes', 
    icon: 'event_note'
  },
  { 
    name: '원생관리', 
    href: '/students', 
    icon: 'people'
  },
  { 
    name: '강사관리', 
    href: '/instructors', 
    icon: 'assignment_ind'
  },
  { 
    name: '출결관리', 
    href: '/attendance', 
    icon: 'co_present'
  },
  { 
    name: '성적관리', 
    href: '/grades', 
    icon: 'assessment'
  },
  { 
    name: '수납관리', 
    href: '/payments', 
    icon: 'payment'
  },
  { 
    name: '상담관리', 
    href: '/counseling', 
    icon: 'chat'
  },
  { 
    name: '알림/메시지', 
    href: '/notifications', 
    icon: 'campaign'
  },
  { 
    name: '기본설정', 
    href: '/settings', 
    icon: 'settings'
  }
]

export default function MainLayout({ children, pageTitle }) {
  const pathname = usePathname()

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle ? `${pageTitle} - 학원관리시스템` : '학원관리시스템'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" 
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet"
        />
        <style type="text/tailwindcss">{`
          body {
            font-family: 'Noto Sans KR', sans-serif;
          }
          :root {
            --primary-color: #4f46e5;
            --secondary-color: #f59e0b;
            --sidebar-bg: #1f2937;
            --sidebar-hover-bg: #374151;
            --sidebar-active-bg: #4f46e5;
          }
        `}</style>
      </head>
      <body className="bg-gray-100">
        <div className="flex h-screen">
          {/* 사이드바 */}
          <aside className="w-64 bg-[var(--sidebar-bg)] text-white flex flex-col">
            {/* 로고/브랜드 */}
            <div className="h-16 flex items-center justify-center text-xl font-bold border-b border-gray-700">
              <Link href="/" className="hover:text-gray-200 transition-colors">
                학원조아
              </Link>
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item)
                      ? 'bg-[var(--sidebar-active-bg)]'
                      : 'hover:bg-[var(--sidebar-hover-bg)]'
                  }`}
                >
                  <span className="material-icons mr-3 text-xl">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1 flex flex-col">
            {/* 상단 헤더 */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
              <div className="flex items-center">
                {pageTitle && (
                  <h1 className="text-2xl font-bold text-gray-800">
                    {pageTitle}
                  </h1>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 알림 아이콘 */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="material-icons">notifications</span>
                </button>
                
                {/* 사용자 정보 */}
                <div className="flex items-center">
                  <span className="text-sm mr-4 text-gray-700">최고관리자님</span>
                  <img 
                    alt="User avatar" 
                    className="h-10 w-10 rounded-full border border-gray-200" 
                    src="https://via.placeholder.com/40/4f46e5/ffffff?text=관"
                  />
                </div>
              </div>
            </header>

            {/* 페이지 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}