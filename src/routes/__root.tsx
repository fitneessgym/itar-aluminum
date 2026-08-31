import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "العملاق للزجاج والألمنيوم";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "العملاق للزجاج والألمنيوم — إدارة المستودعات والإنتاج والموظفين.",
      },
      { name: "theme-color", content: "#efe8dc" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Toaster
          theme="light"
          position="bottom-center"
          toastOptions={{
            className: "font-sans",
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
