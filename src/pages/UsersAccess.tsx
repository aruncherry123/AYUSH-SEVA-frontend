import { useMemo, useState } from 'react'
import {
  UserPlus,
  Users,
  UserCheck,
  MailPlus,
  ShieldCheck,
  Building2,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  Copy,
  Send,
  Plus,
} from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { MetricStrip } from '../components/common/MetricStrip'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Modal } from '../components/ui/modal'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { DataTable, type Column } from '../components/ui/data-table'
import { Tabs } from '../components/ui/tabs'
import { Avatar } from '../components/ui/avatar'
import { StatusBadge } from '../utils/status'
import { useStore } from '../state/StoreContext'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { useTabParam } from '../hooks/useTabParam'
import { generateSalt, generateTemporaryPassword, generateToken, hashPassword } from '../services/auth'
import type { Branch, CredentialMode, User, UserAccountStatus, UserRole } from '../types'

const tabs = ['members', 'branches'] as const
const roles: UserRole[] = ['Super Admin', 'Branch Admin', 'Doctor', 'Staff']
const statuses: UserAccountStatus[] = ['Active', 'Invited', 'Inactive', 'Suspended']
const departments = [
  'Administration', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Surgery',
  'Emergency', 'ICU', 'Radiology', 'Pharmacy', 'Laboratory', 'Nursing', 'Front Desk', 'Facilities',
]

interface MemberForm {
  name: string
  email: string
  employeeId: string
  department: string
  designation: string
  branchId: string
  role: UserRole
  phone: string
  status: UserAccountStatus
  credentialMode: CredentialMode
}

interface Credentials {
  mode: CredentialMode
  email: string
  secret: string
  link: string
}

const emptyMember = (branchId: string): MemberForm => ({
  name: '',
  email: '',
  employeeId: '',
  department: 'Administration',
  designation: '',
  branchId,
  role: 'Staff',
  phone: '',
  status: 'Active',
  credentialMode: 'temporary',
})

const roleTone: Record<UserRole, string> = {
  'Super Admin': 'bg-primary-light text-primary',
  'Branch Admin': 'bg-[#f4f3ff] text-[#5925dc]',
  Doctor: 'bg-[#f0fdf9] text-[#107569]',
  Staff: 'bg-bg-secondary text-text-secondary',
}

