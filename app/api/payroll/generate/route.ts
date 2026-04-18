import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculatePayroll } from '@/lib/payroll'
import { generatePayslipPDF } from '@/lib/pdf'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { Driver, Attendance, Claim, PayrollSnapshot } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: boss } = await supabase.from('drivers').select('role').eq('auth_id', user.id).single()
  if (boss?.role !== 'boss') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { month, year, driverIds } = await req.json() as { month: number; year: number; driverIds: string[] }

  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

  const { data: drivers } = await serviceClient.from('drivers').select('*').in('id', driverIds)
  const { data: allAttendance } = await serviceClient.from('attendance').select('*').in('driver_id', driverIds).gte('date', monthStart).lte('date', monthEnd)
  const { data: allClaims } = await serviceClient.from('claims').select('*').in('driver_id', driverIds).gte('date', monthStart).lte('date', monthEnd)

  const errors: string[] = []

  for (const driver of (drivers as Driver[] ?? [])) {
    const driverAttendance = (allAttendance as Attendance[] ?? []).filter(a => a.driver_id === driver.id)
    const driverClaims = (allClaims as Claim[] ?? []).filter(c => c.driver_id === driver.id)
    const calc = calculatePayroll(driver, driverAttendance, driverClaims)

    // Upsert snapshot
    const snapshot: Omit<PayrollSnapshot, 'id' | 'payslip_pdf_url' | 'generated_at'> & { payslip_pdf_url?: string } = {
      driver_id: driver.id,
      month,
      year,
      base_salary: driver.base_salary,
      days_worked: calc.daysWorked,
      total_hours: calc.totalHours,
      ot_hours: calc.otHours,
      ot_pay: calc.otPay,
      meal_total: calc.mealTotal,
      toll_total: calc.tollTotal,
      dental_allowance: calc.dentalAllowance,
      medical_allowance: calc.medicalAllowance,
      gross_pay: calc.grossPay,
      locked: true,
    }

    const { data: upserted, error: upsertErr } = await serviceClient
      .from('payroll_snapshots')
      .upsert(snapshot, { onConflict: 'driver_id,month,year' })
      .select()
      .single()

    if (upsertErr || !upserted) {
      errors.push(`Snapshot failed for ${driver.name}: ${upsertErr?.message}`)
      continue
    }

    // Generate PDF
    try {
      const pdfBuffer = await generatePayslipPDF(driver, upserted as PayrollSnapshot)
      const pdfPath = `payslips/${driver.id}/${year}-${String(month).padStart(2, '0')}.pdf`

      await serviceClient.storage.from('payslips').upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

      await serviceClient
        .from('payroll_snapshots')
        .update({ payslip_pdf_url: pdfPath })
        .eq('id', (upserted as PayrollSnapshot).id)
    } catch (pdfErr) {
      errors.push(`PDF failed for ${driver.name}: ${String(pdfErr)}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 207 })
  }

  return NextResponse.json({ success: true })
}
