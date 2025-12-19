import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");        // Supabase magic link
  const token_hash = searchParams.get("token_hash"); // OTP fallback
  const type = searchParams.get("type") ?? "email";

  const supabase = await createClient();

  try {
    // Handle magic link/email verification
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Construct proper redirect URL
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('message', 'email_verified');
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    // Handle OTP verification fallback
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      if (!error) {
        // Construct proper redirect URL
        const redirectUrl = new URL('/auth/login', request.url);
        // Different message based on verification type
        if (type === 'sms') {
          redirectUrl.searchParams.set('message', 'phone_verified');
        } else {
          redirectUrl.searchParams.set('message', 'email_verified');
        }
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    // Fallback redirect on error
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('error', 'invalid_token');
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Verification error:", err);
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('error', 'verification_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}