import { PageEditor } from "@/components/admin/PageEditor";

export default async function EditInfoPage({ params }: { params: Promise<{ id: string }> }) {
  return <PageEditor id={(await params).id} />;
}
