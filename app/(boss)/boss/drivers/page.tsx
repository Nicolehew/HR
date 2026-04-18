import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddDriverForm from './AddDriverForm'
import ToggleActive from './ToggleActive'
import type { Driver } from '@/lib/types'

export const revalidate = 0

export default async function DriversPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('role', 'driver')
    .order('name')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Driver</h2>
          <AddDriverForm />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            All Drivers ({drivers?.length ?? 0})
          </h2>
          <div className="space-y-2">
            {(drivers as Driver[] ?? []).map(d => (
              <div key={d.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${!d.active ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.phone} · RM {d.base_salary.toLocaleString()}/mo</p>
                  <p className="text-xs text-gray-400">Meal: RM{d.meal_rate}/day · OT: RM{d.ot_rate}/hr</p>
                </div>
                <ToggleActive driverId={d.id} active={d.active} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
