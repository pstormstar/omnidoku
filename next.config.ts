import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/validate': ['./.python_packages/**/*', './scripts/validate_puzzle.py'],
    '/api/check_unique': ['./.python_packages/**/*', './scripts/check_unique.py'],
  },
};

export default nextConfig;
