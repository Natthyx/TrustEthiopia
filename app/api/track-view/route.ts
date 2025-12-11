// app/api/track-view/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { business_id } = await request.json()

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    // Get real visitor IP (works behind Vercel, Cloudflare, etc.)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || null

    // Create Supabase client (await it!)
    const supabase = await createClient()

    // Try to get logged-in user (optional – we still track guests)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('business_views')
      .insert({
        business_id,
        user_id: user?.id ?? null,
        ip_address: ip === 'unknown' ? null : ip,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in track-view:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}