import { Link } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-2 py-12">
      <div className="max-w-lg">
        <p className="label-micro">Error 404</p>
        <p className="mt-3 font-display text-[64px] font-semibold leading-none tracking-[-0.05em] text-text-primary tabular-nums">
          404
        </p>
        <h1 className="mt-5 font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          This page isn&apos;t available
        </h1>
        <p className="mt-2 text-[13.5px] leading-6 text-text-secondary">
          The page may have been moved, renamed or removed. Check the address, or return to a workspace area below.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-white px-3.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-secondary"
          >
            <ArrowLeft size={15} className="text-text-tertiary" /> Go back
          </button>
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <LayoutDashboard size={15} /> Dashboard
          </Link>
        </div>

        <div className="mt-12 border-t border-border pt-5">
          <p className="label-micro">Frequently used</p>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px]">
            {[
              ['Patients', '/patients'],
              ['Appointments', '/appointments'],
              ['Pharmacy queue', '/pharmacy/prescriptions'],
              ['Reports', '/management/reports'],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="font-medium text-text-secondary transition-colors hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
