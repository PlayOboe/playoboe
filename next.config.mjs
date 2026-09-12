import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config) => {
    config.resolve.alias["@"] = __dirname;
    return config;
  },
};

export default nextConfig;
