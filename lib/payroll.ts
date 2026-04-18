import { getISOWeek, getYear } from 'date-fns'
import type { Attendance, Claim, Driver } from './types'

interface WeeklyHours {
  weekKey: string
  hours: number
}

export function calculateOT(attendanceRows: Attendance[], otRatePerHour: number) {
  // Group by ISO week (year-week string to handle year boundaries)
  const weekMap = new Map<string, number>()

  for (const row of attendanceRows) {
    if (row.hours_worked == null) continue
    const d = new Date(row.date)
    const week = getISOWeek(d)
    const yr = getYear(d)
    const key = `${yr}-W${week}`
    weekMap.set(key, (weekMap.get(key) ?? 0) + row.hours_worked)
  }

  let totalOTHours = 0
  const weeks: WeeklyHours[] = []

  weekMap.forEach((hours, weekKey) => {
    const ot = Math.max(0, hours - 40)
    totalOTHours += ot
    weeks.push({ weekKey, hours })
  })

  return {
    otHours: totalOTHours,
    otPay: totalOTHours * otRatePerHour,
    weeklyBreakdown: weeks,
  }
}

export function calculatePayroll(
  driver: Driver,
  attendanceRows: Attendance[],
  claims: Claim[]
) {
  const completedRows = attendanceRows.filter((a) => a.clock_out_at != null)
  const daysWorked = completedRows.length
  const totalHours = completedRows.reduce((sum, a) => sum + (a.hours_worked ?? 0), 0)

  const { otHours, otPay } = calculateOT(attendanceRows, driver.ot_rate)

  const approvedClaims = claims.filter((c) => c.status === 'approved')
  const mealTotal = approvedClaims
    .filter((c) => c.type === 'meal')
    .reduce((sum, c) => sum + c.amount, 0)
  const tollTotal = approvedClaims
    .filter((c) => c.type === 'toll')
    .reduce((sum, c) => sum + c.amount, 0)

  const grossPay =
    driver.base_salary +
    otPay +
    mealTotal +
    tollTotal +
    driver.dental_allowance +
    driver.medical_allowance

  return {
    daysWorked,
    totalHours,
    otHours,
    otPay,
    mealTotal,
    tollTotal,
    dentalAllowance: driver.dental_allowance,
    medicalAllowance: driver.medical_allowance,
    grossPay,
  }
}
