import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/me",
        destination: "https://www.notion.so/Blogs-266ca97f62d0804894b6c8c1e3bfbbc4",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
