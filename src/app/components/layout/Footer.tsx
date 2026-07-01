import { Link } from 'react-router'
import { BrandLogo } from '../brand/BrandLogo'
import { useTheme } from '../../context/ThemeContext'

export function Footer() {
  const { theme } = useTheme()
  const tone = theme === 'dark' ? 'onDark' : 'onLight'

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-4">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
          <div className="flex items-center gap-2">
            <BrandLogo variant="mark" tone={tone} size={16} />
            <BrandLogo variant="wordmark" tone={tone} size={11.5} showTag={false} />
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
              { href: '/brand', label: 'Brand' },
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
              style={{ backgroundColor: 'var(--positive)' }}
            />
            Verified HESA rows · pending gaps labelled
          </span>
        </div>
      </div>
    </footer>
  )
}
