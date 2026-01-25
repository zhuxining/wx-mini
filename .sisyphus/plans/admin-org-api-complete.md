# Complete Admin & Organization API Implementation

## Context

### Original Request

User wants to implement comprehensive admin and organization API interfaces in their org-sass codebase using Better-Auth's Admin and Organization plugins. The goal is to expose ALL methods provided by these plugins through oRPC endpoints.

### Interview Summary

**Key Discussions**:

- Router Organization: Separate routers (admin.ts + organization.ts)
- Permission Checking: Inline checks in each route handler (not dedicated middleware)
- Error Handling: oRPC standard errors (ORPCError)

**Research Findings**:

- Better-Auth Admin plugin provides 15 methods
- Better-Auth Organization plugin provides 28+ methods
- All methods documented with parameters, return types, and behavior
- Database schema already includes all necessary fields (role, banned, organization tables)

---

## Work Objectives

### Core Objective

Create complete oRPC API coverage for ALL Better-Auth Admin and Organization plugin methods, organized into two separate routers following existing codebase patterns.

### Concrete Deliverables

- `packages/api/src/routers/admin.ts` - 15 admin endpoints
- `packages/api/src/routers/organization.ts` - 28+ organization endpoints
- `packages/api/src/index.ts` - Updated with admin-specific middleware helper
- Updated router exports in `packages/api/src/routers/index.ts`

### Definition of Done

- [ ] All 15 admin methods implemented as oRPC endpoints
- [ ] All 28+ organization methods implemented as oRPC endpoints
- [ ] Inline permission checking for admin-only operations
- [ ] Zod validation for all inputs
- [ ] Manual verification: curl tests pass for sample endpoints
- [ ] Type exports work correctly in client code
- [ ] `bun run check` passes (Biome formatting)
- [ ] `bun run check-types` passes (TypeScript compilation)

### Must Have

- Complete method coverage (no methods left out)
- Type-safe inputs with Zod schemas
- Proper error handling using ORPCError
- Inline admin permission checks where needed
- Follow existing oRPC patterns (publicProcedure, protectedProcedure)

### Must NOT Have (Guardrails)

- Do NOT create custom middleware beyond what exists
- Do NOT add custom business logic beyond Better-Auth capabilities
- Do NOT implement frontend components or UI
- Do NOT add database migrations (schema already exists)
- Do NOT create separate permission abstraction layers
- Do NOT skip any documented Better-Auth methods

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: none
- **QA approach**: Manual verification with curl

### Manual QA Procedures

**Each endpoint will be verified using**:

1. **API Testing** - curl/httpie requests
2. **Response Validation** - Verify JSON response structure
3. **Type Checking** - Verify TypeScript compilation
4. **Permission Testing** - Verify admin checks work

**Evidence Required**:

- Command output showing successful requests
- Response bodies showing correct data structure
- TypeScript compilation passing
- Biome formatting passing

---

## Task Flow

