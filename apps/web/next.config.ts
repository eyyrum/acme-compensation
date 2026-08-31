const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: ['@acme/shared'],
};
export default nextConfig;
