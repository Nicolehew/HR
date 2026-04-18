import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { phoneToEmail, normalizePhone } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Only boss can create drivers
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: boss } = await supabase.from('drivers').select('role').eq('auth_id', user.id).single()
  if (boss?.role !== 'boss') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, phone, password, base_salary, meal_rate, ot_rate, dental_allowance, medical_allowance } = await req.json()

  const email = phoneToEmail(phone)
  const normalizedPhone = normalizePhone(phone)

  // Create Supabase auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.includes('already') ? 'A driver with this phone number already exists.' : 'Could not create account. Please try again.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Insert driver row linked to auth user
  const { error: dbError } = await serviceClient.from('drivers').insert({
    auth_id: authData.user.id,
    name,
    phone: normalizedPhone,
    base_salary: base_salary ?? 3000,
    meal_rate: meal_rate ?? 15,
    ot_rate: ot_rate ?? 10,
    dental_allowance: dental_allowance ?? 300,
    medical_allowance: medical_allowance ?? 300,
  })

  if (dbError) {
    // Roll back auth user if DB insert fails
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Could not save driver. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
