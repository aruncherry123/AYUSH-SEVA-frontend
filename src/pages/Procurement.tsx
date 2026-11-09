import { Tabs } from '../components/ui/tabs'
import { PageHeader } from '../components/common/PageHeader'
import { useTabParam } from '../hooks/useTabParam'
import Suppliers from './Suppliers'
import PurchaseOrders from './PurchaseOrders'
import StockMovements from './StockMovements'

const tabs = ['suppliers', 'orders', 'movements'] as const

export default function Procurement() {
  const [tab, setTab] = useTabParam(tabs, 'suppliers')
  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Pharmacy & inventory"
        title="Procurement"
        description="Suppliers, purchase orders and every stock movement in one place."
      />
      <Tabs
        ariaLabel="Procurement sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'suppliers', label: 'Suppliers' },
          { id: 'orders', label: 'Purchase Orders' },
          { id: 'movements', label: 'Stock Movements' },
        ]}
      />
      {tab === 'suppliers' && <Suppliers embedded />}
      {tab === 'orders' && <PurchaseOrders embedded />}
      {tab === 'movements' && <StockMovements embedded />}
    </div>
  )
}
