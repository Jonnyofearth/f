import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">📍 Whereabouts</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Share where you are,<br />
            <span className="text-indigo-600">spontaneously.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Type in where you are or where you&apos;re headed, and let your friends see it on a
            map — no GPS required. They can join you with a single tap.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: '✏️',
                title: 'Manual updates',
                body: 'Type where you are or what you\'re doing — no background tracking, ever.',
              },
              {
                icon: '🗺️',
                title: 'Live map',
                body: 'See all your friends\' shared locations pinned on an interactive Mapbox map.',
              },
              {
                icon: '👋',
                title: 'Join plans',
                body: 'Spot a friend grabbing coffee? Hit "Join" and let them know you\'re on the way.',
              },
              {
                icon: '🔔',
                title: 'Notifications',
                body: 'Get notified the moment a friend shares a new location or plan.',
              },
              {
                icon: '👥',
                title: 'Friends list',
                body: 'Add friends by email and manage your connections easily.',
              },
              {
                icon: '📜',
                title: 'Activity feed',
                body: 'A clean feed of recent updates so you never miss what\'s happening.',
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-2">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        Whereabouts &mdash; share your world, on your terms.
      </footer>
    </div>
  );
}

