import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user-scoped client to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get student record ID
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const studentId = student?.id;

    // Delete user data from all tables (order matters for dependencies)
    if (studentId) {
      await supabaseAdmin.from("lesson_reviews").delete().eq("student_id", studentId);
      await supabaseAdmin.from("lesson_progress").delete().eq("student_id", studentId);
      await supabaseAdmin.from("exam_attempts").delete().eq("student_id", studentId);
    }

    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("payment_requests").delete().eq("user_id", userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
    await supabaseAdmin.from("moderator_permissions").delete().eq("user_id", userId);
    await supabaseAdmin.from("moderator_scopes").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    if (studentId) {
      await supabaseAdmin.from("students").delete().eq("id", studentId);
    }

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
