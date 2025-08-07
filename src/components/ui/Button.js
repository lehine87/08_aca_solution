export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  as: Component = 'button',
  href,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[var(--primary-color)] text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-[var(--secondary-color)] text-white hover:bg-amber-600 focus:ring-amber-500'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
  
  // href가 있으면 자동으로 Link로 처리
  if (href && !Component) {
    Component = 'a'
  }
  
  const componentProps = {
    className: classes,
    disabled: disabled || loading,
    ...(href && { href }),
    ...props
  }
  
  return (
    <Component {...componentProps}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="material-icons mr-2 text-lg">
          {icon}
        </span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="material-icons ml-2 text-lg">
          {icon}
        </span>
      )}
    </Component>
  )
}