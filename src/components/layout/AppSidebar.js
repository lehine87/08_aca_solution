'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  GridIcon, 
  PeopleIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CogIcon,
  ChevronDownIcon
} from '@/components/icons'

const navigationItems = [
  {
    name: '대시보드',
    icon: <GridIcon />,
    path: '/'
  },
  {
    name: '원생관리',
    icon: <PeopleIcon />,
    path: '/students',
    subItems: [
      { name: '원생 목록', path: '/students' },
      { name: '원생 등록', path: '/students/new' }
    ]
  },
  {
    name: '클래스관리',
    icon: <AcademicCapIcon />,
    path: '/classes',
    subItems: [
      { name: '클래스 목록', path: '/classes' },
      { name: '클래스 등록', path: '/classes/new' }
    ]
  },
  {
    name: '출결관리',
    icon: <ClipboardDocumentCheckIcon />,
    path: '/attendance',
    subItems: [
      { name: '출결 현황', path: '/attendance' },
      { name: '출결 통계', path: '/attendance/stats' }
    ]
  },
  {
    name: '강사관리',
    icon: <UserGroupIcon />,
    path: '/instructors',
    subItems: [
      { name: '강사 목록', path: '/instructors' },
      { name: '강사 등록', path: '/instructors/new' }
    ]
  },
  {
    name: '성적관리',
    icon: <ChartBarIcon />,
    path: '/grades',
    subItems: [
      { name: '성적 입력', path: '/grades' },
      { name: '성적 분석', path: '/grades/analytics' }
    ]
  },
  {
    name: '수납관리',
    icon: <BanknotesIcon />,
    path: '/payments',
    subItems: [
      { name: '수납 현황', path: '/payments' },
      { name: '수납 관리', path: '/payments/manage' }
    ]
  },
  {
    name: '상담관리',
    icon: <ChatBubbleLeftRightIcon />,
    path: '/counseling',
    subItems: [
      { name: '상담 예약', path: '/counseling' },
      { name: '상담 기록', path: '/counseling/records' }
    ]
  },
  {
    name: '알림/메시지',
    icon: <BellIcon />,
    path: '/notifications'
  },
  {
    name: '기본설정',
    icon: <CogIcon />,
    path: '/settings'
  }
]

export default function AppSidebar({ 
  isExpanded, 
  isMobileOpen, 
  isHovered, 
  setIsHovered, 
  onClose 
}) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState(null)

  const isActive = useCallback((path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }, [pathname])

  // 현재 경로에 맞는 서브메뉴 자동 열기
  useEffect(() => {
    navigationItems.forEach((item, index) => {
      if (item.subItems && item.subItems.some(subItem => isActive(subItem.path))) {
        setOpenSubmenu(index)
      }
    })
  }, [pathname, isActive])

  const handleSubmenuToggle = (index) => {
    setOpenSubmenu(prevOpen => prevOpen === index ? null : index)
  }

  const showText = isExpanded || isHovered || isMobileOpen

  return (
    <aside
      className={`fixed mt-0 lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 로고 */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="text-xl font-bold text-brand-500">
          {showText ? "학원조아" : "학"}
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-2">
          {navigationItems.map((item, index) => (
            <li key={item.name}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`menu-item group ${
                      isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                    } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                  >
                    <span className={`${
                      isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}>
                      {item.icon}
                    </span>
                    
                    {showText && (
                      <>
                        <span className="menu-item-text">{item.name}</span>
                        <ChevronDownIcon
                          className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                            openSubmenu === index ? "rotate-180 text-brand-500" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* 서브메뉴 */}
                  {item.subItems && showText && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openSubmenu === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <ul className="mt-2 space-y-1 ml-9">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.path}
                              className={`menu-dropdown-item ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-item-active"
                                  : "menu-dropdown-item-inactive"
                              }`}
                              onClick={onClose}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`menu-item group ${
                    isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                  onClick={onClose}
                >
                  <span className={`${
                    isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}>
                    {item.icon}
                  </span>
                  {showText && (
                    <span className="menu-item-text">{item.name}</span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}