import "./globals.css";

export const metadata = {
  title: "Hisab-Kitab",
  description: "Collaborative restaurant bill splitting in real time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
