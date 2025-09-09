import "@/styles/globals.css";
import { Inter } from "next/font/google"
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <SiteHeader />
        <body className={inter.variable}>
            {children}
        </body>
        <SiteFooter />
    </html>
  );
}