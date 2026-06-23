// 📂 วางไฟล์นี้ที่: app/admin/company/[id]/page.tsx
import AdminCompanyDetail from "./AdminCompanyDetail";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminCompanyDetail companyId={id} />;
}
