const variants = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600 focus:ring-blue-500',
  danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  ghost:     'text-slate-600 hover:text-blue-600 hover:bg-slate-100 focus:ring-blue-500',
}

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
