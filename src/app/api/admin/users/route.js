import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    return NextResponse.json({
      users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        last_sign_in_at: u.last_sign_in_at,
      })),
    });
  } catch (err) {
    console.error("Error fetching admin users:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
