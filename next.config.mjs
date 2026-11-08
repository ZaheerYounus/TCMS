/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./src/data/**/*'],
    },
  },
};

export default nextConfig;
