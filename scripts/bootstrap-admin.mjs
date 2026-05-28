import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv, parse as parseEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(scriptDir, '..', '.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

loadEnv({ path: fs.existsSync(cwdEnvPath) ? cwdEnvPath : rootEnvPath });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const fallbackPath = fs.existsSync(rootEnvPath) ? rootEnvPath : cwdEnvPath;
  if (fallbackPath && fs.existsSync(fallbackPath)) {
    const raw = fs.readFileSync(fallbackPath, 'utf-8');
    const parsed = parseEnv(raw);
    Object.entries(parsed).forEach(([key, value]) => {
      if (!process.env[key]) process.env[key] = value;
    });
    const extract = (key) => {
      const match = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*"?([^"\\r\\n]*)"?`, 'm'));
      return match?.[1];
    };
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = extract('SUPABASE_URL') || extract('REACT_APP_SUPABASE_URL') || '';
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = extract('SUPABASE_SERVICE_ROLE_KEY') || '';
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1];
}

const email = readArg('--email');
const password = readArg('--password');
const name = readArg('--name') || 'Admin';
const program = readArg('--program') || 'Administration';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

if (!email) {
  console.error('Usage: node scripts/bootstrap-admin.mjs --email you@school.edu --password TempPass123 --name "Admin Name"');
  process.exit(1);
}

if (!password) {
  console.error('A temporary password is required to create the admin user.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function findUserByEmail() {
  if (typeof supabase.auth.admin.getUserByEmail === 'function') {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    if (error) {
      console.error('Failed to fetch user by email:', error.message || error);
      return null;
    }
    return data?.user || null;
  }
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('Failed to list users:', listError.message || listError);
    return null;
  }

  return listData?.users?.find(user => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function run() {
  const existing = await findUserByEmail();
  let userId = existing?.id;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', name },
    });

    if (createError) {
      console.error('Failed to create admin user:', createError.message || createError);
      if (createError?.status) console.error('Status:', createError.status);
      if (createError?.code) console.error('Code:', createError.code);
      console.error('Tip: check Supabase Auth logs for details. If the email already exists, delete it in Auth > Users and re-run.');
      process.exit(1);
    }

    userId = created?.user?.id;
  } else {
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(existing?.user_metadata || {}),
        role: 'admin',
        name,
      },
    });

    if (updateError) {
      console.error('Failed to update admin metadata:', updateError.message || updateError);
      process.exit(1);
    }
  }

  await supabase.from('faculty_records').upsert({
    id: email,
    name,
    dept: program,
    rank: 'Admin',
    status: 'Active',
  });

  console.log(`Admin user ready: ${email} (${userId})`);
}

run().catch((error) => {
  console.error('Unexpected error:', error?.message || error);
  process.exit(1);
});
