/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Make sure the basePath matches your S3 website URL structure
  // basePath: '',
  // If you're hosting at a subdirectory, set trailing slash appropriately
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Ensure proper handling of client-side routing
  assetPrefix:
    process.env.NODE_ENV === "production" ? "https://amianai.com" : "",
  // Add environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID:
      process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
};

module.exports = nextConfig;
