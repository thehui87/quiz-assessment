// app/layout.tsx (Example for App Router)
import "./globals.css";
import { ReduxProvider } from "../lib/Provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
