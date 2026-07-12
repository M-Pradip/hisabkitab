import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Hisab Kitab",
  description: "Secure hosting, settlement, and payment reminders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
