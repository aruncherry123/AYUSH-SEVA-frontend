import { useMemo, useState } from 'react'
import { Search, Download, ShieldCheck, Filter, X } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { DataTable, type Column } from '../components/ui/data-table'
import { StatusBadge } from '../utils/status'
import { useToast } from '../state/ToastContext'
import { useStore } from '../state/StoreContext'
import type { AuditLog } from '../types'

export default function AuditLogs() {
  const toast = useToast()
  const { db } = useStore()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('')
  const [module, setModule] = useState('')

  const modules = useMemo(() => Array.from(new Set(db.auditLogs.map((l) => l.module))).sort(), [db.auditLogs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.auditLogs.filter((l) => {
      const matchesQ = !q || [l.user, l.action, l.target].some((v) => v.toLowerCase().includes(q))
      return matchesQ && (!severity || l.severity === severity) && (!module || l.module === module)
    })
  }, [db.auditLogs, query, severity, module])

  const counts = useMemo(
    () => ({
      total: db.auditLogs.length,
      warnings: db.auditLogs.filter((l) => l.severity === 'Warning').length,
      critical: db.auditLogs.filter((l) => l.severity === 'Critical').length,
      users: new Set(db.auditLogs.map((l) => l.user)).size,
    }),
    [db.auditLogs],
  )

  const hasFilters = Boolean(query.trim() || severity || module)
  const clear = () => {
    setQuery('')
    setSeverity('')
    setModule('')
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      render: (l) => <span className="whitespace-nowrap font-mono text-[11.5px] text-text-secondary">{l.timestamp}</span>,
    },
    {
      key: 'user',
      header: 'User',
      sortable: true,
      render: (l) => <span className="font-medium text-text-primary">{l.user}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <div className="min-w-0">
          <p className="truncate text-text-primary">{l.action}</p>
          {l.target !== '-' && <p className="truncate text-[11.5px] text-text-tertiary">{l.target}</p>}
        </div>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (l) => (
        <span className="inline-flex rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
          {l.module}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP address',
      hideOnMobile: true,
      render: (l) => <span className="font-mono text-[11.5px] text-text-tertiary">{l.ipAddress}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (l) => <StatusBadge status={l.severity} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Governance"
        title="Audit Logs"
        description="Immutable, chronological record of user activity and system events."
        actions={
          <Button
            variant="outline"
            onClick={() => toast.success('Export queued', 'The audit log export will download shortly.')}
          >
            <Download size={15} /> Export log
          </Button>
        }
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Total events', value: counts.total, note: 'all recorded activity', icon: ShieldCheck },
          { label: 'Warnings', value: counts.warnings, note: 'require review', tone: 'text-[#b54708]' },
          { label: 'Critical', value: counts.critical, note: 'escalated events', tone: 'text-[#b42318]' },
          { label: 'Distinct users', value: counts.users, note: 'with recorded activity', icon: Filter },
        ]}
      />

      <div>
        <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center">
          <div className="w-full xl:max-w-[280px]">
            <Input
              icon={<Search size={15} />}
              placeholder="Search user, action or target…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search audit logs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            <div className="w-[150px]">
              <Select value={module} onChange={(e) => setModule(e.target.value)} aria-label="Filter by module">
                <option value="">All modules</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-[146px]">
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Filter by severity">
                <option value="">All severities</option>
                {['Info', 'Warning', 'Critical'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clear} className="text-text-secondary">
                <X size={13} /> Clear
              </Button>
            )}
            <p className="ml-auto hidden text-[11.5px] text-text-tertiary sm:block">
              <span className="font-medium tabular-nums text-text-secondary">{filtered.length}</span> of{' '}
              <span className="tabular-nums">{db.auditLogs.length}</span> events
            </p>
          </div>
        </div>

        <Card className="mt-4 overflow-hidden">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(l) => l.id}
            pageSize={12}
            density="compact"
            emptyTitle="No matching events"
            emptyDescription="Adjust the filters to widen the audit trail."
          />
        </Card>
      </div>
    </div>
  )
}
