import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  output: "standalone",
};

export default nextConfig;
