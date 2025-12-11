import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ghinzipffiwwrmvbzejf.supabase.co",
        port: "",
      },
    ],
    localPatterns: [
      {
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;