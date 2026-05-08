export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-800 p-6 transition-colors duration-200 hover:bg-slate-800 ${className}`}>
      {children}
    </div>
  )
}
