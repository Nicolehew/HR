import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: snapshot } = await supabase
    .from('payroll_snapshots')
    .select('*')
    .eq('id', id)
    .single()

  if (!snapshot?.payslip_pdf_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('payslips')
    .download(snapshot.payslip_pdf_url)

  if (error || !data) {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }

  const arrayBuffer = await data.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip-${snapshot.month}-${snapshot.year}.pdf"`,
    },
  })
}
