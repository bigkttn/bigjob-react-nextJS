import Swal from "sweetalert2";

export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: "success",
      iconColor: "#10b981",
      confirmButtonText: "ยอดเยี่ยมไปเลย!",
      confirmButtonColor: "#111827", // bg-gray-900
      customClass: {
        popup: "premium-swal-popup",
        confirmButton: "premium-swal-btn",
      },
      buttonsStyling: true, // เปิดใช้สไตล์ดั้งเดิมที่แน่นอนกว่า
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: "error",
      iconColor: "#ef4444",
      confirmButtonText: "ลองใหม่อีกครั้ง",
      confirmButtonColor: "#111827",
      customClass: {
        popup: "premium-swal-popup",
        confirmButton: "premium-swal-btn",
      },
      buttonsStyling: true,
    });
  },
  info: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: "info",
      iconColor: "#3b82f6",
      confirmButtonText: "รับทราบครับ",
      confirmButtonColor: "#111827",
      customClass: {
        popup: "premium-swal-popup",
        confirmButton: "premium-swal-btn",
      },
      buttonsStyling: true,
    });
  },
  // ตัวโหลดระหว่างทำงาน ปิดเองไม่ได้ ต้องเรียก showAlert.close() หรือเปิด alert อื่นทับ
  loading: (title: string) => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: "premium-swal-popup" },
      didOpen: () => Swal.showLoading(),
    });
  },
  close: () => Swal.close(),
  // ถามข้อความจากผู้ใช้ (แทน prompt() ของเบราว์เซอร์) คืน null ถ้ากดยกเลิก
  prompt: async (title: string, placeholder = ""): Promise<string | null> => {
    const result = await Swal.fire({
      title,
      input: "textarea",
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#111827",
      customClass: { popup: "premium-swal-popup" },
      inputValidator: (value) =>
        value.trim() ? undefined : "กรุณากรอกข้อความ",
    });
    return result.isConfirmed ? String(result.value).trim() : null;
  },
};
