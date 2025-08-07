'use client'

import MainLayout from './MainLayout'

export default function PageLayout({ children, title, actions }) {
  return (
    <MainLayout pageTitle={title}>
      <div className="p-6">
        {/* 페이지 헤더 */}
        {(title || actions) && (
          <div className="flex items-center justify-between mb-6">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {title}
                </h1>
              )}
            </div>
            
            {actions && (
              <div className="flex space-x-3">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* 페이지 콘텐츠 */}
        {children}
      </div>
    </MainLayout>
  )
}