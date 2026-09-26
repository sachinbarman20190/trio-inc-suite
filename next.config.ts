import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow access to remote image placeholder and Unsplash.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  productionBrowserSourceMaps: false,
  transpilePackages: ['motion'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/**',
      'node_modules/@esbuild/**',
      'node_modules/webpack/**',
      'node_modules/eslint/**',
      'node_modules/typescript/**',
    ],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    optimizePackageImports: ['lucide-react', 'motion/react'],
  },
  webpack: (config, {dev}) => {
    // Only disable cache during build to reduce memory usage
    if (!dev) {
      config.cache = false;
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
