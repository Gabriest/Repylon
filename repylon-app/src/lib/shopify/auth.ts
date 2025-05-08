const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
// Ensure this matches the one in your Shopify App setup
const SHOPIFY_REDIRECT_URI = `${SHOPIFY_APP_URL}/api/auth/callback/shopify`;

interface ShopifyAuthUrlParams {
  shop: string;
  scopes: string[]; // e.g., ['read_products', 'write_orders']
  accessMode?: 'online' | 'offline'; // 'offline' for permanent tokens, 'online' for temporary
}

export const getShopifyAuthUrl = ({ shop, scopes, accessMode = 'offline' }: ShopifyAuthUrlParams): string => {
  if (!shop) {
    throw new Error('Shop name is required to generate Shopify auth URL');
  }
  const scopeString = scopes.join(',');
  // The nonce should be a unique, randomly generated string for each auth request to prevent replay attacks.
  // For simplicity in this example, we are using a static one, but in production, generate it dynamically.
  const nonce = 'randomlygeneratednonce'; // Replace with a dynamic nonce in production

  let authUrl = `https://{shop_name}.myshopify.com/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopeString}&redirect_uri=${SHOPIFY_REDIRECT_URI}&state=${nonce}`.replace('{shop_name}', shop.replace('.myshopify.com', ''));

  if (accessMode === 'online') {
    // For online access, Shopify might use a different grant option parameter depending on the context
    // This is a common way to request online access tokens by omitting the grant_options[] parameter
    // or by specifically asking for per-user access.
    // authUrl += '&grant_options[]=per-user'; // This line might be needed depending on exact requirements
  }

  return authUrl;
};

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
  // Add other potential fields like expires_in, associated_user_scope, associated_user, etc.
}

export const getShopifyTokens = async (shop: string, code: string): Promise<ShopifyTokenResponse> => {
  if (!shop || !code) {
    throw new Error('Shop name and authorization code are required to get Shopify tokens');
  }

  const tokenUrl = `https://{shop_name}.myshopify.com/admin/oauth/access_token`.replace('{shop_name}', shop.replace('.myshopify.com', ''));

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code: code,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Shopify token exchange failed:', response.status, errorBody);
      throw new Error(`Failed to retrieve Shopify tokens: ${response.statusText}`);
    }

    const tokens: ShopifyTokenResponse = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error getting Shopify tokens:', error);
    throw new Error('Failed to retrieve Shopify tokens');
  }
};

// Example of how to make an API call to Shopify after obtaining an access token
export const fetchShopifyData = async (shop: string, accessToken: string, query: string) => {
  const shopifyApiUrl = `https://{shop_name}.myshopify.com/admin/api/2023-10/graphql.json`.replace('{shop_name}', shop.replace('.myshopify.com', ''));

  try {
    const response = await fetch(shopifyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Shopify API request failed:', response.status, errorBody);
      throw new Error(`Shopify API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Shopify data:', error);
    throw new Error('Failed to fetch Shopify data');
  }
};

