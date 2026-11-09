import { Tabs } from '../components/ui/tabs'
import { PageHeader } from '../components/common/PageHeader'
import { useTabParam } from '../hooks/useTabParam'
import Doctors from './Doctors'
import Employees from './Employees'
import Departments from './Departments'

const tabs = ['doctors', 'employees', 'departments'] as const

export default function PeopleDirectory() {
  const [tab, setTab] = useTabParam(tabs, 'doctors')
  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="People"
        title="Directory"
        description="Doctors, staff and departments in one place."
      />
      <Tabs
        ariaLabel="Directory sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'doctors', label: 'Doctors' },
          { id: 'employees', label: 'Employees' },
          { id: 'departments', label: 'Departments' },
        ]}
      />
      {tab === 'doctors' && <Doctors embedded />}
      {tab === 'employees' && <Employees embedded />}
      {tab === 'departments' && <Departments embedded />}
    </div>
  )
}
