import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Route 53 Clone",
  description: "An AWS Route 53 console clone",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("route53-clone-theme");
    if (stored === "dark") {
      document.body.classList.add("awsui-dark-mode");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
