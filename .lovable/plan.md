

## Plan: Reset Admin Account Credentials

### Overview
Reset the password for the admin account `msorori201201@gmail.com` to `Login@123`.

### Steps

1. **Create a one-time Edge Function** that uses the Supabase Admin API (`auth.admin`) to update the user's password
   - Find the user by email using `auth.admin.listUsers()`
   - Update their password using `auth.admin.updateUserById(userId, { password: 'Login@123' })`
   
2. **Call the Edge Function** once to execute the password reset

3. **Delete the Edge Function** after use (it's a one-time operation and should not remain deployed for security reasons)

### Security Note
The password `Login@123` is relatively weak for an admin account. Consider changing it to something stronger after verifying access works.

### Technical Details
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already configured) to access the admin API
- No database migration needed - this is purely an auth operation
- The edge function will be temporary and removed immediately after use

