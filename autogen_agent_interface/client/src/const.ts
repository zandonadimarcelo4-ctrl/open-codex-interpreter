export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || import.meta.env.VITE_OAUTH_SERVER_URL;
  const appId = import.meta.env.VITE_APP_ID || import.meta.env.APP_ID || "";

  // Verificar se são valores de placeholder ou inválidos
  const isPlaceholder = (value: string | undefined): boolean => {
    if (!value) return true;
    const placeholderValues = [
      "your_app_id",
      "your_jwt_secret",
      "your_owner_open_id",
      "https://oauth.manus.computer", // URL padrão de exemplo
    ];
    return placeholderValues.some(placeholder => 
      value.toLowerCase().includes(placeholder.toLowerCase())
    );
  };

  // Se não houver URL de OAuth configurada ou for placeholder, retornar rota local
  if (
    !oauthPortalUrl || 
    oauthPortalUrl === "" || 
    oauthPortalUrl === "http://localhost:3000" ||
    isPlaceholder(oauthPortalUrl) ||
    isPlaceholder(appId)
  ) {
    console.log("OAuth não configurado ou usando valores de placeholder. Usando rota local.");
    return "/";
  }

  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    
    if (appId && !isPlaceholder(appId)) {
      url.searchParams.set("appId", appId);
    }
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    // Se houver erro ao criar URL, retornar rota local
    console.warn("Erro ao criar URL de OAuth:", error);
    return "/";
  }
};
