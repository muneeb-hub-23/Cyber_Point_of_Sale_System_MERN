/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enables React strict mode
  swcMinify: true, // Uses SWC compiler for faster builds and minification
  images: {
    domains: ['localhost','172.16.100.1'], // Allows loading images from external domains
  },
  env: {

  },
};

export default nextConfig;