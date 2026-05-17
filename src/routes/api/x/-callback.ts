import { createClient } from '@supabase/supabase-js';

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

export async function handle({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 });
    }

    // Parse state: wallet_address.state_token
    const [wallet_address, stateTokenFromParam] = state.split('.');
    if (!wallet_address || !stateTokenFromParam) {
      return new Response('Invalid state format', { status: 400 });
    }

    // Get cookies from request
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader
        .split('; ')
        .map((cookie) => cookie.split('='))
        .map(([key, value]) => [key, decodeURIComponent(value)])
    );

    const expectedStateToken = cookies['x_oauth_state_token'];
    const codeVerifier = cookies['x_oauth_code_verifier'];

    if (!expectedStateToken || !codeVerifier) {
      return new Response('Missing required cookies', { status: 400 });
    }

    if (stateTokenFromParam !== expectedStateToken) {
      return new Response('Invalid state token', { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_X_CONSUMER_KEY,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${new URL(request.url).origin}/api/x/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        `Failed to exchange code for token: ${errorText}`,
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=username,profile_image_url', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return new Response(
        `Failed to fetch user info: ${errorText}`,
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();
    const username = userData.data.username;

    // Save X handle to wallet_profiles using Supabase
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('wallet_profiles')
      .upsert(
        { wallet_address: wallet_address, x_handle: username },
        { onConflict: 'wallet_address' }
      );

    if (error) {
      console.error('Error saving X handle:', error);
      return new Response('Failed to save X handle', { status: 500 });
    }

    // Clear cookies by setting them to expire in the past
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      'x_oauth_state_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
    headers.append(
      'Set-Cookie',
      'x_oauth_code_verifier=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );

    // Redirect to home page with success flag
    const redirectUrl = new URL('/', new URL(request.url).origin);
    redirectUrl.searchParams.set('x_connected', '1');

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
        ...Object.fromEntries(headers),
      },
    });
  } catch (err) {
    console.error('Error in X OAuth callback:', err);
    return new Response('Internal server error', { status: 500 });
  }
}