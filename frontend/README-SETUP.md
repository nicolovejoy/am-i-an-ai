# Vite Frontend Setup

## Environment Variables

You need to get the actual Cognito values from your Terraform deployment:

1. **Get Cognito values from Terraform:**
   ```bash
   cd ../../infrastructure
   terraform output cognito_user_pool_id
   terraform output cognito_client_id
   ```

2. **Update your .env file with the actual values:**
   ```
   VITE_COGNITO_USER_POOL_ID=<value from terraform output>
   VITE_COGNITO_CLIENT_ID=<value from terraform output>
   ```

3. **Restart the dev server after updating .env:**
   ```bash
   npm run dev
   ```

## Current Status

- ✅ Vite project created and configured
- ✅ All components migrated from Next.js
- ✅ React Router configured
- ✅ TypeScript imports fixed
- ✅ Tailwind CSS configured
- ✅ Cognito polyfills added
- ❌ Need actual Cognito credentials from Terraform

## Next Steps

1. Get the Cognito credentials from Terraform outputs
2. Update the .env file with real values
3. Test authentication flow
4. Run build to ensure production build works
5. Update CI/CD pipeline