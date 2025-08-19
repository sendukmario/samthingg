import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  experimental: {
    cssChunking: true,
    serverSourceMaps: true,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "*" },
      { protocol: "https", hostname: "*" },
    ],
  },
  compiler: {
    ...(process.env.NODE_ENV === "production"
      ? {
          removeConsole: {
            exclude: ["error", "warn", "time", "timeEnd"],
          },
        }
      : {}),
  },
  headers: () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Document-Policy",
            value: "js-profiling",
          },
        ],
      },
    ];
  },
  output: "standalone",
  webpack: (config, { isServer }) => {
    config.resolve.alias["handlebars"] = path.resolve(
      "./node_modules/handlebars/dist/handlebars.js",
    );
    config.module.rules.push({
      test: /\.hbs$/,
      loader: "handlebars-loader",
    });
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: "single",
        minimize: true,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
