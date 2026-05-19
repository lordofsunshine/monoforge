import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/settings",
          "/new",
          "/login",
          "/register",
          "/api/",
          "/stars",
          "/activity",
          "/issues",
          "/*/settings",
          "/*/storage",
          "/*/blob/",
          "/*/tree/",
        ],
      },
    ],
    sitemap: "https://monoforge.org/sitemap.xml",
    host: "https://monoforge.org",
  };
}
