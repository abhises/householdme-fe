import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="ad">
      <AdminNav />
      <div className="ad-main">
        <ConfirmProvider>
          {/* list pages read ?page= with useSearchParams, which needs a Suspense boundary for production builds */}
          <Suspense>{children}</Suspense>
        </ConfirmProvider>
      </div>
    </div>
  );
}
