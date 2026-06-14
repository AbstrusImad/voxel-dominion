/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Published on Cloudflare Pages, which serves from the domain root, so no basePath.
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};
module.exports = nextConfig;
