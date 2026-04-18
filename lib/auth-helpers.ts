// Converts a Malaysian phone number to a stable email used internally for Supabase auth.
// Drivers never see or type this email — they log in with phone + password.
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^60/, '').replace(/^0/, '')
  return `60${digits}@driverpayroll.app`
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^60/, '').replace(/^0/, '')
  return `+60${digits}`
}
