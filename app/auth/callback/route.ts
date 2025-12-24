// app/api/auth/callback/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");              // Supabase magic link
  const token_hash = searchParams.get("token_hash");  // OTP fallback
  const type = searchParams.get("type") ?? "email";
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  try {
    let sessionCreated = false;
    let verifiedType = type || "email";

    // Handle magic link/email verification
    if (code) {
      const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) throw error;

      if (sessionData.session) {
        sessionCreated = true;

        // NEW: Check if this is a phone-only user who just added an email
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.phone && user?.email) {
          // This user has both phone and email → likely just confirmed a new email
          // Redirect to set password so they can log in with email+password
          const redirectUrl = new URL('/auth/set-password', origin);
          redirectUrl.searchParams.set('message', 'email_added_set_password');
          return NextResponse.redirect(redirectUrl.toString());
        }

        // Your original behavior for regular signup/email verification
        const redirectUrl = new URL('/auth/login', origin);
        redirectUrl.searchParams.set('message', 'email_verified');
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    // Handle OTP verification fallback
    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      if (error) throw error;

      if (data.session) {
        sessionCreated = true;

        // Special handling for email_change (new email confirmed)
        if (type === "email_change") {
          const redirectUrl = new URL('/auth/set-password', origin);
          redirectUrl.searchParams.set('message', 'email_changed');
          return NextResponse.redirect(redirectUrl.toString());
        }

        // Phone verification success → redirect to dashboard or profile
        if (type === "sms" || type === "phone_change") {
          const redirectUrl = new URL('/user/setting', origin); // ← Change to your profile page
          redirectUrl.searchParams.set('message', 'phone_verified');
          return NextResponse.redirect(redirectUrl.toString());
        }

        // Default OTP success
        const redirectUrl = new URL('/auth/login', origin);
        redirectUrl.searchParams.set('message', 'email_verified');
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    // Fallback redirect on error
    const redirectUrl = new URL('/auth/login', origin);
    redirectUrl.searchParams.set('error', 'invalid_token');
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Verification error:", err);

    // Handle Supabase's intermediate "Confirmation link accepted" redirect
    const errorDesc = searchParams.get("error_description");
    if (errorDesc?.includes("Confirmation link accepted")) {
      const redirectUrl = new URL("/", origin);
      redirectUrl.searchParams.set("message", "email_change_step1");
      return NextResponse.redirect(redirectUrl.toString());
    }
    
    const redirectUrl = new URL('/auth/login', origin);
    redirectUrl.searchParams.set('error', 'verification_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}