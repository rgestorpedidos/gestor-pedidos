import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }

    console.error('[Auth Callback] Error exchanging code:', error.message)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth&message=${encodeURIComponent(error.message)}`
    )
  }

  console.error('[Auth Callback] No code parameter found in URL')
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=auth&message=${encodeURIComponent('No code provided')}`
  )
}
