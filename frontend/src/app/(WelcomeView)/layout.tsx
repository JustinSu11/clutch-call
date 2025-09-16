// Removed: import "@/styles/globals.css";
import { Inter } from "next/font/google";
import SiteHeader from "@/components/WelcomeViewComponents/SiteHeader";
import SiteFooter from "@/components/WelcomeViewComponents/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={inter.variable}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}