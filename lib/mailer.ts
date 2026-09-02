import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendWarningEmail(
  toEmail: string,
  targetName: string,
  customMessage: string
) {
  const mailOptions = {
    from: `"BIGJOBs Admin" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "แจ้งเตือนการตักเตือนเรื่องการใช้งานระบบ - BIGJOBs",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e5e7eb; padding: 40px 16px;">
          <tr>
            <td align="center">
              <div style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #d1d5db;">
                
                <!-- Header section (ตามแถบ Navbar ดำของเว็บ BIGJOBs) -->
                <div style="background-color: #000000; padding: 24px 32px; text-align: left;">
                  <span style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; font-family: Arial, sans-serif;">
                    BIG<span style="color: #ffffff;">JOBs</span>
                  </span>
                </div>

                <!-- Body Content section -->
                <div style="padding: 32px 32px 24px 32px; text-align: left;">
                  
                  <!-- Tag เตือนสไตล์ UI Badge -->
                  <div style="display: inline-block; background-color: #fffbebfb; border: 1px solid #fef3c7; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">
                    <span style="color: #d97706; font-size: 13px; font-weight: 700;">แจ้งเตือนจากผู้ดูแลระบบ</span>
                  </div>

                  <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
                    เรียน คุณ/ท่าน ${targetName}
                  </h2>
                  
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    ทางทีมงานผู้ดูแลระบบ <strong>BIGJOBs</strong> ขอแจ้งเตือนเกี่ยวกับการใช้งานบัญชีหรือประกาศของคุณ เนื่องจากพบการทำผิดเงื่อนไขการใช้งานหรือได้รับการร้องเรียนจากผู้ใช้งานในระบบ
                  </p>

                  <!-- กล่องข้อความตักเตือนสไตล์ Card UI -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; border-top: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <div style="color: #b45309; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      รายละเอียดการตักเตือน:
                    </div>
                    <div style="color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                      ${customMessage}
                    </div>
                  </div>

                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    โปรดตรวจสอบและปรับปรุงการใช้งานให้เป็นไปตามกฎระเบียบของระบบ หากยังพบการทำผิดเงื่อนไขซ้ำ ทางระบบจำเป็นต้องระงับการใช้งานบัญชีเป็นการชั่วคราวหรือถาวร
                  </p>

                  <!-- ปุ่มกลับสู่หน้าเว็บ (ปุ่มสีดำสไตล์ BIGJOBs) -->
                  <div style="text-align: center; margin: 32px 0 16px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "#"}" target="_blank" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; transition: all 0.2s ease;">
                      เข้าสู่ระบบ BIGJOBs
                    </a>
                  </div>

                </div>

                <!-- Footer section -->
                <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                    อีเมลนี้เป็นการแจ้งเตือนจากระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้<br>
                    หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อฝ่ายซัพพอร์ตผ่านระบบฟีดแบ็กบนเว็บไซต์
                  </p>
                </div>

              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
}