import Link from 'next/link'

export default function Home() {
  const menuItems = [
    {
      title: "מעקב אימונים",
      description: "תכנון ומעקב אחר האימונים שלך",
      href: "/workouts",
      icon: "💪",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "מעקב תזונה",
      description: "רישום וניתוח הרגלי האכילה",
      href: "/nutrition",
      icon: "🥗",
      color: "from-green-500 to-green-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            FiTrack
          </h1>
        </div>
      </header>

      {/* Main Menu */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block group"
            >
              <div className={`
                bg-gradient-to-r ${item.color}
                rounded-xl p-8 text-white 
                transform transition-all duration-200
                hover:scale-105 hover:shadow-xl
                group-hover:-translate-y-1
                shadow-lg
                text-center
              `}>
                <div className="text-6xl mb-4">{item.icon}</div>
                
                <h3 className="text-2xl font-bold mb-3">
                  {item.title}
                </h3>
                
                <p className="text-white/90 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}