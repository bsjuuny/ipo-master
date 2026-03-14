/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/ipomaster',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/ipomaster',
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ipomaster',
        basePath: false,
        permanent: false,
      },
      {
        source: '/calendar/:path*',
        destination: '/ipomaster/calendar/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/analysis/:path*',
        destination: '/ipomaster/analysis/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/ipo/:path*',
        destination: '/ipomaster/ipo/:path*',
        basePath: false,
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
