# Backend API Documentation

> Generated from codebase scan (`apps/api`, `apps/notification-service`).  
> **Base URL (tenant API):** `/api/v1`  
> **Global prefix:** All v1 routes are mounted at `app.use('/api/v1', routes)` in `apps/api/src/app.ts`.  
> **Rate limiting:** `100` requests/minute on `/api/*` (`apiLimiter`).

---

## Table of Contents

1. [API Count Summary](#api-count-summary)
2. [Authentication & Headers](#authentication--headers)
3. [RBAC Permissions by Role](#rbac-permissions-by-role)
4. [Deprecated / Duplicate / Issues](#deprecated--duplicate--issues)
5. [AUTH](#category-auth)
6. [HEALTH](#category-health)
7. [MEMBERS](#category-members)
8. [TRAINERS](#category-trainers)
9. [ATTENDANCE](#category-attendance)
10. [TENANT / SETTINGS / USERS](#category-tenant--settings--users)
11. [BILLING](#category-billing)
12. [GOALS](#category-goals)
13. [SUPER ADMIN](#category-super-admin)
14. [DEBUG / ANALYTICS](#category-debug--analytics)
15. [WEBHOOKS](#category-webhooks)
16. [INFRASTRUCTURE & OTHER](#category-infrastructure--other)
17. [Notification Service](#notification-service-separate-process)

---

## API Count Summary

| Scope | Count |
|-------|------:|
| `/api/v1/*` REST endpoints | **47** |
| App-level endpoints (`/api/webhook`, `/health`, `/admin/queues`) | **3** |
| Notification service (`GET /health`) | **1** |
| **Total HTTP endpoints documented** | **51** |

---

## Authentication & Headers

### Tenant / gym users (most `/api/v1` routes)

| Header | Value | When |
|--------|--------|------|
| `Authorization` | `Bearer <accessToken>` | Required when route has `authenticate` middleware |
| `Content-Type` | `application/json` | JSON bodies |
| Cookie | `refreshToken` (httpOnly) | Set on login/register; used by token rotation & logout |

Access tokens are JWTs (15m expiry) with payload: `userId`, `tenantId`, `roleId`, `role`.

### Super admin (`/api/v1/super-admin/*` protected routes)

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <superAdminAccessToken>` |

Cookie `refreshToken` used for super-admin rotation/logout.

### Stripe webhook

| Header | Value |
|--------|--------|
| `stripe-signature` | Stripe webhook signature |
| `Content-Type` | `application/json` (raw body) |

### Standard error body

```json
{
  "success": false,
  "message": "string",
  "errorCode": "string",
  "errors": null
}
```

---

## RBAC Permissions by Role

Permissions are checked via `authorizePermissions` (not role names directly). Default seed (`apps/api/src/modules/rbac/rbac.seed.ts`):

| Role | Permissions |
|------|-------------|
| **OWNER** | All permissions |
| **ADMIN** | All except `user:update-role` |
| **STAFF** | `member:create`, `member:view`, `member:update`, `attendance:mark`, `attendance:view` |
| **TRAINER** | `member:view`, `attendance:view` |

Permission constants: `apps/api/src/modules/rbac/permissions.constants.ts`.

---

## Deprecated / Duplicate / Issues

### Deprecated (commented in code)

| Endpoint | Notes |
|----------|--------|
| `POST /api/v1/auth/signup` | Route commented out in `auth.routes.ts`; `SignupSchema` still exists |

### Duplicate / overlapping

| Endpoints | Notes |
|-----------|--------|
| `GET /health` vs `GET /api/v1/health` | Root health checks DB + Redis; v1 health checks DB only |
| `GET /api/v1/billing/plans` vs `GET /api/v1/super-admin/get-all-plans` | Tenant-facing HTML plans page vs super-admin JSON plan list |
| `POST /api/v1/tenant/users` vs `POST /api/v1/tenant/users/invite` | Both use `InviteUserSchema`; `/users` calls `createUserDirect` (expects password in service) but schema has no `password` field — **Needs manual verification** |

### Implementation notes (document accurately)

| Issue | Location |
|-------|----------|
| `POST /api/v1/auth/reset-password` has no `authenticate` but controller uses `req.user!.tenantId` | Likely **500** at runtime — **Needs manual verification** |
| `POST /api/v1/billing/checkout-session` imports `CreateCheckoutSessionSchema` but does not use `validate()`; controller reads `planId`, not `plan`/`interval` from schema | **Needs manual verification** |
| `PATCH /api/v1/tenant` uses `UpdateTenantSchema` without `{ body: ... }` wrapper | Validation may not apply as intended — **Needs manual verification** |
| `PATCH /api/v1/super-admin/update-plan/:id` / `DELETE .../delete-plan/:id` use `PlanIdSchema` without `{ params: ... }` wrapper | **Needs manual verification** |
| `GET /api/v1/goals/:memberId` has `authenticate` only (no `authorizePermissions`) | Any authenticated tenant user may call — **Needs manual verification** |
| `POST /api/v1/debug/run-analytics` | No auth middleware |

---

==================================================
## CATEGORY: AUTH
==================================================

**Module:** `apps/api/src/modules/auth`  
**Mount:** `/api/v1/auth`  
**Extra middleware:** `authLimiter` (10/min on all auth routes); `loginLimiter` (5/min on login)

---

### 1. POST /api/v1/auth/login

**Description:** Authenticate gym user; returns access token and sets refresh cookie.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "email": "string (email)",
  "password": "string (min 1)"
}
```

**Response (200):**
```json
{
  "accessToken": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string (e.g. OWNER, ADMIN, STAFF, TRAINER)",
    "isActive": true
  }
}
```
Also sets `Set-Cookie: refreshToken=...` (httpOnly, 7 days).

**Headers:** `Content-Type: application/json`

**Auth:** No

**Role:** None

**Validation:** `LoginSchema` — email required (valid email), password required

**Status Codes:**
- 200 Success
- 400 Validation failed
- 401 Invalid credentials / account disabled
- 429 Too many login attempts (`loginLimiter`)
- 500 Internal error

--------------------------------------------------

### 2. POST /api/v1/auth/register-gym

**Description:** Register a new gym (tenant) and owner user.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "gymName": "string (2-100)",
  "firstName": "string (2-50)",
  "lastName": "string (2-50)",
  "email": "string (email, lowercased)",
  "password": "string (8-128, upper, lower, number, special, no spaces)",
  "contactPhone": "string (8-15, digits/+-() )",
  "contactEmail": "string (email)",
  "address": "string (5-255)",
  "city": "string (2-100)",
  "country": "string (2-100)",
  "timezone": "string (optional, 2-100)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Gym registered successfully",
  "data": {
    "user": { "id": "uuid", "email": "string", "firstName": "string", "lastName": "string", "role": "OWNER", "...": "..." },
    "accessToken": "string",
    "tenant": { "id": "uuid", "name": "string", "slug": "string", "...": "..." }
  }
}
```
Sets `refreshToken` cookie.

**Headers:** `Content-Type: application/json`

**Auth:** No

**Role:** None

**Validation:** `RegisterGymSchema`

**Status Codes:**
- 201 Created
- 400 Validation failed
- 409 Email already registered
- 429 Auth rate limit
- 500 Internal error

--------------------------------------------------

### 3. GET /api/v1/auth/me

**Description:** Get current authenticated user profile.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer <accessToken>"
}
```

**Auth:** Yes

**Role:** Any authenticated user

**Validation:** None

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 404 User not found
- 500 Internal error

--------------------------------------------------

### 4. GET /api/v1/auth/generate-new-tokens

**Description:** Rotate access token using `refreshToken` cookie.

**Path Params:** None

**Query Params:** None

**Request:** None (uses cookie)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```
Sets new `refreshToken` cookie.

**Headers:** Cookie `refreshToken` required

**Auth:** No (cookie-based refresh)

**Role:** None

**Validation:** None

**Status Codes:**
- 200 Success
- 401 No refresh token / invalid / compromised session
- 500 Internal error

--------------------------------------------------

### 5. POST /api/v1/auth/forgot-password

**Description:** Request password reset email (always returns success message if format valid).

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "email": "string (email)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with that email, a reset link has been sent."
}
```

**Headers:** `Content-Type: application/json`

**Auth:** No

**Role:** None

**Validation:** `ForgotPasswordSchema`

**Status Codes:**
- 200 Success
- 400 Validation failed
- 429 Auth rate limit
- 500 Internal error

--------------------------------------------------

### 6. POST /api/v1/auth/reset-password

**Description:** Reset password using token from email.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "token": "string (required)",
  "password": "string (password rules)",
  "confirmPassword": "string (must match password)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Headers:** `Content-Type: application/json`

**Auth:** No (route has no `authenticate`; controller references `req.user!.tenantId` — **Needs manual verification**)

**Role:** None

**Validation:** `ResetPasswordSchema`

**Status Codes:**
- 200 Success
- 400 Invalid/expired token / validation failed
- 401/500 **Needs manual verification** (missing `req.user`)

--------------------------------------------------

### 7. POST /api/v1/auth/logout

**Description:** Invalidate refresh token and clear cookie.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Headers:**
```json
{
  "Authorization": "Bearer <accessToken>"
}
```
Cookie `refreshToken` used if present.

**Auth:** Yes

**Role:** Any authenticated user

**Validation:** None

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: HEALTH
==================================================

### 8. GET /api/v1/health

**Description:** API v1 health check (database connectivity).

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "ISO-8601 string",
  "services": {
    "database": "CONNECTED"
  }
}
```

**Response (503):**
```json
{
  "status": "ERROR",
  "message": "Database connection failed"
}
```

**Headers:** None required

**Auth:** No

**Role:** None

**Validation:** None

**Status Codes:**
- 200 OK
- 503 Service unavailable

--------------------------------------------------

==================================================
## CATEGORY: MEMBERS
==================================================

**Mount:** `/api/v1/members`

---

### 9. POST /api/v1/members

**Description:** Create a new gym member.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "email": "string (email)",
  "firstName": "string (min 2)",
  "lastName": "string (min 1)",
  "phone": "string (E.164, optional)",
  "dateOfBirth": "date string (optional)",
  "assignedTrainerId": "uuid | null (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string | null",
    "status": "ACTIVE | INACTIVE | PENDING | BANNED | DELETED",
    "createdAt": "datetime",
    "assignedTrainer": {
      "id": "uuid",
      "user": { "firstName": "string", "lastName": "string" }
    } | null
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:create` (typically OWNER, ADMIN, STAFF)

**Validation:** `CreateMemberSchema`

**Status Codes:**
- 201 Created
- 400 Validation / member limit / inactive subscription
- 401 Unauthorized
- 403 Forbidden (missing permission)
- 404 Assigned trainer not found
- 409 Member email exists
- 500 Internal error

--------------------------------------------------

### 10. GET /api/v1/members

**Description:** List members (paginated).

**Path Params:** None

**Query Params:**
```json
{
  "page": "number (default 1, min 1)",
  "limit": "number (default 10, max 50)"
}
```

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "members": [ "/* member objects */" ],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:view`

**Validation:** None (query not schema-validated)

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 11. GET /api/v1/members/:id

**Description:** Get member by ID.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string | null",
    "status": "string",
    "createdAt": "datetime",
    "assignedTrainer": { "...": "..." } | null,
    "_count": { "attendances": 0 }
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:view`

**Validation:** `MemberIdSchema` — `id` must be UUID

**Status Codes:**
- 200 Success
- 400 Invalid UUID
- 401 Unauthorized
- 403 Forbidden
- 404 Member not found
- 500 Internal error

--------------------------------------------------

### 12. PATCH /api/v1/members/:id

**Description:** Update member (partial).

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** (all fields optional)
```json
{
  "email": "string (email)",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "dateOfBirth": "date",
  "assignedTrainerId": "uuid | null"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "/* updated member */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:update`

**Validation:** `UpdateMemberSchema`

**Status Codes:**
- 200 Success
- 400 Validation failed
- 401 Unauthorized
- 403 Forbidden
- 404 Member or trainer not found
- 500 Internal error

--------------------------------------------------

### 13. DELETE /api/v1/members/:id

**Description:** Soft-delete (deactivate) member.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Member successfully deactivated (soft-deleted)"
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:delete` (OWNER, ADMIN only by default seed)

**Validation:** `MemberIdSchema`

**Status Codes:**
- 200 Success
- 400 Already deleted
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 500 Internal error

--------------------------------------------------

### 14. GET /api/v1/members/:id/attendance

**Description:** Get attendance history for a member.

**Path Params:**
```json
{
  "id": "uuid (memberId)"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "checkIn": "datetime"
    }
  ]
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `member:view`

**Validation:** `MemberIdSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Member not found
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: TRAINERS
==================================================

**Mount:** `/api/v1/trainers`  
**Note:** All routes use `router.use(authenticate)` at module level.

---

### 15. POST /api/v1/trainers

**Description:** Promote existing tenant user to trainer and create trainer profile.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "userId": "uuid",
  "specialization": "string (min 3)",
  "bio": "string (max 500, optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "/* trainer profile */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:create`

**Validation:** `CreateTrainerSchema`

**Status Codes:**
- 201 Created
- 400 User not in tenant / already trainer / trainer limit
- 401 Unauthorized
- 403 Forbidden
- 404 User not found
- 500 Internal error

--------------------------------------------------

### 16. GET /api/v1/trainers

**Description:** List trainers (paginated).

**Path Params:** None

**Query Params:**
```json
{
  "page": "number (default 1)",
  "limit": "number (default 10, max 50)"
}
```

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "trainers": [
    {
      "id": "uuid",
      "specialization": "string | null",
      "bio": "string | null",
      "createdAt": "datetime",
      "user": { "firstName": "string", "lastName": "string", "email": "string" },
      "_count": { "members": 0 }
    }
  ],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:view`

**Validation:** None

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 17. GET /api/v1/trainers/:id

**Description:** Get trainer profile by trainer ID.

**Path Params:**
```json
{
  "id": "uuid (trainer profile id)"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "specialization": "string | null",
    "bio": "string | null",
    "createdAt": "datetime",
    "userId": "uuid",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "isActive": true
    },
    "_count": { "members": 0 }
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:view`

**Validation:** `GetTrainerIDSchema`

**Status Codes:**
- 200 Success
- 400 Invalid UUID
- 401 Unauthorized
- 403 Forbidden
- 404 Trainer not found
- 500 Internal error

--------------------------------------------------

### 18. PATCH /api/v1/trainers/:id

**Description:** Update trainer profile.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:**
```json
{
  "specialization": "string (optional)",
  "bio": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "/* updated trainer */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:update`

**Validation:** `UpdateTrainerSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 500 Internal error

--------------------------------------------------

### 19. DELETE /api/v1/trainers/:id

**Description:** Delete trainer profile and revert user role to STAFF.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Trainer profile deleted and role reverted."
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:delete`

**Validation:** `GetTrainerIDSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 500 Internal error

--------------------------------------------------

### 20. GET /api/v1/trainers/:id/members

**Description:** List members assigned to a trainer.

**Path Params:**
```json
{
  "id": "uuid (trainer id)"
}
```

**Query Params:**
```json
{
  "page": "number (default 1)",
  "limit": "number (default 10, max 50)"
}
```

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "members": [ "/* member summaries */" ],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `trainer:view`

**Validation:** `GetTrainerIDSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Trainer not found
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: ATTENDANCE
==================================================

**Mount:** `/api/v1/attendance`

---

### 21. POST /api/v1/attendance

**Description:** Mark member check-in for today.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "memberId": "uuid",
  "deviceInfo": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "checkIn": "datetime",
    "date": "date",
    "deviceInfo": "string | null",
    "member": {
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    }
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `attendance:mark`

**Validation:** `MarkAttendanceSchema`

**Status Codes:**
- 201 Created
- 400 Inactive member / already checked in today
- 401 Unauthorized
- 403 Forbidden
- 404 Member not found
- 500 Internal error

--------------------------------------------------

### 22. GET /api/v1/attendance/today

**Description:** List today's attendance for the tenant.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "checkIn": "datetime",
      "checkOut": "datetime | null",
      "member": { "firstName": "string", "lastName": "string", "status": "string" }
    }
  ]
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `attendance:view`

**Validation:** None

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 23. GET /api/v1/attendance/history

**Description:** Get attendance records for a specific date.

**Path Params:** None

**Query Params:**
```json
{
  "date": "string (YYYY-MM-DD, required)"
}
```

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [ "/* same shape as today */" ]
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `attendance:view`

**Validation:** `GetAttendanceByDateSchema`

**Status Codes:**
- 200 Success
- 400 Invalid date format
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 24. GET /api/v1/attendance/stats/:id

**Description:** Attendance statistics for a member.

**Path Params:**
```json
{
  "id": "uuid (memberId)"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalVisits": 0,
    "lastVisit": "string | null (IST formatted)"
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `attendance:view`

**Validation:** `MemberStatsSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Member not found
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: TENANT / SETTINGS / USERS
==================================================

**Mount:** `/api/v1/tenant`

---

### 25. GET /api/v1/tenant

**Description:** Get current gym (tenant) details.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "isActive": true,
    "address": "string",
    "city": "string",
    "country": "string",
    "contactEmail": "string",
    "contactPhone": "string",
    "timezone": "string",
    "logoUrl": "string | null",
    "stripeCustomerId": "string | null",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `tenant:view`

**Validation:** None

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Tenant not found
- 500 Internal error

--------------------------------------------------

### 26. PATCH /api/v1/tenant

**Description:** Update gym settings.

**Path Params:** None

**Query Params:** None

**Request:** (all optional)
```json
{
  "name": "string (min 2)",
  "contactPhone": "string",
  "contactEmail": "string (email)",
  "address": "string",
  "city": "string",
  "country": "string",
  "isActive": "boolean"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Gym details updated successfully",
  "data": { "/* tenant */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `tenant:update`

**Validation:** `UpdateTenantSchema` (schema shape may not match validator — **Needs manual verification**)

**Status Codes:**
- 200 Success
- 400 Validation failed
- 401 Unauthorized
- 403 Forbidden
- 404 Gym not found
- 500 Internal error

--------------------------------------------------

### 27. POST /api/v1/tenant/logo

**Description:** Upload gym logo to S3.

**Path Params:** None

**Query Params:** None

**Request:** `multipart/form-data` with field `logo` (file)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logoUrl": "string (https://...)"
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Auth:** Yes

**Role / Permission:** `tenant:update`

**Validation:** File — PNG/JPEG/WEBP, max 2MB (`uploadLogo` middleware)

**Status Codes:**
- 200 Success
- 400 Missing file / invalid file type
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 28. POST /api/v1/tenant/users/invite

**Description:** Invite a user to the gym by email.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "email": "string (email)",
  "firstName": "string (min 2)",
  "lastName": "string (min 2)",
  "role": "ADMIN | STAFF"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invite sent successfully",
  "data": {
    "email": "string"
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `tenant:update` (ADMIN cannot invite another ADMIN per service logic)

**Validation:** `InviteUserSchema`

**Status Codes:**
- 200 Success
- 400 User exists / ADMIN cannot create ADMIN
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 29. POST /api/v1/tenant/users/accept-invite

**Description:** Accept invite and set password (creates/links user to tenant).

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "token": "string (min 10)",
  "password": "string (password rules)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "userId": "uuid"
  }
}
```

**Headers:** `Authorization: Bearer <token>` (route requires auth + `tenant:update` — unusual for public invite flow — **Needs manual verification**)

**Auth:** Yes (per route)

**Role / Permission:** `tenant:update`

**Validation:** `AcceptInviteSchema`

**Status Codes:**
- 200 Success
- 400 Invalid/expired token / user already in tenant
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 30. POST /api/v1/tenant/users

**Description:** Create tenant user directly (with password).

**Path Params:** None

**Query Params:** None

**Request:** Uses `InviteUserSchema` in route (no `password` in schema; service expects `password` — **Needs manual verification**)
```json
{
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "ADMIN | STAFF"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "/* user/tenant link */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `tenant:update`

**Validation:** `InviteUserSchema` (mismatch with `directCreateUserSchema` in codebase)

**Status Codes:**
- 201 Created
- 400 Validation / user exists
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 31. PATCH /api/v1/tenant/upgrade-plan

**Description:** Upgrade tenant subscription plan (internal plan change).

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "planName": "BASIC | PRO",
  "interval": "MONTHLY | YEARLY"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "/* subscription update result */" }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `tenant:update`

**Validation:** `upgradePlanSchema`

**Status Codes:**
- 200 Success
- 400 Validation failed
- 401 Unauthorized
- 403 Forbidden
- 500 Plan not found / member-trainer limits exceeded

--------------------------------------------------

==================================================
## CATEGORY: BILLING
==================================================

**Mount:** `/api/v1/billing`

---

### 32. POST /api/v1/billing/checkout-session

**Description:** Create Stripe Checkout session URL for subscription.

**Path Params:** None

**Query Params:** None

**Request:** Controller reads `planId` from body (schema not applied on route):
```json
{
  "planId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "string (Stripe checkout URL)"
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role:** Any authenticated user (no permission middleware)

**Validation:** `CreateCheckoutSessionSchema` exists but is **not** wired — **Needs manual verification**

**Status Codes:**
- 200 Success
- 400 Tenant/plan/stripe configuration errors
- 401 Unauthorized
- 500 Internal error

--------------------------------------------------

### 33. GET /api/v1/billing/plans

**Description:** Render HTML page listing subscription plans (Handlebars view).

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):** HTML (`billing/plans` view), not JSON

**Headers:** None required

**Auth:** No

**Role:** None

**Validation:** None

**Status Codes:**
- 200 Success
- 500 Internal error

--------------------------------------------------

### 34. GET /api/v1/billing/success

**Description:** Stripe checkout success page (HTML).

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):** HTML (`billing/success`)

**Headers:** None

**Auth:** No

**Role:** None

**Status Codes:** 200

--------------------------------------------------

### 35. GET /api/v1/billing/cancel

**Description:** Stripe checkout cancel page (HTML).

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):** HTML (`billing/cancel`)

**Headers:** None

**Auth:** No

**Role:** None

**Status Codes:** 200

--------------------------------------------------

==================================================
## CATEGORY: GOALS
==================================================

**Mount:** `/api/v1/goals`

---

### 36. POST /api/v1/goals/:memberId

**Description:** Create a fitness goal for a member (deactivates previous active goals).

**Path Params:**
```json
{
  "memberId": "uuid"
}
```

**Query Params:** None

**Request:**
```json
{
  "goalType": "GAIN | LOSS",
  "currentWeight": "number (positive)",
  "targetWeight": "number (positive)",
  "durationWeeks": "integer (1-52)",
  "height": "number (positive)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "memberId": "uuid",
    "tenantId": "uuid",
    "goalType": "GAIN | LOSS",
    "currentWeight": 0,
    "targetWeight": 0,
    "durationWeeks": 0,
    "height": 0,
    "isActive": true,
    "createdAt": "datetime"
  }
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** `goal:create` (OWNER, ADMIN by default — not in STAFF/TRAINER seed)

**Validation:** `CreateGoalSchema` + service rules (weight direction, max weekly change)

**Status Codes:**
- 201 Created
- 400 Validation / unrealistic weekly change
- 401 Unauthorized
- 403 Forbidden
- 404 Member not found
- 500 Internal error

--------------------------------------------------

### 37. GET /api/v1/goals/:memberId

**Description:** List all goals for a member.

**Path Params:**
```json
{
  "memberId": "uuid"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [ "/* MemberGoal[] */" ]
}
```

**Headers:** `Authorization: Bearer <token>`

**Auth:** Yes

**Role / Permission:** None on route (only `authenticate`) — **Needs manual verification**

**Validation:** `MemberGoalParamSchema`

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: SUPER ADMIN
==================================================

**Mount:** `/api/v1/super-admin`

---

### 38. POST /api/v1/super-admin/setup

**Description:** Create initial super admin (only when none exist).

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "firstName": "string (2-50)",
  "lastName": "string (2-50)",
  "email": "string (email)",
  "password": "string (password rules)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "data": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "message": "Initial super admin created successfully..."
  }
}
```

**Headers:** `Content-Type: application/json`

**Auth:** No

**Role:** None

**Validation:** `superAdminCreationSchema`

**Status Codes:**
- 201 Created
- 400 Super admin already exists / validation failed
- 500 Internal error

--------------------------------------------------

### 39. POST /api/v1/super-admin/login

**Description:** Super admin login.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "email": "string (email)",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "superAdmin": {
      "id": "uuid",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "SUPER_ADMIN"
    }
  }
}
```
Sets `refreshToken` cookie.

**Headers:** `Content-Type: application/json`

**Auth:** No

**Role:** None

**Validation:** `superAdminLoginSchema`

**Status Codes:**
- 200 Success
- 400 Email/password required (controller guard)
- 401 Invalid credentials
- 500 Internal error

--------------------------------------------------

### 40. GET /api/v1/super-admin/rotate-refresh-token

**Description:** Rotate super admin access token via cookie.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

**Headers:** Cookie `refreshToken`

**Auth:** No (cookie-based)

**Role:** None

**Status Codes:**
- 200 Success
- 401 No/invalid refresh token
- 500 Internal error

--------------------------------------------------

### 41. POST /api/v1/super-admin/logout

**Description:** Super admin logout.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Headers:** `Authorization: Bearer <superAdminAccessToken>`

**Auth:** Yes (`authenticateSuperAdmin` + `requireSuperAdmin`)

**Role:** SUPER_ADMIN

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 42. GET /api/v1/super-admin/get-all-owners-with-gyms

**Description:** Paginated list of gym owners and their gyms (platform admin).

**Path Params:** None

**Query Params:**
```json
{
  "page": "number (default 1)",
  "limit": "number (default 10, max 50)"
}
```

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [ "/* owners with gyms */" ],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

**Headers:** `Authorization: Bearer <superAdminAccessToken>`

**Auth:** Yes

**Role:** SUPER_ADMIN

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 43. POST /api/v1/super-admin/create-plan

**Description:** Create a subscription plan.

**Path Params:** None

**Query Params:** None

**Request:**
```json
{
  "name": "FREE | BASIC | PRO",
  "price": "number (min 0)",
  "currency": "string",
  "interval": "MONTHLY | YEARLY",
  "stripePriceId": "string (optional)",
  "features": { "key": "any" }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "/* Plan */" }
}
```

**Headers:** `Authorization: Bearer <superAdminAccessToken>`

**Auth:** Yes

**Role:** SUPER_ADMIN

**Validation:** `CreatePlanSchema`

**Status Codes:**
- 201 Created
- 400 Validation failed
- 401 Unauthorized
- 403 Forbidden
- 500 Internal error

--------------------------------------------------

### 44. GET /api/v1/super-admin/get-all-plans

**Description:** List all plans (JSON).

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "FREE | BASIC | PRO",
      "price": 0,
      "currency": "string",
      "interval": "MONTHLY | YEARLY",
      "stripePriceId": "string | null",
      "features": {},
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

**Headers:** None required (no auth middleware on route)

**Auth:** No

**Role:** None

**Status Codes:**
- 200 Success
- 500 Internal error

--------------------------------------------------

### 45. PATCH /api/v1/super-admin/update-plan/:id

**Description:** Update plan by ID.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** Partial plan fields (same as create)

**Response (200):**
```json
{
  "success": true,
  "data": { "/* Plan */" }
}
```

**Headers:** `Authorization: Bearer <superAdminAccessToken>`

**Auth:** Yes

**Role:** SUPER_ADMIN

**Validation:** `UpdatePlanSchema` — **Needs manual verification** (`PlanIdSchema` params shape)

**Status Codes:**
- 200 Success
- 400 Validation failed
- 401 Unauthorized
- 403 Forbidden
- 404 Plan not found
- 500 Internal error

--------------------------------------------------

### 46. DELETE /api/v1/super-admin/delete-plan/:id

**Description:** Delete plan by ID.

**Path Params:**
```json
{
  "id": "uuid"
}
```

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

**Headers:** `Authorization: Bearer <superAdminAccessToken>`

**Auth:** Yes

**Role:** SUPER_ADMIN

**Validation:** `PlanIdSchema` — **Needs manual verification**

**Status Codes:**
- 200 Success
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 500 Internal error

--------------------------------------------------

==================================================
## CATEGORY: DEBUG / ANALYTICS
==================================================

**Mount:** `/api/v1/debug`

---

### 47. POST /api/v1/debug/run-analytics

**Description:** Manually enqueue daily analytics job for yesterday.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Analytics job enqueued"
}
```

**Headers:** None

**Auth:** No

**Role:** None

**Validation:** None

**Status Codes:**
- 200 Success
- 500 Internal error

**Note:** No authentication — use only in development/secured environments.

--------------------------------------------------

==================================================
## CATEGORY: WEBHOOKS
==================================================

---

### 48. POST /api/webhook

**Description:** Stripe webhook receiver (raw body). Verifies signature and enqueues event for async processing.

**Path Params:** None

**Query Params:** None

**Request:** Raw Stripe event JSON body

**Response (200):**
```json
{
  "received": true
}
```

**Headers:**
```json
{
  "stripe-signature": "<signature>",
  "Content-Type": "application/json"
}
```

**Auth:** No (Stripe signature verification)

**Role:** None

**Validation:** Stripe `constructEvent` with `STRIPE_WEBHOOK_SECRET`

**Status Codes:**
- 200 Event enqueued
- 400 Missing/invalid signature
- 500 Handler failure

--------------------------------------------------

==================================================
## CATEGORY: INFRASTRUCTURE & OTHER
==================================================

---

### 49. GET /health

**Description:** Root service health (API process): DB + Redis connectivity.

**Path Params:** None

**Query Params:** None

**Request:** None

**Response (200):**
```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "ISO-8601",
  "uptime": 0,
  "dependencies": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**Response (503):** `status: "degraded"` if DB or Redis down

**Headers:** None

**Auth:** No

**Role:** None

**Status Codes:** 200, 503

--------------------------------------------------

### 50. GET /admin/queues

**Description:** Bull Board UI for job queue monitoring (email queue). Not a JSON REST API.

**Path Params:** Bull Board sub-routes under `/admin/queues`

**Auth:** No middleware in code — **Needs manual verification** (should be protected in production)

**Status Codes:** 200 (HTML UI)

--------------------------------------------------

## Notification Service (separate process)

**App:** `apps/notification-service` — BullMQ workers, not Express REST API for business logic.

### 51. GET /health

**Description:** Health check for notification-service (separate port via `HEALTH_PORT`).

**Response (200):**
```json
{
  "status": "ok",
  "service": "notification-service"
}
```

**Auth:** No

**Status Codes:** 200, 404 for other paths

---

## Prisma models without HTTP routes

The following models exist in `schema.prisma` but have **no** registered HTTP endpoints in this codebase:

- `WorkoutPlan`, `WorkoutDay`, `WorkoutExercise`
- `DietLog`, `DietLogItem`, `FoodMaster`
- `WorkoutLog`, `WeightLog`
- `AttendanceDailyStats` (populated via background analytics job)

---

## Source files reference

| Area | Primary files |
|------|----------------|
| Route mounting | `apps/api/src/app.ts`, `apps/api/src/routes/v1/index.ts` |
| Auth | `apps/api/src/modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.schema.ts` |
| Members | `apps/api/src/modules/members/member.routes.ts` |
| Trainers | `apps/api/src/modules/trainers/trainer.routes.ts` |
| Attendance | `apps/api/src/modules/attendance/attendance.routes.ts` |
| Tenant | `apps/api/src/modules/tenant/tenant.route.ts` |
| Billing | `apps/api/src/modules/billing/billing.routes.ts` |
| Goals | `apps/api/src/modules/features/goals/goal.routes.ts` |
| Super Admin | `apps/api/src/modules/superAdmin/super-admin.routes.ts` |
| RBAC | `apps/api/src/modules/rbac/permissions.constants.ts`, `rbac.seed.ts` |
| Middleware | `apps/api/src/middlewares/auth.middleware.ts`, `permission.middleware.ts`, `validate.middleware.ts` |

---

*Document generated from static codebase analysis. Verify flagged endpoints against a running server before production use.*
