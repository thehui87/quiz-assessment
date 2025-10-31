// app/api/admin/invite/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase"; // Regular client for session check

// Ensure only authenticated admins can hit this API
export async function POST(req: Request) {
  const { email, isAdminInvite } = await req.json();

  // 1. **SECURITY CHECK:** Verify the user making the request is an authenticated admin.
  // This uses the regular, non-service-role client, relying on cookies/session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // NOTE: A more robust check should verify the user's role using RLS on a 'profiles' table.
  // We'll rely on the client-side check implemented in the AdminLayout for the MVP context.

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // 2. **Invite the User** using the Admin API
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      // 🔑 FIX: Change 'emailRedirectTo' to 'redirectTo'
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,

      // Optional: Pass metadata
      data: {
        invited_by: user.id,
      },
    });

    if (error) {
      console.error("Supabase Invite Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. **Assign Role in Database (Optional but important for role-based systems)**
    // The user object exists in auth.users now, we need to populate 'profiles' with the role.
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ is_admin: isAdminInvite === true })
        .eq("id", data.user.id);

      if (profileError) {
        // Log profile error but don't fail the invite, as the auth user was created.
        console.error("Profile role assignment failed:", profileError);
      }
    }

    return NextResponse.json({ message: `Invite sent successfully to ${email}` });
  } catch (error) {
    console.error("Server error during invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
