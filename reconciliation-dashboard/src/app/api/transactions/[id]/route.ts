import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('matched'), companyId: z.string() }),
  z.object({ status: z.literal('unmatched') }),
  z.object({ status: z.literal('ignored') }),
])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const json = await req.json()
    const parsed = BodySchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const body = parsed.data
    const payload = body.status === 'matched'
      ? { status: body.status, matched_company_id: body.companyId, match_method: 'manual' }
      : { status: body.status, matched_company_id: null, match_method: null, match_confidence: null }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('bank_transactions')
      .update(payload)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}