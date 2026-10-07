// ข้อความอีเมลแบบทางการที่ส่งถึงผู้สมัคร ในนามของบริษัท (ใช้ใน interview_tracking/update-status)
// + อีเมลแจ้งบริษัทเมื่อผู้สมัครขอเลื่อนนัด (rescheduleRequestMail)

export interface SeekerMailContext {
  seekerName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  jobTitle: string;
  platformLink: string;
}

export interface InterviewDetail {
  interviewDate?: string; // YYYY-MM-DD
  interviewTime?: string; // HH:mm
  interviewType?: string; // online | onsite
  locationName?: string;
}

export interface MailContent {
  subject: string;
  body: string;
}

// "2026-10-25" → "วันอาทิตย์ที่ 25 ตุลาคม 2569"
function formatThaiDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "14:00" → "14.00"
function formatThaiTime(time: string): string {
  return time.replace(":", ".");
}

// ค่า DATETIME จาก mysql2 (Date ตามเวลาเครื่อง) → { date: "YYYY-MM-DD", time: "HH:mm" }
export function toDateParts(value: Date): { date: string; time: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

// "2026-10-25", "14:00" → "วันอาทิตย์ที่ 25 ตุลาคม 2569 เวลา 14.00 น."
function formatThaiDateTime(date: string, time: string): string {
  return `${formatThaiDate(date)} เวลา ${formatThaiTime(time)} น.`;
}

function interviewDetailLines(detail: InterviewDetail): string {
  const isOnline = detail.interviewType === "online";
  const lines = [];
  if (detail.interviewDate && detail.interviewTime) {
    lines.push(`    วันสัมภาษณ์ : ${formatThaiDate(detail.interviewDate)}`);
    lines.push(`    เวลา        : ${formatThaiTime(detail.interviewTime)} น.`);
  } else {
    lines.push("    วันและเวลา  : ตามที่ระบุในระบบ BIGJOBs");
  }
  lines.push(
    `    รูปแบบ      : ${isOnline ? "สัมภาษณ์ออนไลน์" : "สัมภาษณ์ ณ สถานที่"}`,
  );
  if (detail.locationName) {
    const label = isOnline ? "ลิงก์สำหรับเข้าร่วมสัมภาษณ์" : "สถานที่สัมภาษณ์";
    lines.push(`    ${label} : ${detail.locationName}`);
  }
  return lines.join("\n");
}

function contactLines(ctx: SeekerMailContext): string {
  let lines = `หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อได้ที่\n    อีเมล : ${ctx.companyEmail}`;
  if (ctx.companyPhone) {
    lines += `\n    โทร.  : ${ctx.companyPhone}`;
  }
  return lines;
}

function signature(ctx: SeekerMailContext): string {
  return [
    "ขอแสดงความนับถือ",
    "ฝ่ายทรัพยากรบุคคล",
    ctx.companyName,
    "",
    "──────────────────────────────",
    `อีเมลฉบับนี้ส่งผ่านระบบ BIGJOBs ในนามของ ${ctx.companyName}`,
    `หากมีข้อสงสัย สามารถตอบกลับอีเมลนี้ หรือติดต่อบริษัทโดยตรงที่ ${ctx.companyEmail}`,
  ].join("\n");
}

// 1. นัดสัมภาษณ์ (screening)
// isChange = true เมื่อเคยมีวันนัดแล้ว (บริษัทเลื่อนนัด / กำหนดเวลาใหม่แทนเวลาที่ผู้สมัครขอ)
export function interviewInviteMail(
  ctx: SeekerMailContext,
  detail: InterviewDetail,
  isChange = false,
): MailContent {
  const intro = isChange
    ? `ตามที่ท่านได้สมัครงานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ขอแจ้งเปลี่ยนแปลงวันและเวลานัดหมายสัมภาษณ์ เป็นดังนี้`
    : `ตามที่ท่านได้ยื่นความประสงค์สมัครงานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ขอเรียนเชิญท่านเข้ารับการสัมภาษณ์ ตามรายละเอียดดังนี้`;

  const body = `เรียน คุณ${ctx.seekerName}

${intro}

${interviewDetailLines(detail)}

หากท่านสะดวกเข้ารับการสัมภาษณ์ตามวันและเวลาดังกล่าว กรุณาเข้าสู่ระบบ BIGJOBs
เพื่อกดยืนยันการเข้าร่วมสัมภาษณ์ ได้ที่ลิงก์ด้านล่างนี้

    ${ctx.platformLink}

หากไม่สะดวกตามวันและเวลาดังกล่าว ท่านสามารถกด "ขอเลื่อนนัด" ในระบบ BIGJOBs
เพื่อเสนอวันและเวลาที่สะดวกให้บริษัทฯ พิจารณา

${contactLines(ctx)}

บริษัทฯ ขอขอบคุณที่ให้ความสนใจร่วมงานกับ ${ctx.companyName}
และหวังเป็นอย่างยิ่งว่าจะได้พบกับท่านในการสัมภาษณ์ครั้งนี้

${signature(ctx)}`;

  const subject = isChange
    ? `แจ้งเปลี่ยนแปลงวันนัดสัมภาษณ์ ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`
    : `นัดหมายสัมภาษณ์งาน ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`;

  return { subject, body };
}

// 1.1 บริษัทตกลงตามเวลาที่ผู้สมัครขอเลื่อน (reschedule → interview)
export function rescheduleConfirmedMail(
  ctx: SeekerMailContext,
  detail: InterviewDetail,
): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

ตามที่ท่านได้ขอเลื่อนวันสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ได้พิจารณาแล้ว และขอยืนยันวันและเวลาสัมภาษณ์ใหม่ตามที่ท่านเสนอ ดังนี้

${interviewDetailLines(detail)}

ท่านสามารถตรวจสอบรายละเอียดนัดหมายได้ที่

    ${ctx.platformLink}

${contactLines(ctx)}

บริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้พบกับท่านในการสัมภาษณ์ครั้งนี้

${signature(ctx)}`;

  return {
    subject: `ยืนยันวันสัมภาษณ์ใหม่ ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

// 1.2 ผู้สมัครขอเลื่อนนัด → แจ้งบริษัท (ส่งในนามระบบ BIGJOBs)
export function rescheduleRequestMail(
  ctx: SeekerMailContext,
  request: {
    oldDate: { date: string; time: string } | null;
    newDate: string;
    newTime: string;
    reason: string;
  },
): MailContent {
  const oldText = request.oldDate
    ? formatThaiDateTime(request.oldDate.date, request.oldDate.time)
    : "-";

  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

คุณ${ctx.seekerName} ผู้สมัครตำแหน่ง ${ctx.jobTitle} ได้ขอเลื่อนวันสัมภาษณ์ ดังนี้

    วันนัดเดิม       : ${oldText}
    วันที่ขอเลื่อนเป็น : ${formatThaiDateTime(request.newDate, request.newTime)}
    เหตุผล          : ${request.reason}

กรุณาเข้าสู่ระบบ BIGJOBs เพื่อตกลงตามเวลาที่ผู้สมัครเสนอ หรือกำหนดวันและเวลาใหม่

    ${ctx.platformLink}

──────────────────────────────
อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ BIGJOBs`;

  return {
    subject: `[ขอเลื่อนนัด] คุณ${ctx.seekerName} ขอเลื่อนวันสัมภาษณ์ตำแหน่ง ${ctx.jobTitle}`,
    body,
  };
}

// 2. ผ่านการคัดเลือก / ข้อเสนองาน (appointment, offer)
export function offerMail(ctx: SeekerMailContext): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

ตามที่ท่านได้สมัครงานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName}
และได้เข้ารับการสัมภาษณ์เรียบร้อยแล้วนั้น

บริษัทฯ มีความยินดีที่จะแจ้งให้ทราบว่า "ท่านได้ผ่านการพิจารณาคัดเลือก"
ในตำแหน่ง ${ctx.jobTitle} และบริษัทฯ ได้จัดส่งข้อเสนอการจ้างงานให้ท่านผ่านระบบ BIGJOBs แล้ว

กรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดข้อเสนอ และกดยืนยันการตอบรับ ได้ที่

    ${ctx.platformLink}

หลังจากได้รับการยืนยันจากท่านแล้ว บริษัทฯ จะติดต่อกลับเพื่อแจ้งรายละเอียดเพิ่มเติม ได้แก่
    • วันเริ่มงานและสถานที่ปฏิบัติงาน
    • เอกสารที่ต้องจัดเตรียม
    • รายละเอียดอื่น ๆ ที่เกี่ยวข้อง

${contactLines(ctx)}

บริษัทฯ ขอแสดงความยินดี และหวังเป็นอย่างยิ่งว่าจะได้ร่วมงานกับท่าน

${signature(ctx)}`;

  return {
    subject: `แจ้งผลการคัดเลือก ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

// 3. ไม่ผ่านการคัดเลือก (reject, rejected) — ใช้เมื่อบริษัทเป็นผู้ปฏิเสธ
export function rejectionMail(ctx: SeekerMailContext): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

บริษัทฯ ขอขอบคุณที่ท่านได้ให้ความสนใจและสละเวลาสมัครงานในตำแหน่ง ${ctx.jobTitle}
กับ ${ctx.companyName}

หลังจากได้พิจารณาคุณสมบัติของผู้สมัครอย่างรอบคอบแล้ว บริษัทฯ ขอเรียนให้ทราบว่า
ในครั้งนี้ บริษัทฯ ยังไม่สามารถดำเนินการพิจารณาใบสมัครของท่านต่อได้

ทั้งนี้ บริษัทฯ จะเก็บข้อมูลของท่านไว้ และหากมีตำแหน่งงานที่เหมาะสมกับคุณสมบัติของท่าน
บริษัทฯ จะติดต่อกลับไปอีกครั้ง

ท่านสามารถตรวจสอบสถานะการสมัคร และค้นหาตำแหน่งงานอื่นที่น่าสนใจได้ที่

    ${ctx.platformLink}

บริษัทฯ ขอขอบคุณอีกครั้ง และขออวยพรให้ท่านประสบความสำเร็จในหน้าที่การงาน

${signature(ctx)}`;

  return {
    subject: `แจ้งผลการพิจารณาใบสมัคร ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}
