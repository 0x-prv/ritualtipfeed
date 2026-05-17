import { createClient } from '@/integrations/supabase.client';

// Helper function to generate a random code verifier for PKCE
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

// Helper function to base64url encode a Uint8Array
function base64urlEncode(array: Uint8Array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper function to generate a random state token
function generateStateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

export async function GET({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const wallet_address = url.searchParams.get('wallet_address');

    if (!wallet_address) {
      return new Response('Missing wallet_address parameter', { status: 400 });
    }

    // Generate PKCE parameters
    const code_verifier = generateCodeVerifier();
    const state_token = generateStateToken();

    // Set cookies for later verification in callback
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `x_oauth_code_verifier=${code_verifier}; Path=/; HttpOnly; SameSite=Lax`
    );
    headers.append(
      'Set-Cookie',
      `x_oauth_state_token=${wallet_address}.${state_token}; Path=/; HttpOnly; SameSite=Lax`
    );

    // Construct Twitter OAuth URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', import.meta.env.VITE_X_CONSUMER_KEY);
    authUrl.searchParams.set('redirect_uri', `${new URL(request.url).origin}/api/x/callback`);
    authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.set('state', `${wallet_address}.${state_token}`);
    authUrl.searchParams.set('code_challenge', code_verifier); // For PKCE
    authUrl.searchParams.set('code_challenge_method', 'plain');

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        ...Object.fromEntries(headers),
      },
    });
  } catch (err) {
    console.error('Error initiating X OAuth login:', err);
    return new Response('Internal server error', { status: 500 });
  }
}