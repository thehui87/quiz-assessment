// app/api/admin/invite/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, isAdminInvite } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Invite user via Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (error) throw error;

    // Optionally, if isAdminInvite, set profile.is_admin = true
    if (isAdminInvite) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        is_admin: true,
      });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error("Error inviting user:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
