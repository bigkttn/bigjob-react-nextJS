// ข้อความอีเมลแบบทางการของขั้นตอนสมัครงานทั้งหมด (interview_tracking)
//
// รูปแบบเดียวกันทุกฉบับ ตามหลักการเขียนอีเมลติดต่องานภาษาไทย
//   1. คำขึ้นต้น   : เรียน คุณ... / เรียน ฝ่ายทรัพยากรบุคคล ...
//   2. ย่อหน้าเปิด : อ้างถึงเรื่องเดิม ("ตามที่...") หรือแจ้งเรื่องใหม่ ("ด้วย...")
//   3. รายละเอียด  : ข้อมูลสำคัญแยกเป็นรายการ (ตำแหน่ง ชื่อ วันเวลา ช่องทางติดต่อ)
//   4. สิ่งที่ต้องทำ : บอกขั้นตอนถัดไปและลิงก์ให้ชัดเจน
//   5. คำลงท้าย   : "จึงเรียนมาเพื่อ..." + "ขอแสดงความนับถือ" + ชื่อผู้ส่ง
//
// ถึงผู้สมัคร  → ส่งในนามบริษัท (ลงชื่อฝ่ายทรัพยากรบุคคล, replyTo = อีเมลบริษัท)
// ถึงบริษัท   → ส่งในนามระบบ BIGJOBs (replyTo = อีเมลผู้สมัคร เพื่อให้ HR ตอบกลับผู้สมัครได้ทันที)
//
// เป็นข้อความล้วน (text) ไม่ใช่ HTML ข้อความที่ผู้ใช้พิมพ์จึงแทรกโค้ด/ลิงก์ปลอมไม่ได้

export interface SeekerMailContext {
  seekerName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  jobTitle: string;
  platformLink: string;
}

export interface CompanyMailContext {
  companyName: string;
  jobTitle: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone: string | null;
  seekerProfileLink: string;
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

type DetailRow = [label: string, value: string | null | undefined];

const DIVIDER = "────────────────────────────────────";

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

// "14:00" → "14.00 น."
function formatThaiTime(time: string): string {
  return `${time.replace(":", ".")} น.`;
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
  return `${formatThaiDate(date)} เวลา ${formatThaiTime(time)}`;
}

// เวลาปัจจุบันตามเวลาประเทศไทย ใช้ระบุ "วันที่ดำเนินการ" ในอีเมล
function thaiNow(): string {
  const now = new Date();
  const date = now.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const time = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });
  return `${date} เวลา ${formatThaiTime(time)}`;
}

// รายการข้อมูลแบบย่อหน้า ข้ามบรรทัดที่ไม่มีค่า
function detailBlock(rows: DetailRow[]): string {
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `    ${label} : ${value}`)
    .join("\n");
}

function interviewRows(detail: InterviewDetail): DetailRow[] {
  const isOnline = detail.interviewType === "online";
  const hasDateTime = Boolean(detail.interviewDate && detail.interviewTime);
  return [
    [
      "วันที่สัมภาษณ์",
      hasDateTime ? formatThaiDate(detail.interviewDate!) : "ตามที่ระบุในระบบ BIGJOBs",
    ],
    ["เวลา", hasDateTime ? formatThaiTime(detail.interviewTime!) : null],
    ["รูปแบบการสัมภาษณ์", isOnline ? "สัมภาษณ์ออนไลน์" : "สัมภาษณ์ ณ สถานที่ของบริษัท"],
    [isOnline ? "ลิงก์เข้าร่วมสัมภาษณ์" : "สถานที่สัมภาษณ์", detail.locationName],
  ];
}

// ช่องทางติดต่อบริษัท (ท้ายอีเมลถึงผู้สมัคร)
function companyContact(ctx: SeekerMailContext): string {
  return `หากท่านมีข้อสงสัยเพิ่มเติม สามารถติดต่อบริษัทฯ ได้ทางช่องทางดังต่อไปนี้
${detailBlock([
  ["อีเมล", ctx.companyEmail],
  ["โทรศัพท์", ctx.companyPhone],
])}`;
}

// ข้อมูลผู้สมัคร (ในอีเมลถึงบริษัท)
function seekerRows(ctx: CompanyMailContext): DetailRow[] {
  return [
    ["ตำแหน่งงาน", ctx.jobTitle],
    ["ชื่อผู้สมัคร", ctx.seekerName],
    ["อีเมลผู้สมัคร", ctx.seekerEmail],
    ["โทรศัพท์ผู้สมัคร", ctx.seekerPhone],
  ];
}

