// ตรวจ token ของ reCAPTCHA v2 กับ Google ฝั่งเซิร์ฟเวอร์
// ต้องตั้ง RECAPTCHA_SECRET_KEY ใน env (ห้ามขึ้นต้นด้วย NEXT_PUBLIC_ เพราะเป็นคีย์ลับ)

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface SiteVerifyResponse {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    // ตอนพัฒนาบนเครื่องยังไม่ตั้งคีย์ได้ แต่บน production ต้องมีเสมอ
    if (process.env.NODE_ENV !== "production") {
      console.warn("RECAPTCHA_SECRET_KEY is not set: skipping reCAPTCHA check");
      return true;
    }
    console.error("RECAPTCHA_SECRET_KEY is not set");
    return false;
  }

  if (!token) return false;

  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "no-store",
    });
    const data = (await res.json()) as SiteVerifyResponse;

    if (!data.success) {
      console.warn("reCAPTCHA failed:", data["error-codes"]);
    }
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verify error:", error);
    return false;
  }
}