```
Task 0 (Setup)
  ↓
Task 1 (Admin Router) ←→ Task 2 (Org Router)  [Parallel]
  ↓
Task 3 (Export & Types)
  ↓
Task 4 (Verification)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | Independent router files, no dependencies |

| Task | Depends On | Reason |
|------|------------|--------|
| 0 | None | Setup task |
| 1 | 0 | Needs helper from Task 0 |
| 2 | 0 | Needs helper from Task 0 |
| 3 | 1, 2 | Must export completed routers |
| 4 | 3 | Must verify complete system |

---

## TODOs

- [ ] 0. Create admin permission helper in base API

  **What to do**:
  - Add `requireAdmin` helper function to `packages/api/src/index.ts`
  - Helper checks if `context.session.user.role` includes "admin"
  - Throws `ORPCError("FORBIDDEN")` if not admin
  - Export helper for use in router files
  - Keep existing `publicProcedure` and `protectedProcedure` unchanged

  **Must NOT do**:
  - Do NOT create middleware (use helper function instead)
  - Do NOT modify existing procedures
  - Do NOT add complex permission logic beyond admin check

  **Parallelizable**: NO (base dependency for all other tasks)

  **Pattern References**:
  - `packages/api/src/index.ts:9-18` - Existing requireAuth middleware pattern
  - `packages/api/src/context.ts:4-6` - How session is extracted

  **Acceptance Criteria**:
  
  **Manual Execution Verification**:
  - [ ] Helper function added to index.ts exports
  - [ ] TypeScript compiles: `bun run check-types` → no errors
  - [ ] Code formatted: `bun run check` → no changes needed

  **Commit**: YES
  - Message: `feat(api): add requireAdmin helper for inline permission checks`
  - Files: `packages/api/src/index.ts`
  - Pre-commit: `bun run check-types`

---

- [ ] 1. Implement complete Admin router

  **What to do**:
  - Create `packages/api/src/routers/admin.ts`
  - Implement ALL 15 admin methods as oRPC endpoints:
    1. `createUser` - body: { email, password, name, role?, data? }
    2. `listUsers` - query: { searchValue?, searchField?, searchOperator?, limit?, offset?, sortBy?, sortDirection?, filterField?, filterValue?, filterOperator? }
    3. `updateUser` - body: { userId, data }
    4. `removeUser` - body: { userId }
    5. `setUserPassword` - body: { userId, newPassword }
    6. `setRole` - body: { userId, role }
    7. `banUser` - body: { userId, banReason?, banExpiresIn? }
    8. `unbanUser` - body: { userId }
    9. `listUserSessions` - body: { userId }
    10. `revokeUserSession` - body: { sessionToken }
    11. `revokeUserSessions` - body: { userId }
    12. `impersonateUser` - body: { userId }
    13. `stopImpersonating` - body: {}
    14. `hasPermission` - body: { userId?, role?, permission? }
    15. `checkRolePermission` - Client-side only (skip server implementation)
  - All endpoints use `protectedProcedure`
  - All endpoints call `requireAdmin(context)` inline at start
  - All endpoints use Zod `.input()` for validation
  - All endpoints call `auth.api.[method]` from Better-Auth
  - Use proper error wrapping with try-catch → `ORPCError`
  - Export as `adminRouter` object

  **Must NOT do**:
  - Do NOT add custom business logic beyond Better-Auth
  - Do NOT create custom validation beyond input types
  - Do NOT skip any of the 15 methods
  - Do NOT implement checkRolePermission (client-side only)

  **Parallelizable**: YES (with Task 2)

  **References**:
  
  **Better-Auth API Patterns**:
  - All methods accessible via `auth.api.[methodName]` from `@org-sass/auth`
  - Methods accept `{ body, headers, query }` object format
  - Session cookies passed via `headers: req.headers` from context

  **oRPC Pattern References**:
  - `packages/api/src/routers/index.ts:6-8` - publicProcedure.handler pattern
  - `packages/api/src/routers/index.ts:9-14` - protectedProcedure.handler with context
  - `packages/api/src/index.ts:9-18` - Middleware pattern for auth check
  - `packages/api/src/context.ts:1-12` - How to access auth and session

  **Input Validation Pattern** (use Zod):

  ```typescript
  import { z } from "zod";
  
  createUser: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
      role: z.string().optional(),
      data: z.record(z.any()).optional()
    }))
    .handler(async ({ input, context }) => {
      requireAdmin(context);
      // ... Better-Auth call
    })
  ```

  **Better-Auth Method Call Pattern**:

  ```typescript
  import { auth } from "@org-sass/auth";
  
  const result = await auth.api.createUser({
    body: input,
    headers: context.req.headers
  });
  ```

  **Error Handling Pattern**:

  ```typescript
  import { ORPCError } from "@orpc/server";
  
  try {
    const result = await auth.api.someMethod({ body: input });
    return result;
  } catch (error) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", error.message);
  }
  ```

  **Acceptance Criteria**:
  
  **Manual Execution Verification - API Testing**:
  
  Test each endpoint type (representative samples):
  
  - [ ] **createUser** test:

    ```bash
    # 1. Login as admin first to get session cookie
    curl -X POST http://localhost:3001/api/auth/sign-in/email \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@example.com","password":"admin-password"}' \
      -c cookies.txt
    
    # 2. Call createUser endpoint
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
    
    # Expected: 200 OK with user object { id, email, name, role }
    ```
  
  - [ ] **listUsers** test with pagination:

    ```bash
    curl -X GET 'http://localhost:3001/api/rpc/admin/listUsers?limit=10&offset=0' \
      -H "Content-Type: application/json" \
      -b cookies.txt
    
    # Expected: 200 OK with { users: [...], total: number, limit: 10, offset: 0 }
    ```
  
  - [ ] **banUser** test:

    ```bash
    curl -X POST http://localhost:3001/api/rpc/admin/banUser \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"userId":"<user-id>","banReason":"Test ban","banExpiresIn":3600}'
    
    # Expected: 200 OK with success message
    ```
  
  - [ ] **Non-admin rejection** test:

    ```bash
    # 1. Login as regular user
    curl -X POST http://localhost:3001/api/auth/sign-in/email \
      -H "Content-Type: application/json" \
      -d '{"email":"user@example.com","password":"user-password"}' \
      -c cookies-user.txt
    
    # 2. Try to call admin endpoint
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -b cookies-user.txt \
      -d '{"email":"test@example.com","password":"test123","name":"Test"}'
    
    # Expected: 403 FORBIDDEN error
    ```
  
  - [ ] TypeScript compiles: `bun run check-types` → no errors in admin.ts
  - [ ] Code formatted: `bun run check` → no changes needed

  **Commit**: YES
  - Message: `feat(api): implement complete admin router with 15 endpoints`
  - Files: `packages/api/src/routers/admin.ts`
  - Pre-commit: `bun run check-types && bun run check`

---

- [ ] 2. Implement complete Organization router

  **What to do**:
  - Create `packages/api/src/routers/organization.ts`
  - Implement ALL 28 organization methods as oRPC endpoints:

    **Organization Management (6 methods)**:
    1. `createOrganization` - body: { name, slug, logo?, metadata?, userId?, keepCurrentActiveOrganization? }
    2. `listOrganizations` - body: {} (no params)
    3. `getFullOrganization` - query: { organizationId?, organizationSlug?, membersLimit? }
    4. `updateOrganization` - body: { data, name?, slug?, logo?, metadata? }
    5. `deleteOrganization` - body: { organizationId }
    6. `setActiveOrganization` - body: { organizationId?, organizationSlug? }

    **Member Management (5 methods)**:
    7. `addMember` - body: { userId?, role, organizationId?, teamId? }
    8. `removeMember` - body: { memberIdOrEmail, organizationId? }
    9. `listMembers` - query: { organizationId?, limit?, offset?, sortBy?, sortDirection?, filterField?, filterOperator?, filterValue? }
    10. `updateMemberRole` - body: { memberId, role, organizationId? }
    11. `getActiveMember` - body: {} (no params)

    **Invitation Management (6 methods)**:
    12. `inviteMember` - body: { email, role, organizationId?, resend?, teamId? }
    13. `acceptInvitation` - body: { invitationId }
    14. `rejectInvitation` - body: { invitationId }
    15. `cancelInvitation` - body: { invitationId }
    16. `getInvitation` - query: { id }
    17. `listInvitations` - query: { organizationId? }

    **Team Management (6 methods)**:
    18. `createTeam` - body: { name, organizationId? }
    19. `updateTeam` - body: { teamId, name, organizationId? }
    20. `removeTeam` - body: { teamId, organizationId? }
    21. `listTeams` - query: { organizationId? }
    22. `addTeamMember` - body: { teamId, userId }
    23. `removeTeamMember` - body: { teamId, userId }

    **Role & Permission Management (5 methods)**:
    24. `createRole` - body: { role, permission?, organizationId? }
    25. `updateRole` - body: { roleName?, roleId?, organizationId?, data, permission? }
    26. `deleteRole` - body: { roleName?, roleId?, organizationId? }
    27. `listRoles` - query: { organizationId? }
    28. `hasPermission` - body: { permission, organizationId? }
  
  - All endpoints use `protectedProcedure` (no requireAdmin - org permissions handled by Better-Auth)
  - All endpoints use Zod `.input()` for validation
  - All endpoints call `auth.api.[method]` from Better-Auth
  - Use proper error wrapping with try-catch → `ORPCError`
  - Export as `organizationRouter` object

  **Must NOT do**:
  - Do NOT add requireAdmin checks (organization has its own RBAC)
  - Do NOT add custom business logic beyond Better-Auth
  - Do NOT skip any of the 28 methods
  - Do NOT create custom permission logic

  **Parallelizable**: YES (with Task 1)

  **References**:
  
  **Better-Auth Organization API Patterns**:
  - All methods accessible via `auth.api.[methodName]` from `@org-sass/auth`
  - Methods accept `{ body, headers, query }` object format
  - Better-Auth handles organization permissions internally (no requireAdmin needed)
  - Session cookies passed via `headers: req.headers` from context

  **oRPC Pattern References**:
  - `packages/api/src/routers/index.ts:9-14` - protectedProcedure.handler with context
  - `packages/api/src/index.ts:9-18` - Middleware pattern for auth check
  - `packages/api/src/context.ts:1-12` - How to access auth and session

  **Input Validation Pattern** (use Zod):

  ```typescript
  import { z } from "zod";
  
  createOrganization: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      logo: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      userId: z.string().optional(),
      keepCurrentActiveOrganization: z.boolean().optional()
    }))
    .handler(async ({ input, context }) => {
      // No requireAdmin - Better-Auth handles org permissions
      const result = await auth.api.createOrganization({
        body: input,
        headers: context.req.headers
      });
      return result;
    })
  ```

  **Better-Auth Method Call Pattern**:

  ```typescript
  import { auth } from "@org-sass/auth";
  
  const result = await auth.api.createOrganization({
    body: input,
    headers: context.req.headers
  });
  ```

  **Query Parameters Pattern** (for GET endpoints):

  ```typescript
  listMembers: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }))
    .handler(async ({ input, context }) => {
      const result = await auth.api.listMembers({
        query: input,  // Use query instead of body
        headers: context.req.headers
      });
      return result;
    })
  ```

  **Acceptance Criteria**:
  
  **Manual Execution Verification - API Testing**:
  
  Test each endpoint category (representative samples):
  
  - [ ] **createOrganization** test:

    ```bash
    # 1. Login as authenticated user
    curl -X POST http://localhost:3001/api/auth/sign-in/email \
      -H "Content-Type: application/json" \
      -d '{"email":"user@example.com","password":"password"}' \
      -c cookies.txt
    
    # 2. Create organization
    curl -X POST http://localhost:3001/api/rpc/organization/createOrganization \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"name":"Test Org","slug":"test-org","metadata":{"plan":"free"}}'
    
    # Expected: 200 OK with org object { id, name, slug, logo, metadata, createdAt }
    ```
  
  - [ ] **listOrganizations** test:

    ```bash
    curl -X GET http://localhost:3001/api/rpc/organization/listOrganizations \
      -H "Content-Type: application/json" \
      -b cookies.txt
    
    # Expected: 200 OK with array of organization objects
    ```
  
  - [ ] **addMember** test:

    ```bash
    curl -X POST http://localhost:3001/api/rpc/organization/addMember \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"userId":"<user-id>","role":"member","organizationId":"<org-id>"}'
    
    # Expected: 200 OK with member object
    ```
  
  - [ ] **createTeam** test:

    ```bash
    curl -X POST http://localhost:3001/api/rpc/organization/createTeam \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"name":"Engineering Team","organizationId":"<org-id>"}'
    
    # Expected: 200 OK with team object { id, name, organizationId, createdAt }
    ```
  
  - [ ] **inviteMember** test:

    ```bash
    curl -X POST http://localhost:3001/api/rpc/organization/inviteMember \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"email":"newuser@example.com","role":"member","organizationId":"<org-id>"}'
    
    # Expected: 200 OK with invitation object
    ```
  
  - [ ] **createRole** test:

    ```bash
    curl -X POST http://localhost:3001/api/rpc/organization/createRole \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"role":"project-manager","organizationId":"<org-id>","permission":{"project":["create","update"]}}'
    
    # Expected: 200 OK with role object
    ```
  
  - [ ] TypeScript compiles: `bun run check-types` → no errors in organization.ts
  - [ ] Code formatted: `bun run check` → no changes needed

  **Commit**: YES
  - Message: `feat(api): implement complete organization router with 28 endpoints`
  - Files: `packages/api/src/routers/organization.ts`
  - Pre-commit: `bun run check-types && bun run check`

---

- [ ] 3. Update exports and type definitions

  **What to do**:
  - Update `packages/api/src/routers/index.ts`:
    - Import `adminRouter` from `./admin`
    - Import `organizationRouter` from `./organization`
    - Add to `appRouter` object
    - Update `AppRouter` and `AppRouterClient` types
  - Verify type exports work correctly for client usage

  **Must NOT do**:
  - Do NOT change existing router structure
  - Do NOT modify healthCheck or privateData routes

  **Parallelizable**: NO (depends on Tasks 1 and 2)

  **References**:
  
  **Current Router Pattern**:
  - `packages/api/src/routers/index.ts:1-17` - Current appRouter structure and exports

  **Expected Final Structure**:

  ```typescript
  import { adminRouter } from "./admin";
  import { organizationRouter } from "./organization";
  import { protectedProcedure, publicProcedure } from "../index";
  
  export const appRouter = {
    healthCheck: publicProcedure.handler(() => "OK"),
    privateData: protectedProcedure.handler(({ context }) => ({
      message: "This is private",
      user: context.session?.user,
    })),
    admin: adminRouter,
    organization: organizationRouter,
  };
  
  export type AppRouter = typeof appRouter;
  export type AppRouterClient = RouterClient<typeof appRouter>;
  ```

  **Acceptance Criteria**:
  
  **Manual Execution Verification**:
  - [ ] TypeScript compiles: `bun run check-types` → no errors
  - [ ] Code formatted: `bun run check` → no changes needed
  - [ ] Type exports verified:

    ```bash
    # Navigate to web app
    cd apps/web
    
    # Check that types are available in TypeScript
    # Create temporary test file: test-types.ts
    cat > test-types.ts << 'EOF'
    import type { AppRouter } from "@org-sass/api/routers";
    
    // Test that new routes exist in types
    type AdminRouter = AppRouter["admin"];
    type OrgRouter = AppRouter["organization"];
    
    // This should compile without errors
    EOF
    
    # Compile the test
    bun run check-types
    
    # Clean up
    rm test-types.ts
    
    # Expected: TypeScript compilation succeeds, types are accessible
    ```

  - [ ] Router structure verified:

    ```bash
    # Verify the router exports contain admin and organization
    cat packages/api/src/routers/index.ts | grep -A 5 "export const appRouter"
    
    # Expected: Shows admin and organization in appRouter object
    ```

  **Commit**: YES
  - Message: `feat(api): export admin and organization routers in main app router`
  - Files: `packages/api/src/routers/index.ts`
  - Pre-commit: `bun run check-types`

---

- [ ] 4. End-to-end verification and documentation

  **What to do**:
  - Test complete workflow with multiple endpoints
  - Verify error handling works correctly
  - Verify type safety in potential client usage
  - Document any caveats or important notes
  - Run full project build to ensure no breaking changes

  **Must NOT do**:
  - Do NOT implement frontend
  - Do NOT add database seeds
  - Do NOT modify auth configuration

  **Parallelizable**: NO (depends on Task 3)

  **References**:
  
  **Build Commands**:
  - `package.json:38-49` - Available scripts for building and checking

  **Acceptance Criteria**:
  
  **Manual Execution Verification - E2E Workflow**:
  
  - [ ] **Admin workflow** test:

    ```bash
    # 1. Admin creates user
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -b cookies-admin.txt \
      -d '{"email":"workflow@test.com","password":"test123","name":"Workflow Test"}'
    
    # Save user ID from response
    
    # 2. Admin sets role
    curl -X POST http://localhost:3001/api/rpc/admin/setRole \
      -H "Content-Type: application/json" \
      -b cookies-admin.txt \
      -d '{"userId":"<user-id>","role":"admin"}'
    
    # 3. Admin lists users
    curl -X GET 'http://localhost:3001/api/rpc/admin/listUsers?limit=5' \
      -H "Content-Type: application/json" \
      -b cookies-admin.txt
    
    # Expected: All operations succeed, user appears in list with admin role
    ```
  
  - [ ] **Organization workflow** test:

    ```bash
    # 1. User creates organization
    curl -X POST http://localhost:3001/api/rpc/organization/createOrganization \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"name":"Test Company","slug":"test-company"}'
    
    # Save org ID from response
    
    # 2. User creates team
    curl -X POST http://localhost:3001/api/rpc/organization/createTeam \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"name":"Dev Team","organizationId":"<org-id>"}'
    
    # Save team ID from response
    
    # 3. User invites member
    curl -X POST http://localhost:3001/api/rpc/organization/inviteMember \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"email":"member@test.com","role":"member","organizationId":"<org-id>"}'
    
    # 4. User lists invitations
    curl -X GET 'http://localhost:3001/api/rpc/organization/listInvitations?organizationId=<org-id>' \
      -H "Content-Type: application/json" \
      -b cookies.txt
    
    # Expected: All operations succeed, invitation appears in list
    ```
  
  - [ ] **Error handling** test:

    ```bash
    # 1. Test invalid input
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -b cookies-admin.txt \
      -d '{"email":"invalid","password":"short"}'
    
    # Expected: 400 BAD_REQUEST with Zod validation error
    
    # 2. Test unauthorized access
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"test123","name":"Test"}'
    
    # Expected: 401 UNAUTHORIZED (no session)
    
    # 3. Test forbidden access
    curl -X POST http://localhost:3001/api/rpc/admin/createUser \
      -H "Content-Type: application/json" \
      -b cookies-user.txt \
      -d '{"email":"test@test.com","password":"test123","name":"Test"}'
    
    # Expected: 403 FORBIDDEN (not admin)
    ```
  
  - [ ] **Full project build**:

    ```bash
    # Run complete build process
    bun run build
    
    # Expected: All packages build successfully
    ```
  
  - [ ] **Type checking**:

    ```bash
    # Check types across all packages
    bun run check-types
    
    # Expected: No TypeScript errors
    ```
  
  - [ ] **Formatting check**:

    ```bash
    # Verify all code is properly formatted
    bun run check
    
    # Expected: No formatting changes needed
    ```

  **Commit**: YES
  - Message: `docs(api): add verification results for admin and organization APIs`
  - Files: Create `.sisyphus/verification-results.md` with test outputs
  - Pre-commit: `bun run check`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat(api): add requireAdmin helper for inline permission checks` | packages/api/src/index.ts | bun run check-types |
