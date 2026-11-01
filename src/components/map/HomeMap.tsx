import { useState } from 'react'
import { GeoMap } from './GeoMap'
import { InfoPanel } from './InfoPanel'
import type { Selection } from './layers'

export default function HomeMap() {
  const [sel, setSel] = useState<Selection | null>({ type: 'region', id: 'issykkul' })
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <GeoMap overlays={['admin', 'cities', 'rivers', 'lakes', 'peaks']} regionFill selection={sel} onSelect={setSel} className="h-[440px] md:h-[560px]" />
      <InfoPanel selection={sel} className="lg:max-h-[560px] lg:overflow-y-auto" />
    </div>
  )
}
