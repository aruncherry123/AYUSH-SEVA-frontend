import { Tabs } from '../components/ui/tabs'
import { PageHeader } from '../components/common/PageHeader'
import { useTabParam } from '../hooks/useTabParam'
import Performance from './Performance'
import Workload from './Workload'
import WorkProgress from './WorkProgress'

const tabs = ['scorecard', 'workload', 'progress'] as const

export default function PerformanceHub() {
  const [tab, setTab] = useTabParam(tabs, 'scorecard')
  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Workforce"
        title="Performance"
        description="Staff scores, workload distribution and work progress."
      />
      <Tabs
        ariaLabel="Performance sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'scorecard', label: 'Scorecard' },
          { id: 'workload', label: 'Workload' },
          { id: 'progress', label: 'Work Progress' },
        ]}
      />
      {tab === 'scorecard' && <Performance embedded />}
      {tab === 'workload' && <Workload embedded />}
      {tab === 'progress' && <WorkProgress embedded />}
    </div>
  )
}
