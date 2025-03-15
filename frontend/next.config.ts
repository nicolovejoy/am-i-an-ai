import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Make sure the basePath matches your S3 website URL structure
  // basePath: '',
  // If you're hosting at a subdirectory, set trailing slash appropriately
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