| 1 | `feat(api): implement complete admin router with 15 endpoints` | packages/api/src/routers/admin.ts | bun run check-types && bun run check |
| 2 | `feat(api): implement complete organization router with 28 endpoints` | packages/api/src/routers/organization.ts | bun run check-types && bun run check |
| 3 | `feat(api): export admin and organization routers in main app router` | packages/api/src/routers/index.ts | bun run check-types |
| 4 | `docs(api): add verification results for admin and organization APIs` | .sisyphus/verification-results.md | bun run check |

---

## Success Criteria

### Verification Commands

```bash
# 1. Type checking
bun run check-types  # Expected: No errors

# 2. Formatting
bun run check        # Expected: No changes needed

# 3. Build
bun run build        # Expected: All packages build successfully

# 4. API endpoint test (admin)
curl -X POST http://localhost:3001/api/rpc/admin/listUsers \
  -H "Content-Type: application/json" \
  -b cookies-admin.txt

# Expected: JSON response with users array

# 5. API endpoint test (organization)
curl -X POST http://localhost:3001/api/rpc/organization/listOrganizations \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Expected: JSON response with organizations array
```

### Final Checklist

- [ ] All 15 admin methods implemented
- [ ] All 28 organization methods implemented
- [ ] All inputs validated with Zod
- [ ] All admin endpoints check permissions inline
- [ ] All organization endpoints use protectedProcedure
- [ ] Error handling uses ORPCError
- [ ] Types exported correctly in AppRouter
- [ ] Sample curl tests pass for admin endpoints
- [ ] Sample curl tests pass for organization endpoints
- [ ] No TypeScript errors
- [ ] Code formatted with Biome
- [ ] All commits follow convention
- [ ] Documentation added for verification results
