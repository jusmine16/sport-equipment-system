const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function readEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    result[key] = value;
  }
  return result;
}

async function main() {
  const root = process.cwd();
  const env = { ...readEnvFile(path.join(root, '.env')), ...readEnvFile(path.join(root, 'frontend', '.env.local')) };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const accounts = [
    {
      email: 'admin@seb.local',
      password: 'admin123',
      username: 'admin',
      display_name: 'Admin',
      role: 'admin',
    },
    {
      email: 'genie.castillo@gmail.com',
      password: 'genie12345',
      username: 'genie.castillo',
      display_name: 'Genie Castillo',
      role: 'user',
    },
  ];

  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;

  const currentUsers = listed.data.users || [];

  for (const account of accounts) {
    let user = currentUsers.find((candidate) => candidate.email === account.email);
    if (!user) {
      const created = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          username: account.username,
          display_name: account.display_name,
          name: account.display_name,
          full_name: account.display_name,
          role: account.role,
        },
      });
      if (created.error) throw created.error;
      user = created.data.user;
      console.log(`created auth user: ${account.email}`);
    } else {
      const updated = await supabase.auth.admin.updateUserById(user.id, {
        password: account.password,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          username: account.username,
          display_name: account.display_name,
          name: account.display_name,
          full_name: account.display_name,
          role: account.role,
        },
      });
      if (updated.error) throw updated.error;
      user = updated.data.user;
      console.log(`updated auth user: ${account.email}`);
    }
    console.log(JSON.stringify({ email: account.email, id: user.id, password: account.password, username: account.username, role: account.role }));
  }
}

main().catch((error) => {
  console.error('FAILED:', error.message || error);
  process.exit(1);
});
