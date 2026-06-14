/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '/voxel-dominion',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};
module.exports = nextConfig;
