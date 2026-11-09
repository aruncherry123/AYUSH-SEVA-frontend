import { Tabs } from '../components/ui/tabs'
import { PageHeader } from '../components/common/PageHeader'
import { useTabParam } from '../hooks/useTabParam'
import Equipment from './Equipment'
import Maintenance from './Maintenance'

const tabs = ['assets', 'maintenance'] as const

export default function EquipmentHub() {
  const [tab, setTab] = useTabParam(tabs, 'assets')
  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Facilities"
        title="Equipment"
        description="Asset register and preventive maintenance schedule."
      />
      <Tabs
        ariaLabel="Equipment sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'assets', label: 'Assets' },
          { id: 'maintenance', label: 'Maintenance' },
        ]}
      />
      {tab === 'assets' ? <Equipment embedded /> : <Maintenance embedded />}
    </div>
  )
}