// ลายเซ็นอีเมลที่ส่งในนามบริษัท
function companySignature(ctx: SeekerMailContext): string {
  return `ขอแสดงความนับถือ

ฝ่ายทรัพยากรบุคคล
${ctx.companyName}

${DIVIDER}
อีเมลฉบับนี้ส่งผ่านระบบ BIGJOBs ในนามของ ${ctx.companyName}
ท่านสามารถตอบกลับอีเมลฉบับนี้ เพื่อติดต่อบริษัทฯ ได้โดยตรง`;
}

// ลายเซ็นอีเมลที่ส่งในนามระบบ BIGJOBs (อีเมลถึงบริษัทตั้ง replyTo เป็นอีเมลผู้สมัคร)
function systemSignature(): string {
  return `ขอแสดงความนับถือ

ทีมงาน BIGJOBs

${DIVIDER}
อีเมลฉบับนี้ส่งจากระบบ BIGJOBs
ท่านสามารถตอบกลับอีเมลฉบับนี้ เพื่อติดต่อผู้สมัครได้โดยตรง`;
}

/* ═════════════════════ อีเมลถึงผู้สมัคร (ในนามบริษัท) ═════════════════════ */

// บริษัทเชิญชวนผู้หางานให้สนใจตำแหน่งงาน (invite-seeker → pending)
export function invitationMail(
  ctx: SeekerMailContext,
  companyMessage: string,
  jobLink: string,
): MailContent {
  const message = companyMessage.trim();
  const messageBlock = message
    ? `
ข้อความจากบริษัทฯ
"${message}"
`
    : "";

  const body = `เรียน คุณ${ctx.seekerName}

ด้วย ${ctx.companyName} ได้พิจารณาข้อมูลโปรไฟล์ของท่านผ่านระบบ BIGJOBs แล้ว
เห็นว่าท่านมีคุณสมบัติที่น่าสนใจ จึงใคร่ขอเชิญท่านพิจารณาร่วมงานกับบริษัทฯ ในตำแหน่งดังนี้

${detailBlock([
  ["ตำแหน่งงาน", ctx.jobTitle],
  ["บริษัท", ctx.companyName],
])}
${messageBlock}
ท่านสามารถดูรายละเอียดตำแหน่งงานได้ที่
    ${jobLink}

หากท่านสนใจ กรุณาเข้าสู่ระบบ BIGJOBs และกด "ตอบรับ" ในหน้าติดตามสถานะการสมัคร
เพื่อให้บริษัทฯ ดำเนินการนัดหมายสัมภาษณ์ในขั้นตอนต่อไป

${companyContact(ctx)}

จึงเรียนมาเพื่อโปรดพิจารณา และหวังเป็นอย่างยิ่งว่าจะได้รับการตอบรับจากท่าน

${companySignature(ctx)}`;

  return {
    subject: `ขอเชิญพิจารณาร่วมงาน ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

// นัดสัมภาษณ์ (screening)
// isChange = true เมื่อเคยมีวันนัดแล้ว (บริษัทเลื่อนนัด / กำหนดเวลาใหม่แทนเวลาที่ผู้สมัครขอ)
export function interviewInviteMail(
  ctx: SeekerMailContext,
  detail: InterviewDetail,
  isChange = false,
): MailContent {
  const intro = isChange
    ? `ตามที่บริษัทฯ ได้นัดหมายท่านเข้ารับการสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} ไว้แล้วนั้น
บริษัทฯ ขอแจ้งเปลี่ยนแปลงวันและเวลานัดหมายสัมภาษณ์ เป็นดังนี้`
    : `ตามที่ท่านได้สมัครงานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ได้พิจารณาคุณสมบัติของท่านเบื้องต้นแล้ว จึงขอเรียนเชิญท่านเข้ารับการสัมภาษณ์งาน
ตามรายละเอียดดังนี้`;

  const body = `เรียน คุณ${ctx.seekerName}

${intro}

${detailBlock(interviewRows(detail))}

ในการนี้ ขอความกรุณาท่านเข้าสู่ระบบ BIGJOBs และกด "ยืนยันนัด" เพื่อยืนยันการเข้าร่วมสัมภาษณ์ ได้ที่
    ${ctx.platformLink}

หากท่านไม่สะดวกตามวันและเวลาดังกล่าว ท่านสามารถกด "ขอเลื่อนนัด" ในระบบ BIGJOBs
เพื่อเสนอวันและเวลาที่สะดวกให้บริษัทฯ พิจารณา

${companyContact(ctx)}

จึงเรียนมาเพื่อโปรดทราบและยืนยันการเข้าร่วมสัมภาษณ์

${companySignature(ctx)}`;

  const subject = isChange
    ? `แจ้งเปลี่ยนแปลงวันนัดสัมภาษณ์ ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`
    : `ขอเชิญเข้ารับการสัมภาษณ์งาน ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`;

  return { subject, body };
}

// บริษัทตกลงตามเวลาที่ผู้สมัครขอเลื่อน (reschedule → interview)
export function rescheduleConfirmedMail(
  ctx: SeekerMailContext,
  detail: InterviewDetail,
): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

ตามที่ท่านได้ขอเลื่อนวันสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ได้พิจารณาแล้ว และขอยืนยันวันและเวลาสัมภาษณ์ใหม่ตามที่ท่านเสนอ ดังนี้

${detailBlock(interviewRows(detail))}

ท่านสามารถตรวจสอบรายละเอียดนัดหมายได้ที่
    ${ctx.platformLink}

${companyContact(ctx)}

จึงเรียนมาเพื่อโปรดทราบ และบริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้พบท่านตามวันและเวลาดังกล่าว

${companySignature(ctx)}`;

  return {
    subject: `ยืนยันวันนัดสัมภาษณ์ใหม่ ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

// ผ่านการคัดเลือก / ข้อเสนองาน (appointment, offer)
export function offerMail(ctx: SeekerMailContext): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

ตามที่ท่านได้เข้ารับการสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ มีความยินดีที่จะแจ้งให้ท่านทราบว่า ท่านผ่านการพิจารณาคัดเลือกในตำแหน่งดังกล่าว
และบริษัทฯ ได้จัดส่งข้อเสนอการจ้างงานให้ท่านผ่านระบบ BIGJOBs เรียบร้อยแล้ว

${detailBlock([
  ["ตำแหน่งงาน", ctx.jobTitle],
  ["บริษัท", ctx.companyName],
  ["ผลการพิจารณา", "ผ่านการคัดเลือก"],
])}

ในการนี้ ขอความกรุณาท่านเข้าสู่ระบบ BIGJOBs เพื่อตรวจสอบรายละเอียดข้อเสนอ
และกด "ตกลง" เพื่อตอบรับ หรือ "ปฏิเสธ" ข้อเสนอ ได้ที่
    ${ctx.platformLink}

เมื่อได้รับการตอบรับจากท่านแล้ว บริษัทฯ จะติดต่อกลับเพื่อแจ้งรายละเอียดเพิ่มเติม ได้แก่
    1. วันเริ่มงานและสถานที่ปฏิบัติงาน
    2. เอกสารที่ต้องจัดเตรียมในวันเริ่มงาน
    3. รายละเอียดอื่น ๆ ที่เกี่ยวข้อง

${companyContact(ctx)}

จึงเรียนมาเพื่อโปรดพิจารณา และขอแสดงความยินดีกับท่านมา ณ โอกาสนี้

${companySignature(ctx)}`;

  return {
    subject: `แจ้งผลการคัดเลือกและข้อเสนอการจ้างงาน ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

// ไม่ผ่านการคัดเลือก (reject, rejected) — ใช้เมื่อบริษัทเป็นผู้ปฏิเสธ
export function rejectionMail(ctx: SeekerMailContext): MailContent {
  const body = `เรียน คุณ${ctx.seekerName}

ตามที่ท่านได้สมัครงานในตำแหน่ง ${ctx.jobTitle} กับ ${ctx.companyName} นั้น
บริษัทฯ ขอขอบคุณที่ท่านให้ความสนใจและสละเวลาในการสมัครงานกับบริษัทฯ

บริษัทฯ ได้พิจารณาคุณสมบัติของผู้สมัครทุกท่านอย่างรอบคอบแล้ว และขอเรียนให้ทราบว่า
ในครั้งนี้ บริษัทฯ ยังไม่สามารถพิจารณาใบสมัครของท่านในขั้นตอนต่อไปได้

ทั้งนี้ หากในอนาคตมีตำแหน่งงานที่เหมาะสมกับคุณสมบัติของท่าน บริษัทฯ อาจติดต่อท่านอีกครั้ง
ท่านสามารถตรวจสอบสถานะการสมัคร และค้นหาตำแหน่งงานอื่นที่น่าสนใจได้ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดทราบ และขออวยพรให้ท่านประสบความสำเร็จในหน้าที่การงาน

${companySignature(ctx)}`;

  return {
    subject: `แจ้งผลการพิจารณาใบสมัคร ตำแหน่ง ${ctx.jobTitle} – ${ctx.companyName}`,
    body,
  };
}

/* ═════════════════════ อีเมลถึงบริษัท (ในนามระบบ BIGJOBs) ═════════════════════ */

// ผู้หางานส่งใบสมัคร (apply-company) หรือทำแบบทดสอบแล้วส่งใบสมัคร (submit-test)
export function applicationMail(
  ctx: CompanyMailContext,
  options: { seekerMessage?: string; withTest?: boolean },
): MailContent {
  const message = (options.seekerMessage ?? "").trim();
  const messageBlock = message
    ? `
ข้อความจากผู้สมัคร
"${message}"
`
    : "";
  const testNote = options.withTest
    ? "\nผู้สมัครได้ทำแบบทดสอบความเข้ากันได้กับองค์กรเรียบร้อยแล้ว ท่านสามารถตรวจสอบผลแบบทดสอบได้ในระบบ\n"
    : "";

  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ด้วยมีผู้สมัครงานได้ยื่นใบสมัครในตำแหน่ง ${ctx.jobTitle} ผ่านระบบ BIGJOBs
โดยมีรายละเอียดดังนี้

${detailBlock([
  ...seekerRows(ctx),
  ["วันที่สมัคร", thaiNow()],
])}
${messageBlock}${testNote}
ท่านสามารถดูโปรไฟล์และเรซูเม่ของผู้สมัครได้ที่
    ${ctx.seekerProfileLink}

และสามารถพิจารณาใบสมัคร หรือนัดหมายสัมภาษณ์ได้ในระบบ BIGJOBs ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดพิจารณา

${systemSignature()}`;

  return {
    subject: `ใบสมัครงานตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}

// ผู้สมัครตอบรับคำเชิญของบริษัท (pending → applied)
export function invitationAcceptedMail(ctx: CompanyMailContext): MailContent {
  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ตามที่บริษัทฯ ได้เชิญชวนคุณ${ctx.seekerName} ให้พิจารณาร่วมงานในตำแหน่ง ${ctx.jobTitle} นั้น
ขณะนี้ผู้สมัครได้ตอบรับความสนใจในตำแหน่งดังกล่าวเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้

${detailBlock([
  ...seekerRows(ctx),
  ["วันที่ตอบรับ", thaiNow()],
])}

ในการนี้ ขอความกรุณาท่านเข้าสู่ระบบ BIGJOBs เพื่อนัดหมายวันและเวลาสัมภาษณ์ ได้ที่
    ${ctx.platformLink}

ท่านสามารถดูโปรไฟล์และเรซูเม่ของผู้สมัครได้ที่
    ${ctx.seekerProfileLink}

จึงเรียนมาเพื่อโปรดดำเนินการต่อไป

${systemSignature()}`;

  return {
    subject: `ผู้สมัครตอบรับคำเชิญ ตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}

// ผู้สมัครยืนยันเข้าร่วมสัมภาษณ์ (screening → interview)
export function interviewConfirmedMail(
  ctx: CompanyMailContext,
  interviewAt: { date: string; time: string } | null,
): MailContent {
  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ตามที่บริษัทฯ ได้นัดหมายคุณ${ctx.seekerName} เข้ารับการสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} นั้น
ผู้สมัครได้ยืนยันการเข้าร่วมสัมภาษณ์ตามวันและเวลาที่บริษัทฯ กำหนดเรียบร้อยแล้ว ดังนี้

${detailBlock([
  ...seekerRows(ctx),
  [
    "วันและเวลาสัมภาษณ์",
    interviewAt ? formatThaiDateTime(interviewAt.date, interviewAt.time) : null,
  ],
])}

ท่านสามารถตรวจสอบรายละเอียดนัดหมายได้ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดทราบ

${systemSignature()}`;

  return {
    subject: `ผู้สมัครยืนยันเข้าร่วมสัมภาษณ์ ตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}

// ผู้สมัครขอเลื่อนนัด (→ reschedule)
export function rescheduleRequestMail(
  ctx: CompanyMailContext,
  request: {
    oldDate: { date: string; time: string } | null;
    newDate: string;
    newTime: string;
    reason: string;
  },
): MailContent {
  const oldText = request.oldDate
    ? formatThaiDateTime(request.oldDate.date, request.oldDate.time)
    : null;

  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ตามที่บริษัทฯ ได้นัดหมายคุณ${ctx.seekerName} เข้ารับการสัมภาษณ์งานในตำแหน่ง ${ctx.jobTitle} นั้น
ผู้สมัครมีความประสงค์ขอเลื่อนวันและเวลาสัมภาษณ์ โดยมีรายละเอียดดังนี้

${detailBlock([
  ...seekerRows(ctx),
  ["วันนัดเดิม", oldText],
  ["วันที่ขอเลื่อนเป็น", formatThaiDateTime(request.newDate, request.newTime)],
  ["เหตุผล", request.reason],
])}

ในการนี้ ขอความกรุณาท่านเข้าสู่ระบบ BIGJOBs เพื่อตกลงตามวันและเวลาที่ผู้สมัครเสนอ
หรือกำหนดวันและเวลาสัมภาษณ์ใหม่ ได้ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดพิจารณา

${systemSignature()}`;

  return {
    subject: `ผู้สมัครขอเลื่อนวันสัมภาษณ์ ตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}

// ผู้สมัครตอบรับข้อเสนองาน (→ hired)
export function offerAcceptedMail(ctx: CompanyMailContext): MailContent {
  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ตามที่บริษัทฯ ได้ส่งข้อเสนอการจ้างงานในตำแหน่ง ${ctx.jobTitle} ให้แก่คุณ${ctx.seekerName} นั้น
ผู้สมัครได้ตอบรับข้อเสนอการจ้างงานเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้

${detailBlock([
  ...seekerRows(ctx),
  ["วันที่ตอบรับ", thaiNow()],
])}

ในการนี้ ขอความกรุณาท่านติดต่อผู้สมัครโดยตรง เพื่อแจ้งรายละเอียดการเริ่มงาน ได้แก่
วันเริ่มงาน สถานที่ปฏิบัติงาน และเอกสารที่ต้องจัดเตรียม

ท่านสามารถตรวจสอบรายละเอียดได้ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดดำเนินการต่อไป

${systemSignature()}`;

  return {
    subject: `ผู้สมัครตอบรับข้อเสนองาน ตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}

export type DeclineStage = "invitation" | "interview" | "offer";

const DECLINE_TEXT: Record<
  DeclineStage,
  { reference: string; action: string; subject: string }
> = {
  invitation: {
    reference: "ได้เชิญชวนคุณ{name} ให้พิจารณาร่วมงานในตำแหน่ง {job}",
    action: "ผู้สมัครได้แจ้งปฏิเสธคำเชิญดังกล่าว",
    subject: "ผู้สมัครปฏิเสธคำเชิญ",
  },
  interview: {
    reference: "ได้นัดหมายคุณ{name} เข้ารับการสัมภาษณ์งานในตำแหน่ง {job}",
    action: "ผู้สมัครได้แจ้งปฏิเสธการเข้าร่วมสัมภาษณ์",
    subject: "ผู้สมัครปฏิเสธการสัมภาษณ์",
  },
  offer: {
    reference: "ได้ส่งข้อเสนอการจ้างงานในตำแหน่ง {job} ให้แก่คุณ{name}",
    action: "ผู้สมัครได้แจ้งปฏิเสธข้อเสนอการจ้างงานดังกล่าว",
    subject: "ผู้สมัครปฏิเสธข้อเสนองาน",
  },
};

// ผู้สมัครปฏิเสธเอง (→ reject) ข้อความตามขั้นตอนที่ปฏิเสธ: คำเชิญ / นัดสัมภาษณ์ / ข้อเสนองาน
export function seekerDeclinedMail(
  ctx: CompanyMailContext,
  stage: DeclineStage,
): MailContent {
  const text = DECLINE_TEXT[stage];
  const reference = text.reference
    .replace("{name}", ctx.seekerName)
    .replace("{job}", ctx.jobTitle);

  const body = `เรียน ฝ่ายทรัพยากรบุคคล ${ctx.companyName}

ตามที่บริษัทฯ ${reference} นั้น
${text.action} โดยมีรายละเอียดดังนี้

${detailBlock([
  ...seekerRows(ctx),
  ["วันที่แจ้งปฏิเสธ", thaiNow()],
])}

ท่านสามารถพิจารณาผู้สมัครรายอื่นสำหรับตำแหน่งนี้ได้ในระบบ BIGJOBs ที่
    ${ctx.platformLink}

จึงเรียนมาเพื่อโปรดทราบ

${systemSignature()}`;

  return {
    subject: `${text.subject} ตำแหน่ง ${ctx.jobTitle} – คุณ${ctx.seekerName}`,
    body,
  };
}
