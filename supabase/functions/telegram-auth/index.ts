import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyInitData(
  initData: string,
  botToken: string
): Promise<{ id: number; first_name?: string; username?: string } | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const te = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    te.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secretKey = await crypto.subtle.sign('HMAC', key, te.encode(botToken));
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', hmacKey, te.encode(dataCheckString));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) return null;

  const userStr = params.get('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr) as { id: number; first_name?: string; username?: string };
  if (!user?.id) return null;
  return user;
}

async function derivePassword(botToken: string, tgId: number): Promise<string> {
  const te = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    te.encode(botToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(`sb-tg:${tgId}`));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64.replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 72);
}

function emailForTg(tgId: number) {
  return `tg_${tgId}@telegram-miniapp.invalid`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { initData } = (await req.json()) as { initData?: string };
    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tgUser = await verifyInitData(initData, botToken);
    if (!tgUser) {
      return new Response(JSON.stringify({ error: 'Invalid or expired initData' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tgId = tgUser.id;
    const email = emailForTg(tgId);
    const password = await derivePassword(botToken, tgId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: mapRow } = await supabase
      .from('telegram_auth_map')
      .select('user_id')
      .eq('telegram_id', tgId)
      .maybeSingle();

    if (mapRow?.user_id) {
      const { error: upErr } = await supabase.auth.admin.updateUserById(mapRow.user_id, {
        password,
        user_metadata: {
          telegram_id: tgId,
          first_name: tgUser.first_name,
          username: tgUser.username,
        },
      });
      if (upErr) throw upErr;
    } else {
      const { data: created, error: crErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: tgId,
          first_name: tgUser.first_name,
          username: tgUser.username,
        },
      });

      if (crErr) {
        const msg = crErr.message?.toLowerCase() ?? '';
        if (msg.includes('already') || msg.includes('registered')) {
          const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
          const existing = list?.users?.find((u) => u.email === email);
          if (existing?.id) {
            await supabase.auth.admin.updateUserById(existing.id, { password });
            await supabase.from('telegram_auth_map').upsert({
              telegram_id: tgId,
              user_id: existing.id,
            });
          } else throw crErr;
        } else throw crErr;
      } else if (created?.user?.id) {
        await supabase.from('telegram_auth_map').upsert({
          telegram_id: tgId,
          user_id: created.user.id,
        });
      }
    }

    return new Response(JSON.stringify({ email, password }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
