import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["knex", "@node-rs/argon2"],
};

export default nextConfig;
