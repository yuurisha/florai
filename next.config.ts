import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
<<<<<<< HEAD
=======

  typescript: {
    ignoreBuildErrors: true,
  },
>>>>>>> a681b1ecf5e2d54c51ae9172af9e85a0b655a9c7
};

export default nextConfig;
