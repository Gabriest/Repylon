// Placeholder for Shopify Auth Logic
// Este ficheiro precisará de ser expandido com a lógica de autenticação OAuth da Shopify real.

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL; // Ex: https://meu-app.vercel.app

// Os scopes que a sua aplicação vai pedir
// Consulte: https://shopify.dev/docs/apps/auth/oauth/scopes
const SCOPES = [
  "read_products",
  "write_products",
  "read_orders",
  // Adicione outros scopes conforme necessário para o Repylon
].join(",");

interface ShopifyAuthUrls {
  authUrl: string;
  callbackUrl: string;
}

/**
 * Gera os URLs necessários para o processo de autenticação OAuth da Shopify.
 * @param shop O nome da loja Shopify (ex: nomedaloja.myshopify.com).
 * @returns Um objeto contendo o URL de autorização e o URL de callback.
 */
function getShopifyAuthUrls(shop: string): ShopifyAuthUrls {
  if (!SHOPIFY_API_KEY || !SHOPIFY_APP_URL) {
    throw new Error(
      "Variáveis de ambiente Shopify (SHOPIFY_API_KEY, SHOPIFY_APP_URL) não configuradas."
    );
  }

  const callbackUrl = `${SHOPIFY_APP_URL}/api/auth/shopify/callback`;

  // A linha abaixo é a que foi alterada de let para const
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(
    callbackUrl
  )}`;

  return {
    authUrl,
    callbackUrl,
  };
}

/**
 * Lógica para trocar o código de autorização por um token de acesso.
 * Esta função será chamada no seu endpoint de callback.
 * @param shop O nome da loja Shopify.
 * @param code O código de autorização recebido da Shopify.
 * @returns O token de acesso.
 */
async function getShopifyAccessToken(
  shop: string,
  code: string
): Promise<string | null> {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    console.error(
      "Variáveis de ambiente Shopify (SHOPIFY_API_KEY, SHOPIFY_API_SECRET) não configuradas para obter token."
    );
    return null;
  }

  const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
  const payload = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  };

  try {
    const response = await fetch(accessTokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Erro ao obter token de acesso da Shopify: ${response.status}`, errorBody
      );
      return null;
    }

    const jsonResponse = await response.json();
    // A resposta da Shopify geralmente inclui { access_token: "...", scope: "..." }
    return jsonResponse.access_token;
  } catch (error) {
    console.error("Falha na requisição para obter token de acesso da Shopify:", error);
    return null;
  }
}

export { getShopifyAuthUrls, getShopifyAccessToken };
export type { ShopifyAuthUrls };

