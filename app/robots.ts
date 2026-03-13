import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/rooms/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://nbbang.vercel.app/sitemap.xml",
    host: "https://nbbang.vercel.app",
  };
}
