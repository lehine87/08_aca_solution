export default function StatusBadge({ status, children, variant, className = '' }) {
  // 상태별 색상 매핑
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    출석: 'bg-green-100 text-green-800',
    지각: 'bg-yellow-100 text-yellow-800',
    결석: 'bg-red-100 text-red-800',
    미처리: 'bg-gray-100 text-gray-800'
  }
  
  // variant별 색상 매핑
  const variantColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800'
  }
  
  // 색상 결정 로직
  let colorClass = 'bg-gray-100 text-gray-800' // 기본값
  
  if (variant && variantColors[variant]) {
    colorClass = variantColors[variant]
  } else if (status && statusColors[status]) {
    colorClass = statusColors[status]
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {children || status}
    </span>
  )
}