import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/**/*': ['./.python_packages/**/*', './scripts/**/*'],
  },
  outputFileTracingExcludes: {
    '/api/validate': ['./.python_packages/grpc*/**/*', './.python_packages/google*/**/*'],
    '/api/check_unique': ['./.python_packages/grpc*/**/*', './.python_packages/google*/**/*'],
    '/api/generate_art': ['./.python_packages/z3/**/*', './.python_packages/z3_solver-*/**/*'],
  },
};

export default nextConfig;
