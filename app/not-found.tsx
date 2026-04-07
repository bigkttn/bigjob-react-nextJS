export default function pageNotFound() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">404 - หน้าไม่พบ</h1>
      <p>ขออภัย, ไม่พบหน้าที่คุณกำลังมองหา.</p>
      <a href="/" className="text-blue-500 hover:underline">
        กลับไปหน้า Home
      </a>
    </div>
  );
}