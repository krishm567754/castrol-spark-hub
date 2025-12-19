// Edge function to securely create users with service role
// File: supabase/functions/create-user/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      email,
      password,
      username,
      role,
      hasAllAccess,
      selectedExecs,
      allPages,
      selectedPages,
    } = body as {
      email: string;
      password: string;
      username: string;
      role: "admin" | "user";
      hasAllAccess: boolean;
      selectedExecs: string[];
      allPages: boolean;
      selectedPages: string[];
    };

    if (!email || !password || !username) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (authError || !authData.user) {
      console.error("create-user: auth error", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create auth user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = authData.user.id;

    // Set role: default 'user' is handled by handle_new_user trigger.
    // Only add an explicit role when creating admins.
    let roleError = null as any;
    if (role === "admin") {
      const { error } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role,
      });
      roleError = error;
    }
 
    if (roleError && roleError.code !== "23505") {
      // Ignore duplicate role errors, but surface any other DB issues
      console.error("create-user: role error", roleError);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sales executive access
    if (hasAllAccess) {
      const { error: accessError } = await supabaseAdmin.from("user_sales_exec_access").insert({
        user_id: userId,
        has_all_access: true,
        sales_exec_id: null,
      });
      if (accessError) {
        console.error("create-user: all access error", accessError);
        return new Response(JSON.stringify({ error: accessError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (selectedExecs && selectedExecs.length > 0) {
      const accessRecords = selectedExecs.map((execId: string) => ({
        user_id: userId,
        sales_exec_id: execId,
        has_all_access: false,
      }));
      const { error: accessError } = await supabaseAdmin
        .from("user_sales_exec_access")
        .insert(accessRecords);
      if (accessError) {
        console.error("create-user: exec access error", accessError);
        return new Response(JSON.stringify({ error: accessError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Page access (empty = all pages)
    if (!allPages && selectedPages && selectedPages.length > 0) {
      const pageRecords = selectedPages.map((pageKey: string) => ({
        user_id: userId,
        page_key: pageKey,
      }));
      const { error: pageError } = await supabaseAdmin.from("user_page_access").insert(pageRecords);
      if (pageError) {
        console.error("create-user: page access error", pageError);
        return new Response(JSON.stringify({ error: pageError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-user: unexpected error", err);
    return new Response(JSON.stringify({ error: "Unexpected error creating user" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

Deno.serve(handler);
