export type UserRole = 'driver' | 'boss'
export type ClaimType = 'meal' | 'toll' | 'dental' | 'medical' | 'other'
export type ClaimStatus = 'approved' | 'rejected'

export interface Driver {
  id: string
  auth_id: string | null
  name: string
  phone: string
  base_salary: number
  meal_rate: number
  dental_allowance: number
  medical_allowance: number
  ot_rate: number
  role: UserRole
  active: boolean
  created_at: string
}

export interface Attendance {
  id: string
  driver_id: string
  date: string
  clock_in_at: string
  clock_out_at: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  hours_worked: number | null
}

export interface Claim {
  id: string
  driver_id: string
  date: string
  type: ClaimType
  amount: number
  receipt_url: string | null
  status: ClaimStatus
  rejection_reason: string | null
  created_at: string
}

export interface PayrollSnapshot {
  id: string
  driver_id: string
  month: number
  year: number
  base_salary: number
  days_worked: number
  total_hours: number
  ot_hours: number
  ot_pay: number
  meal_total: number
  toll_total: number
  dental_allowance: number
  medical_allowance: number
  gross_pay: number
  payslip_pdf_url: string | null
  generated_at: string
  locked: boolean
}
