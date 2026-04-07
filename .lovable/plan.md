

## Problem

Race condition in `PermissionGate`: `useAuth` sets `user` before `roles` are fetched, causing `useModeratorPermissions` to evaluate permissions with `isAdmin=false` and redirect prematurely.

## Timeline of the bug

```text
1. useAuth: setUser(session.user)         → user is set, isAdmin still false
2. useModeratorPermissions(userId, false)  → queries moderator_permissions, finds nothing
3. useModeratorPermissions: loading=false, permissions=[]
4. PermissionGate: !loading && !hasPermission → REDIRECT to /admin ❌
5. useAuth: setRoles(["admin"])            → isAdmin=true (TOO LATE)
```

## Fix

**File: `src/components/admin/PermissionGate.tsx`**
- Also read `loading` from `useAuth` (the auth loading state)
- Only evaluate permissions when BOTH `useAuth` loading AND `useModeratorPermissions` loading are complete
- This ensures `isAdmin` is resolved before `hasPermission` is checked

**File: `src/hooks/useModeratorPermissions.ts`**  
- Add a guard: if the hook receives `userId` but `useAuth` is still loading (i.e., `isAdmin` might change), don't finalize yet
- Simpler approach: accept an `authLoading` parameter, and keep `loading=true` until `authLoading` is `false`

### Concrete changes

1. **`useModeratorPermissions.ts`**: Add optional `authLoading` parameter. When `authLoading` is true, keep internal loading true and skip the query.

2. **`PermissionGate.tsx`**: Pass `loading` from `useAuth` into `useModeratorPermissions`:
   ```ts
   const { user, isAdmin, loading: authLoading } = useAuth("moderator");
   const { loading, hasPermission } = useModeratorPermissions(user?.id, isAdmin, authLoading);
   ```

3. **`AdminLayout.tsx`**: Same pattern — pass auth loading to `useModeratorPermissions`.

4. **`AdminSubscriptionPlans.tsx`** and **`AdminPromoCodes.tsx`**: Already use `useAuth("moderator")` separately from `PermissionGate`, no changes needed there since the gate handles access control.

### Files to modify
- `src/hooks/useModeratorPermissions.ts`
- `src/components/admin/PermissionGate.tsx`
- `src/components/admin/AdminLayout.tsx`

