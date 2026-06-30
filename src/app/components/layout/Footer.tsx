import { Link } from 'react-router'

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-4">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)', borderRadius: 2 }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 8 }}>HE</span>
            </div>
            <span style={{ color: 'var(--text)', fontSize: 11, fontWeight: 600 }}>HEStats</span>
            <span style={{ color: 'var(--muted)', fontSize: 10 }}>hestats.co.uk</span>
          </div>

          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { href: '/universities', label: 'Universities' },
              { href: '/compare', label: 'Compare' },
              { href: '/rankings', label: 'Rankings' },
              { href: '/explorer', label: 'Explorer' },
              { href: '/intelligence', label: 'Intelligence' },
              { href: '/open-data', label: 'Open Data' },
              { href: '/api', label: 'API' },
              { href: '/about', label: 'Methodology' },
              { href: '/support', label: 'Support' },
            ].map((l, i) => (
              <Link
                key={i}
                to={l.href}
                className="transition-colors hover:underline"
                style={{ color: 'var(--text-2)', fontSize: 11 }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: 10, color: 'var(--muted)' }}>
          <span>© 2026 HEStats</span>
          <span>·</span>
          <span>Data registry: OfS · HESA · annual reports · Companies House</span>
          <span>·</span>
          <span>CC BY 4.0</span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--warning)' }}
            />
            Prototype dataset · verified and estimated rows labelled
          </span>
        </div>
      </div>
    </footer>
  )
}
