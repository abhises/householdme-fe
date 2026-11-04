import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "HouseholdMe admin", template: "%s – HouseholdMe admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
