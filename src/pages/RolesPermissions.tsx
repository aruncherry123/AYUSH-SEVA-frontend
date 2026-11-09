import { useMemo, useState } from 'react'
import { Shield, Plus, Pencil, Trash2, ShieldCheck, KeyRound, Users, Check } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { Modal } from '../components/ui/modal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { DataTable, type Column } from '../components/ui/data-table'
import { StatusBadge } from '../utils/status'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'
import { useResource } from '../hooks/useResource'
import {
  permissionGroups,
  permissionKey,
  allPermissionKeys,
  describePermission,
} from '../utils/permissions'
import type { Role } from '../types'

export default function RolesPermissions() {
  const toast = useToast()
  const { items, create, update, remove } = useResource('roles')
  const { can } = useAuth()
  const canManage = can('access.manage')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Active')
  const [permissions, setPermissions] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null)

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === 'Active').length,
      users: items.reduce((sum, r) => sum + r.users, 0),
      groups: permissionGroups.length,
    }),
    [items],
  )

  const openCreate = () => {
    if (!canManage) return
    setEditing(null)
    setName('')
    setDescription('')
    setStatus('Active')
    setPermissions(['dashboard.view'])
    setFormOpen(true)
  }

  const openEdit = (role: Role) => {
    if (!canManage) return
    setEditing(role)
    setName(role.name)
    setDescription(role.description)
    setStatus(role.status)
    setPermissions(role.permissions)
    setFormOpen(true)
  }

  const hasAll = permissions.includes('all')

  const toggle = (key: string) => {
    if (hasAll) {
      setPermissions(allPermissionKeys.filter((p) => p !== key))
      return
    }
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]))
  }

  const toggleAll = () => setPermissions(hasAll ? [] : ['all'])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Role name is required')
      return
    }
    if (editing) {
      update(editing.id, { name, description, status: status as Role['status'], permissions })
      toast.success('Role updated')
    } else {
      create({ name, description, users: 0, permissions, status: status as Role['status'] })
      toast.success('Role created')
    }
    setFormOpen(false)
  }

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Role',
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-text-primary">{r.name}</p>
          <p className="truncate text-[11.5px] text-text-tertiary">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'users',
      header: 'Users',
      sortable: true,
      align: 'right',
      render: (r) => <span className="tabular-nums text-text-secondary">{r.users}</span>,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      hideOnMobile: true,
      render: (r) =>
        r.permissions.includes('all') ? (
          <span className="inline-flex items-center gap-1 rounded bg-primary-light px-1.5 py-0.5 text-[11px] font-medium text-primary">
            <ShieldCheck size={11} /> Full access
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.permissions.slice(0, 2).map((p) => (
              <span key={p} className="rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] text-text-secondary">
                {describePermission(p)}
              </span>
            ))}
            {r.permissions.length > 2 && (
              <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[11px] text-text-tertiary">
                +{r.permissions.length - 2}
              </span>
            )}
          </div>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Access control"
        title="Roles & Permissions"
        description="Define access roles and control what each team member can see and do."
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} /> Add role
            </Button>
          ) : undefined
        }
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Roles', value: stats.total, note: 'defined in this workspace', icon: Shield },
          { label: 'Active', value: stats.active, note: 'currently assigned', icon: ShieldCheck, tone: 'text-[#027a48]' },
          { label: 'Users covered', value: stats.users, note: 'across all roles', icon: Users },
          { label: 'Permission groups', value: stats.groups, note: 'modules', icon: KeyRound },
        ]}
      />

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-text-primary">Role catalogue</h2>
            <p className="mt-0.5 text-[12px] text-text-secondary">Select a role to review its permission set.</p>
          </div>
          <span className="rounded-md bg-bg-secondary px-2 py-1 text-[11.5px] font-medium text-text-secondary">
            {items.length} roles
          </span>
        </div>

        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(r) => r.id}
            pageSize={10}
            onRowClick={openEdit}
            actions={(r) => (
              <>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                      aria-label={`Edit ${r.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(r)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error"
                      aria-label={`Delete ${r.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </>
            )}
          />
        </Card>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit role' : 'Add role'}
        description={editing ? 'Update the role and its permissions.' : 'Name the role and choose what it can access.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? 'Save changes' : 'Create role'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Role name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Head Nurse" />
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role is responsible for"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-text-primary">Permissions</p>
              <button
                type="button"
                onClick={toggleAll}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors ${
                  hasAll
                    ? 'border-primary-border bg-primary-light text-primary'
                    : 'border-border text-text-secondary hover:bg-bg-secondary'
                }`}
                aria-pressed={hasAll}
              >
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${hasAll ? 'border-primary bg-primary text-white' : 'border-border-strong'}`}>
                  {hasAll && <Check size={9} strokeWidth={3} />}
                </span>
                Full system access
              </button>
            </div>

            <div className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 ${hasAll ? 'pointer-events-none opacity-50' : ''}`}>
              {permissionGroups.map((group) => (
                <div key={group.module} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
                    {group.module}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.permissions.map((perm) => {
                      const key = permissionKey(group.module, perm)
                      const active = hasAll || permissions.includes(key)
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggle(key)}
                          aria-pressed={active}
                          className={`rounded-md border px-2 py-1 text-[11.5px] capitalize transition-colors ${
                            active
                              ? 'border-primary-border bg-primary-light font-medium text-primary'
                              : 'border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                          }`}
                        >
                          {perm}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove(pendingDelete.id)
            toast.success('Role deleted')
          }
          setPendingDelete(null)
        }}
        title="Delete role?"
        message="Users assigned to this role may lose access. This cannot be undone."
      />
    </div>
  )
}
