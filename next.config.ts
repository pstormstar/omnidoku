import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/**/*': ['./.python_packages/**/*', './scripts/**/*'],
  },
};

export default nextConfig;
