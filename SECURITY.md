# Security

## Current state (v2): JWT authentication

The API is protected by **stateless JWT bearer authentication** (Spring Security + jjwt):

- `POST /api/v1/auth/register` — create an account (email + password + display name);
  returns a signed JWT.
- `POST /api/v1/auth/login` — exchange credentials for a JWT.
- Every other `/api/v1/**` endpoint requires an `Authorization: Bearer <token>` header and
  is **scoped to the authenticated user** — you can only see, edit, delete, and summarize
  your own expenses. Requests for another user's expense return 404 (not 403), so
  expense ids are not enumerable.

Implementation notes:

- Passwords are hashed with **BCrypt**; only the hash is stored (`users.password_hash`).
- Tokens are signed with **HS256**. The key comes from the `JWT_SECRET` env var
  (minimum 32 characters — generate one with `openssl rand -base64 48`). The `dev` and
  `test` profiles ship harmless local-only defaults; **prod has no default** and fails fast
  at startup if `JWT_SECRET` is missing or too short.
- Token lifetime defaults to 24h, configurable via `JWT_EXPIRATION_MINUTES`.
- Sessions are stateless (`SessionCreationPolicy.STATELESS`), CSRF is disabled (no cookies
  are used for auth), and unauthenticated requests get the standard error JSON with 401.
- Public paths: `/api/v1/auth/**`, `/actuator/health`, Swagger UI, and the H2 console
  (dev profile only — the H2 dependency is runtime-only and the console is disabled outside
  `dev`).
- The frontend stores the token in `localStorage`, attaches it via an axios request
  interceptor, and redirects to `/login` on any 401 (see `frontend/src/api/client.ts`).

## Known limitations / hardening ideas

- **localStorage tokens** are readable by JS; an XSS bug would expose them. React escapes
  rendering by default, but a stricter approach is httpOnly refresh-token cookies with
  short-lived access tokens.
- **No refresh tokens** — users re-login when the JWT expires (24h default).
- **No rate limiting** on login/register; add a filter or an upstream limiter (e.g.
  Cloudflare) before exposing this beyond a portfolio context.
- **No email verification or password reset** — out of scope for v2.
- Swagger UI is intentionally public for demo purposes; lock it down (or disable it in
  prod) for a real product.

## OAuth2 as an alternative

Spring Security supports OAuth2 login (Google/GitHub) via
`spring-boot-starter-oauth2-client`. It was not chosen for v2 because it requires
provider console setup (client ids, redirect URIs per environment) and the JWT flow
demonstrates more of the underlying mechanics. The `SecurityFilterChain` is the single
integration point if you add it later — social login and JWT can coexist.

## Reporting

This is a personal project; if you spot a vulnerability, open a GitHub issue.
