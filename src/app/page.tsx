import Link from 'next/link'

export default function Home() {
  const menuItems = [
    {
      title: "מעקב אימונים",
      description: "תכנון ומעקב אחר האימונים שלך",
      href: "/workouts",
      icon: "💪",
      gradient: "from-red-600 via-red-700 to-red-800",
      hoverGradient: "from-red-500 via-red-600 to-red-700",
      accent: "bg-red-500/20"
    },
    {
      title: "מעקב תזונה",
      description: "רישום וניתוח הרגלי האכילה",
      href: "/nutrition",
      icon: "🥗",
      gradient: "from-amber-600 via-amber-700 to-amber-800",
      hoverGradient: "from-amber-500 via-amber-600 to-amber-700",
      accent: "bg-amber-500/20"
    },
    {
      title: "ערכים תזונתיים",
      description: "נתונים ותוכן תזונתי של מזונות",
      href: "/nutrition-values",
      icon: "🍎",
      gradient: "from-green-600 via-green-700 to-green-800",
      hoverGradient: "from-green-500 via-green-600 to-green-700",
      accent: "bg-green-500/20"
    },
    {
      title: "סטטיסטיקה",
      description: "מעקב וניתוח הביצועים שלך לאורך זמן",
      href: "/statistics",
      icon: "📊",
      gradient: "from-blue-600 via-blue-700 to-blue-800",
      hoverGradient: "from-blue-500 via-blue-600 to-blue-700",
      accent: "bg-blue-500/20"
    }
  ];
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.05)_50%,transparent_75%)]"></div>
      
      {/* Header */}
      <header className="relative bg-black/40 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
              FiTrack
            </h1>
            <p className="text-gray-400 text-lg font-medium">
              פלטפורמת הכושר המתקדמת שלך
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-amber-600 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Menu */}
      <main className="relative max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block group"
            >
              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${item.gradient}
                rounded-2xl p-8 text-white 
                transform transition-all duration-300 ease-out
                hover:scale-[1.02] hover:shadow-2xl
                group-hover:-translate-y-2
                shadow-xl border border-gray-700/50
                text-center
                before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300
              `}>
                {/* Accent decoration */}
                <div className={`absolute top-4 right-4 w-16 h-16 ${item.accent} rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 tracking-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-white/90 leading-relaxed text-lg font-medium">
                    {item.description}
                  </p>
                  
                  {/* Arrow indicator */}
                  <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Bottom CTA */}
      </main>
    </div>
  )
}