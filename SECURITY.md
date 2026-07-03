# Security Notes

## Current state (v1)

v1 ships **without authentication** — it is a single-user portfolio app. There is no
Spring Security on the classpath, so every endpoint under `/api/v1/**` is public.
CORS is restricted to the origin configured via the `FRONTEND_ORIGIN` env var, and only
`/actuator/health` is exposed from Actuator.

## How to add Spring Security + JWT later

The code was structured so auth can be added without touching business logic:

1. **Add dependencies** to `backend/build.gradle.kts`:

   ```kotlin
   implementation("org.springframework.boot:spring-boot-starter-security")
   implementation("io.jsonwebtoken:jjwt-api:0.12.6")
   runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
   runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
   ```

2. **Add a `User` entity + Flyway migration** (`V2__users.sql`) and a `user_id` foreign key
   column on `expenses`. Because the schema is Flyway-managed, this is an additive migration —
   no Hibernate DDL surprises.

3. **Create a `SecurityConfig`** in the existing `config/` package: stateless session policy,
   permit `/actuator/health`, `/swagger-ui/**`, `/v3/api-docs/**` and the future
   `/api/v1/auth/**` endpoints, require authentication for everything else. Register a
   once-per-request JWT filter before `UsernamePasswordAuthenticationFilter`.

4. **Add an `AuthController`** (`/api/v1/auth/register`, `/api/v1/auth/login`) returning a
   signed JWT. Keep the signing key in an env var (e.g. `JWT_SECRET`) — same pattern as
   `DATABASE_URL`, never in the repo.

5. **Scope queries to the current user.** The service layer is the single place that talks to
   `ExpenseRepository`, so adding `userId` filtering means changing only
   `ExpenseServiceImpl` (read the principal from `SecurityContextHolder`) and the repository
   specifications — controllers and DTOs stay as they are, except for removing any
   client-supplied user identifiers.

6. **Frontend:** add an axios request interceptor in `src/api/client.ts` that attaches
   `Authorization: Bearer <token>`, plus a response interceptor redirecting to a login page
   on 401.

## Reporting

This is a personal project; if you spot a vulnerability, open a GitHub issue.
