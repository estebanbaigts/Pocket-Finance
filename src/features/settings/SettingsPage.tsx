import { PageHeader } from '@/components/ui'
import { BackupSection } from './BackupSection'
import { CategoriesSection } from './CategoriesSection'
import { DangerSection } from './DangerSection'
import { GeneralSection } from './GeneralSection'
import { NativeSection } from './NativeSection'
import { RevenueSection } from './RevenueSection'
import { SyncSection } from './SyncSection'
import { TaxSection } from './TaxSection'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Tes données t’appartiennent : exporte-les, restaure-les ou supprime-les à tout moment." />
      <div className="flex flex-col gap-4">
        <NativeSection />
        <SyncSection />
        <BackupSection />
        <GeneralSection />
        <CategoriesSection />
        <RevenueSection />
        <TaxSection />
        <DangerSection />
      </div>
    </>
  )
}