export default function UsersAccess() {
  const { db, create, update, remove } = useStore()
  const { user: me, can } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useTabParam(tabs, 'members')
  const canManage = can('access.manage')
  const assignableRoles = me?.role === 'Super Admin' ? roles : roles.filter((role) => role !== 'Super Admin')

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [branchFilter, setBranchFilter] = useState('All branches')

  const [memberOpen, setMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMember(db.branches[0]?.id ?? ''))
  const [savingMember, setSavingMember] = useState(false)

  const [branchOpen, setBranchOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: db.organizations[0]?.city ?? '',
    country: db.organizations[0]?.country ?? '',
    address: '',
    phone: '',
    status: 'Active' as Branch['status'],
  })

  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'member' | 'branch'; id: string; name: string } | null>(null)

  const organization = db.organizations.find((item) => item.id === me?.organizationId)

  const members = useMemo(
    () => db.users.filter((member) => member.organizationId === me?.organizationId),
    [db.users, me?.organizationId],
  )
  const branches = useMemo(
    () => db.branches.filter((branch) => branch.organizationId === me?.organizationId),
    [db.branches, me?.organizationId],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return members.filter((member) => {
      if (roleFilter !== 'All roles' && member.role !== roleFilter) return false
      if (statusFilter !== 'All statuses' && member.status !== statusFilter) return false
      if (branchFilter !== 'All branches' && member.branchId !== branchFilter) return false
      if (!needle) return true
      return [member.name, member.email, member.employeeId, member.department, member.designation]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [branchFilter, members, query, roleFilter, statusFilter])

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.status === 'Active').length,
      invited: members.filter((member) => member.status === 'Invited').length,
      branches: branches.length,
    }),
    [branches.length, members],
  )

  const branchName = (id: string) => db.branches.find((branch) => branch.id === id)?.name ?? '—'
  const memberCount = (id: string) => members.filter((member) => member.branchId === id).length

  const setForm = (key: keyof MemberForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setMemberForm((prev) => ({ ...prev, [key]: event.target.value }))

  const openCreateMember = () => {
    setEditingMember(null)
    setMemberForm(emptyMember(me?.branchId ?? branches[0]?.id ?? ''))
    setMemberOpen(true)
  }

  const openEditMember = (member: User) => {
    if (!canManage) return
    setEditingMember(member)
    setMemberForm({
      name: member.name,
      email: member.email,
      employeeId: member.employeeId,
      department: member.department,
      designation: member.designation,
      branchId: member.branchId,
      role: member.role,
      phone: member.phone ?? '',
      status: member.status,
      credentialMode: 'temporary',
    })
    setMemberOpen(true)
  }

  const submitMember = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    if (!memberForm.name.trim() || !memberForm.email.trim() || !memberForm.employeeId.trim()) {
      toast.error('Name, email and employee ID are required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberForm.email.trim())) {
      toast.error('Enter a valid work email address')
      return
    }
    if (memberForm.designation.trim().length === 0) {
      toast.error('Add a designation for this member')
      return
    }
    const duplicate = db.users.find(
      (member) =>
        member.email.toLowerCase() === memberForm.email.trim().toLowerCase() &&
        member.id !== editingMember?.id,
    )
    if (duplicate) {
      toast.error('Email already in use', 'Every account needs a unique sign-in email.')
      return
    }

    const base = {
      organizationId: me?.organizationId ?? db.organizations[0]?.id ?? '',
      branchId: memberForm.branchId,
      name: memberForm.name.trim(),
      email: memberForm.email.trim(),
      role: memberForm.role,
      avatar: memberForm.name
        .replace(/^Dr\.\s*/i, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
      department: memberForm.department,
      designation: memberForm.designation.trim(),
      employeeId: memberForm.employeeId.trim(),
      phone: memberForm.phone.trim() || undefined,
      permissions: undefined,
    }

    if (editingMember) {
      const ownAccount = editingMember.id === me?.id
      const nextStatus = ownAccount ? editingMember.status : memberForm.status
      if (nextStatus === 'Active' && !editingMember.passwordHash) {
        const temporaryPassword = generateTemporaryPassword()
        const salt = generateSalt()
        const passwordHash = await hashPassword(temporaryPassword, salt)
        update('users', editingMember.id, {
          ...base,
          status: 'Active',
          role: ownAccount ? editingMember.role : memberForm.role,
          passwordHash,
          passwordSalt: salt,
          activationToken: undefined,
          mustChangePassword: true,
        })
        setCredentials({
          mode: 'temporary',
          email: editingMember.email,
          secret: temporaryPassword,
          link: '',
        })
      } else {
        update('users', editingMember.id, {
          ...base,
          status: nextStatus,
          role: ownAccount ? editingMember.role : memberForm.role,
        })
      }
      toast.success('Member updated', `${base.name}'s access has been refreshed.`)
      setMemberOpen(false)
      return
    }

    setSavingMember(true)
    const createdAt = new Date().toISOString()
    if (memberForm.credentialMode === 'temporary') {
      const temporaryPassword = generateTemporaryPassword()
      const salt = generateSalt()
      const passwordHash = await hashPassword(temporaryPassword, salt)
      create('users', {
        ...base,
        status: 'Active',
        passwordHash,
        passwordSalt: salt,
        mustChangePassword: true,
        createdAt,
      })
      setCredentials({
        mode: 'temporary',
        email: memberForm.email.trim(),
        secret: temporaryPassword,
        link: '',
      })
    } else {
      const token = generateToken()
      create('users', {
        ...base,
        status: 'Invited',
        activationToken: token,
        invitedAt: createdAt,
        createdAt,
      })
      setCredentials({
        mode: 'invitation',
        email: memberForm.email.trim(),
        secret: '',
        link: `${window.location.origin}/activate/${token}`,
      })
    }
    setSavingMember(false)
    setMemberOpen(false)
    toast.success('Member created', 'Share the credentials or invitation link securely.')
  }

  const toggleStatus = (member: User) => {
    if (!canManage || member.id === me?.id) return
    if (member.status === 'Invited') {
      toast.info('Invitation pending', 'Resend the invitation link from the mail icon.')
      return
    }
    const next: UserAccountStatus = member.status === 'Active' ? 'Inactive' : 'Active'
    update('users', member.id, { status: next })
    toast.success(next === 'Active' ? 'Member activated' : 'Member deactivated', member.name)
  }

  const resendInvite = (member: User) => {
    if (!canManage) return
    const token = generateToken()
    update('users', member.id, { status: 'Invited', activationToken: token, invitedAt: new Date().toISOString() })
    setCredentials({
      mode: 'invitation',
      email: member.email,
      secret: '',
      link: `${window.location.origin}/activate/${token}`,
    })
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy', 'Select the text and copy it manually.')
    }
  }

  const openCreateBranch = () => {
    setEditingBranch(null)
    setBranchForm({
      name: '',
      code: '',
      city: organization?.city ?? '',
      country: organization?.country ?? '',
      address: '',
      phone: '',
      status: 'Active',
    })
    setBranchOpen(true)
  }

  const openEditBranch = (branch: Branch) => {
    if (!canManage) return
    setEditingBranch(branch)
    setBranchForm({
      name: branch.name,
      code: branch.code,
      city: branch.city,
      country: branch.country,
      address: branch.address,
      phone: branch.phone,
      status: branch.status,
    })
    setBranchOpen(true)
  }

  const submitBranch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    if (!branchForm.name.trim() || !branchForm.code.trim()) {
      toast.error('Branch name and code are required')
      return
    }
    if (editingBranch) {
      update('branches', editingBranch.id, { ...branchForm })
      toast.success('Branch updated')
    } else {
      const created = create('branches', {
        ...branchForm,
        organizationId: me?.organizationId ?? db.organizations[0]?.id ?? '',
        createdAt: new Date().toISOString(),
      })
      if (organization) {
        update('organizations', organization.id, { branchCount: branches.length + 1 })
      }
      toast.success('Branch added', created.name)
    }
    setBranchOpen(false)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'member') {
      if (pendingDelete.id === me?.id) {
        toast.error('You cannot remove your own account')
        setPendingDelete(null)
        return
      }
      remove('users', pendingDelete.id)
      toast.success('Member removed')
    } else {
      if (memberCount(pendingDelete.id) > 0) {
        toast.error('Branch is in use', 'Move its members to another branch first.')
        setPendingDelete(null)
        return
      }
      remove('branches', pendingDelete.id)
      if (organization) {
        update('organizations', organization.id, { branchCount: Math.max(1, branches.length - 1) })
      }
      toast.success('Branch removed')
    }
    setPendingDelete(null)
  }

  const memberColumns: Column<User>[] = [
    {
      key: 'name',
      header: 'Member',
      sortable: true,
      render: (member) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={member.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{member.name}</p>
            <p className="truncate text-[11.5px] text-text-tertiary">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      hideOnMobile: true,
      sortable: true,
      render: (member) => <span className="tabular-nums text-text-secondary">{member.employeeId}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (member) => (
        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ${roleTone[member.role]}`}>
          {member.role}
        </span>
      ),
    },
    {
      key: 'branchId',
      header: 'Branch',
      hideOnMobile: true,
      render: (member) => <span className="text-text-secondary">{branchName(member.branchId)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (member) => <StatusBadge status={member.status} />,
    },
  ]

  const branchColumns: Column<Branch>[] = [
    {
      key: 'name',
      header: 'Branch',
      sortable: true,
      render: (branch) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{branch.name}</p>
          <p className="truncate text-[11.5px] text-text-tertiary">
            {branch.code} · {branch.address || branch.city}
          </p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      hideOnMobile: true,
      render: (branch) => <span className="text-text-secondary">{branch.city}</span>,
    },
    {
      key: 'members',
      header: 'Members',
      align: 'right',
      render: (branch) => <span className="tabular-nums text-text-secondary">{memberCount(branch.id)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (branch) => <StatusBadge status={branch.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Access control"
        title="Users & Access"
        description="Create accounts, assign roles and branches, and control how each person signs in."
        actions={
          canManage ? (
            <Button onClick={tab === 'members' ? openCreateMember : openCreateBranch}>
              {tab === 'members' ? <UserPlus size={15} /> : <Plus size={15} />}
              {tab === 'members' ? 'Add member' : 'Add branch'}
            </Button>
          ) : undefined
        }
      />

      <MetricStrip
        columns={4}
        items={[
          { label: 'Members', value: stats.total, note: 'in this organisation', icon: Users },
          { label: 'Active', value: stats.active, note: 'can sign in today', icon: UserCheck, tone: 'text-[#027a48]' },
          { label: 'Invitations', value: stats.invited, note: 'awaiting activation', icon: MailPlus, tone: 'text-[#b54708]' },
          { label: 'Branches', value: stats.branches, note: organization?.plan ? `${organization.plan} plan` : 'in this organisation', icon: Building2 },
        ]}
      />

      <div className="flex flex-col gap-4">
        <Tabs
          tabs={[
            { id: 'members', label: 'Members', count: members.length, icon: Users },
            { id: 'branches', label: 'Branches', count: branches.length, icon: Building2 },
          ]}
          active={tab}
          onChange={setTab}
          variant="underline"
        />

        {tab === 'members' ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, employee ID or department"
                  aria-label="Search members"
                  icon={<Users size={15} />}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
                <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role" className="sm:w-40">
                  <option>All roles</option>
                  {roles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </Select>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="sm:w-40">
                  <option>All statuses</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
                <Select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} aria-label="Filter by branch" className="col-span-2 sm:w-44">
                  <option>All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Card className="overflow-hidden">
              <DataTable
                columns={memberColumns}
                rows={filtered}
                rowKey={(member) => member.id}
                pageSize={10}
                emptyTitle="No members match these filters"
                emptyDescription="Adjust the search or add a new member to this organisation."
                onRowClick={canManage ? openEditMember : undefined}
                actions={
                  canManage
                    ? (member) => (
                        <>
                          {member.status === 'Invited' && (
                            <button
                              onClick={() => resendInvite(member)}
                              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                              aria-label={`Resend invitation to ${member.name}`}
                              title="Resend invitation"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditMember(member)}
                            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                            aria-label={`Edit ${member.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => toggleStatus(member)}
                            disabled={member.id === me?.id}
                            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary disabled:opacity-30"
                            aria-label={member.status === 'Active' ? `Deactivate ${member.name}` : `Activate ${member.name}`}
                            title={member.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {member.status === 'Active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                          <button
                            onClick={() => setPendingDelete({ kind: 'member', id: member.id, name: member.name })}
                            disabled={member.id === me?.id}
                            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error disabled:opacity-30"
                            aria-label={`Remove ${member.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )
                    : undefined
                }
              />
            </Card>
          </>
        ) : (
          <Card className="overflow-hidden">
            <DataTable
              columns={branchColumns}
              rows={branches}
              rowKey={(branch) => branch.id}
              pageSize={10}
              emptyTitle="No branches yet"
              emptyDescription="Add a branch to organise members and operations."
              onRowClick={canManage ? openEditBranch : undefined}
              actions={
                canManage
                  ? (branch) => (
                      <>
                        <button
                          onClick={() => openEditBranch(branch)}
                          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-primary"
                          aria-label={`Edit ${branch.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setPendingDelete({ kind: 'branch', id: branch.id, name: branch.name })}
                          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-[#fef3f2] hover:text-error"
                          aria-label={`Remove ${branch.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )
                  : undefined
              }
            />
          </Card>
        )}
      </div>

      {/* Member form */}
      <Modal
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        title={editingMember ? 'Edit member' : 'Add member'}
        description={
          editingMember
            ? 'Update access, role and branch assignment for this person.'
            : 'Create the account, then share either a temporary password or an activation invitation.'
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitMember} loading={savingMember}>
              {editingMember ? 'Save changes' : 'Create member'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitMember} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={memberForm.name} onChange={setForm('name')} placeholder="Dr. Jane Doe" />
            <Input
              type="email"
              label="Work email"
              required
              value={memberForm.email}
              onChange={setForm('email')}
              disabled={Boolean(editingMember)}
              placeholder="jane@ayushseva.org"
              hint={editingMember ? 'Sign-in email cannot be changed here.' : undefined}
            />
            <Input label="Employee ID" required value={memberForm.employeeId} onChange={setForm('employeeId')} placeholder="EMP-1005" />
            <Input label="Designation" required value={memberForm.designation} onChange={setForm('designation')} placeholder="Staff Nurse" />
            <Select
              label="Department"
              value={memberForm.department}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, department: event.target.value }))}
            >
              {departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </Select>
            <Select
              label="Branch"
              value={memberForm.branchId}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, branchId: event.target.value }))}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
            <Select
              label="Role"
              value={memberForm.role}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              disabled={editingMember?.id === me?.id}
              hint={editingMember?.id === me?.id ? 'You cannot change your own role.' : undefined}
            >
              {assignableRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Select>
            <Input label="Phone" value={memberForm.phone} onChange={setForm('phone')} placeholder="+91 98450 11005" />
            {editingMember ? (
              <Select
                label="Account status"
                value={memberForm.status}
                onChange={(event) => setMemberForm((prev) => ({ ...prev, status: event.target.value as UserAccountStatus }))}
                disabled={editingMember.id === me?.id}
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            ) : (
              <Select
                label="Credentials"
                value={memberForm.credentialMode}
                onChange={(event) =>
                  setMemberForm((prev) => ({ ...prev, credentialMode: event.target.value as CredentialMode }))
                }
                hint={
                  memberForm.credentialMode === 'temporary'
                    ? 'A one-time password is generated and shown after saving.'
                    : 'An activation link is generated for you to share.'
                }
              >
                <option value="temporary">Temporary password</option>
                <option value="invitation">Activation invitation</option>
              </Select>
            )}
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {/* Branch form */}
      <Modal
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title={editingBranch ? 'Edit branch' : 'Add branch'}
        description="Branches group members and operational records within this organisation."
        footer={
          <>
            <Button variant="outline" onClick={() => setBranchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitBranch}>{editingBranch ? 'Save changes' : 'Add branch'}</Button>
          </>
        }
      >
        <form onSubmit={submitBranch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Branch name"
            required
            value={branchForm.name}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="North Branch"
            className="sm:col-span-2"
          />
          <Input label="Branch code" required value={branchForm.code} onChange={(event) => setBranchForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="AYS-NOR" />
          <Select
            label="Status"
            value={branchForm.status}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, status: event.target.value as Branch['status'] }))}
          >
            <option>Active</option>
            <option>Inactive</option>
          </Select>
          <Input label="City" value={branchForm.city} onChange={(event) => setBranchForm((prev) => ({ ...prev, city: event.target.value }))} />
          <Input label="Country" value={branchForm.country} onChange={(event) => setBranchForm((prev) => ({ ...prev, country: event.target.value }))} />
          <Input label="Address" value={branchForm.address} onChange={(event) => setBranchForm((prev) => ({ ...prev, address: event.target.value }))} className="sm:col-span-2" />
          <Input label="Phone" value={branchForm.phone} onChange={(event) => setBranchForm((prev) => ({ ...prev, phone: event.target.value }))} className="sm:col-span-2" />
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {/* Credentials */}
      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title={credentials?.mode === 'temporary' ? 'Temporary credentials' : 'Activation invitation'}
        description="Share this securely. It will not be shown again."
        footer={
          <Button onClick={() => setCredentials(null)}>Done</Button>
        }
      >
        {credentials && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Sign-in email</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[13px] font-medium text-text-primary">{credentials.email}</p>
                <button
                  onClick={() => copy(credentials.email, 'Email')}
                  className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-white hover:text-primary"
                  aria-label="Copy email"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            {credentials.mode === 'temporary' ? (
              <>
                <div className="rounded-lg border border-primary-border bg-primary-light px-3.5 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary">Temporary password</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-mono text-[15px] font-semibold tracking-wide text-text-primary">{credentials.secret}</p>
                    <button
                      onClick={() => copy(credentials.secret, 'Password')}
                      className="rounded-md p-1 text-primary transition-colors hover:bg-white"
                      aria-label="Copy temporary password"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[11.5px] leading-5 text-text-secondary">
                  The member can sign in with this password and is required to choose a new one before opening the workspace.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-primary-border bg-primary-light px-3.5 py-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary">Activation link</p>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="min-w-0 break-all text-[12px] leading-5 text-text-primary">{credentials.link}</p>
                    <button
                      onClick={() => copy(credentials.link, 'Link')}
                      className="shrink-0 rounded-md p-1 text-primary transition-colors hover:bg-white"
                      aria-label="Copy activation link"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[11.5px] leading-5 text-text-secondary">
                  Send this link to the member. They will set their own password on the activation page.
                </p>
              </>
            )}
            <p className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <ShieldCheck size={12} /> Passwords are hashed; this screen is the only place the temporary value is visible.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete?.kind === 'branch' ? 'Remove branch?' : 'Remove member?'}
        message={
          pendingDelete?.kind === 'branch'
            ? `${pendingDelete.name} will be removed if no members are assigned to it.`
            : `${pendingDelete?.name ?? 'This member'} will lose access immediately. This cannot be undone.`
        }
      />
    </div>
  )
}
