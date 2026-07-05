import { absoluteUrl, getSiteUrl, getSupabaseAuthIssuer } from "@/lib/agents/site";

export function buildOAuthAuthorizationServerMetadata() {
  const site = getSiteUrl();
  const supabaseIssuer = getSupabaseAuthIssuer();
  const supabaseBase = supabaseIssuer.replace(/\/auth\/v1$/, "");

  return {
    issuer: site,
    authorization_endpoint: absoluteUrl("/yonetim/giris"),
    token_endpoint: `${supabaseBase}/auth/v1/token`,
    jwks_uri: `${supabaseBase}/auth/v1/.well-known/jwks.json`,
    registration_endpoint: absoluteUrl("/auth.md"),
    grant_types_supported: ["authorization_code", "refresh_token"],
    response_types_supported: ["code"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
    scopes_supported: ["openid", "email", "profile"],
    agent_auth: {
      skill: absoluteUrl("/auth.md"),
      register_uri: absoluteUrl("/auth.md#registration"),
      identity_types_supported: ["anonymous"],
      methods: [
        {
          type: "anonymous",
          credential_types_supported: ["none"],
          claim_uri: absoluteUrl("/auth.md#anonymous-access"),
        },
      ],
    },
    resource_documentation: absoluteUrl("/docs/api"),
  };
}

export function buildOAuthProtectedResourceMetadata() {
  const site = getSiteUrl();

  return {
    resource: absoluteUrl("/api/admin"),
    authorization_servers: [site],
    scopes_supported: ["admin"],
    bearer_methods_supported: ["header", "cookie"],
    resource_documentation: absoluteUrl("/docs/api"),
    resource_signing_alg_values_supported: ["RS256"],
  };
}

export function buildOpenIdConfiguration() {
  const oauth = buildOAuthAuthorizationServerMetadata();

  return {
    ...oauth,
    issuer: oauth.issuer,
    userinfo_endpoint: `${getSupabaseAuthIssuer()}/user`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  };
}
