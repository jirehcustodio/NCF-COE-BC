// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type UpdateRequest = {
  userId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase environment configuration.' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'Invalid or expired user token.' }, 401);
  }

  const requesterRole = userData.user.user_metadata?.role;
  if (!['admin', 'dean'].includes(requesterRole)) {
    return jsonResponse({ error: 'Forbidden.' }, 403);
  }

  let body: UpdateRequest = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
  }

  const metadata = body.metadata ?? {};
  if (!Object.keys(metadata).length) {
    return jsonResponse({ error: 'metadata is required.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let userId = body.userId;
  if (!userId && body.email) {
    const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 });
    if (error) {
      return jsonResponse({ error: error.message || 'Failed to list users.' }, 500);
    }
    const match = data?.users?.find((user: { email?: string; id?: string }) =>
      user.email?.toLowerCase() === body.email?.toLowerCase()
    );
    userId = match?.id;
  }

  if (!userId) {
    return jsonResponse({ error: 'userId or email is required.' }, 400);
  }

  const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  if (updateError) {
    return jsonResponse({ error: updateError.message || 'Failed to update user.' }, 500);
  }

  return jsonResponse({ user: updated?.user ?? null });
});
