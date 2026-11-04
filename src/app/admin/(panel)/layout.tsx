import { AdminShell } from "@/components/admin/AdminShell";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
