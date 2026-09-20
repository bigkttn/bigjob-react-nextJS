import { cookies } from "next/headers";
import Image from "next/image";
import jwt, { JwtPayload } from "jsonwebtoken";
import styles from "./seekerProfile.module.css";
import FilePreviewButton from "./FilePreviewButton";
import BackButton from "./BackButton";
import ProfileActionsButton from "./ProfileActionsButton";
import AdminButton from "./adminbutton";
import BanPopup from "./BanPopup";
import ApplySeeker from "./apply-seeker";
import { apiUrl } from "@/lib/hostURL";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
  company_name: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Education {
  level?: unknown;
  major?: unknown;
  institution?: unknown;
  year_start?: unknown;
  year_end?: unknown;
}

interface Skills {
  skill_name?: unknown;
}

interface TypingSpeed {
  typing_language?: unknown;
  typing_wpm?: unknown;
}

interface Experiences {
  ex_title?: unknown;
  ex_description?: unknown;
  start_date?: string | null;
  end_date?: string | null;
}
interface Language {
  language_type?: string;
  test_name?: string | null;
  level?: string | null;
  score?: number | 0;
}

interface FileRecord {
  file_id?: string | number;
  file_name?: string;
  file_category?: string;
  file_path?: string;
}

interface CompanyProfile {
  company_name?: string | null;
}

async function getSeekerProfile(userId: string) {
  const res = await fetch(`${apiUrl}/api/user/getUserById/${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.company ?? data.user ?? null;
}

async function getCompanyProfile(companyId: number, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Cookie = `session=${token}`;
  }

  const res = await fetch(`${apiUrl}/api/company/getCompanyById/${companyId}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.company ?? data.user ?? data.data ?? data;
}

const fmt = (val: unknown) =>
  val !== null && val !== undefined ? String(val) : "-";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default async function SeekerProfilePage({ params }: PageProps) {
  const Param = await params;
  const userId = Param.id;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let viewer: CustomJwtPayload | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      viewer = jwt.verify(token, secret) as CustomJwtPayload;
    } catch {
      console.error("Token invalid");
    }
  }

  if (!viewer) {
    return (
      <div className={styles.centerMsg}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }
  const isAdmin = viewer?.role === "admin" || viewer?.role === "superadmin";
  const profile = await getSeekerProfile(userId);

  let company: CompanyProfile | null = null;
  let jobTitle = "";
  let postId: number | null = null;
  let companyJobs = [];

  if (viewer?.id) {
    company = await getCompanyProfile(viewer.id, token);
    try {
      const postRes = await fetch(
        `${apiUrl}/api/posts/getPostbyCompanyId?company_id=${viewer.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session=${token}`,
          },
          cache: "no-store",
        },
      );

      if (postRes.ok) {
        const reponseData = await postRes.json();
        companyJobs = Array.isArray(reponseData) ? reponseData : [];

        const firstPost = companyJobs[0];

        if (firstPost) {
          jobTitle = firstPost.job_position || firstPost.post_title || "";

          const foundId =
            firstPost.post_id ??
            firstPost.id ??
            firstPost.postId ??
            firstPost._id;
          postId = foundId ? Number(foundId) : null;
        }
      }
    } catch (error) {
      console.error("Fetch Seeker error:", error);
    }
  }

  if (!profile) {
    return (
      <div className={styles.centerMsg}>
        <p>ไม่พบข้อมูลโปรไฟล์</p>
      </div>
    );
  }

  const typeOfWorkList: string[] = profile.type_of_work
    ? profile.type_of_work.split(",").map((s: string) => s.trim())
    : [];

  return (
    <div>
      {isAdmin && (
        <h1
          style={{
            color: "red",
            fontWeight: "bold",
            fontSize: "1.50rem",
            textAlign: "center",
            backgroundColor: "#ffe6e6",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          โหมดแอดมิน
        </h1>
      )}
      <div className={styles.container}>
        {/* ── ปุ่มย้อนกลับ ── */}
        {/* ── ปุ่มย้อนกลับ และ ปุ่ม Admin ── */}
        <BanPopup profile={profile} isAdmin={isAdmin}></BanPopup>
        <div
          className={styles.backRow}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px", // ปรับระยะห่างด้านล่างตามความเหมาะสม
          }}
        >
          <BackButton />

          {viewer.role === "admin" && (
            <AdminButton
              user_id={userId}
              role={viewer.role}
              id={viewer.id.toString()}
              banned_until={profile.banned_until}
            />
          )}
        </div>
        <div className={styles.profileGrid}>
          {/* ── Column 1: Personal Info ── */}
          <div className={styles.column}>
            <div
              className={styles.cardHeader}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                position: "relative", // เพิ่มความปลอดภัยในการจัดตำแหน่ง
              }}
            >
              {/* 1. สร้างกล่องว่างขึ้นมาฝั่งซ้าย เพื่อถ่วงน้ำหนักให้ข้อความอยู่ตรงกลางพอดี */}
              <div style={{ width: "24px" }}></div>

              {/* 2. ข้อความหัวข้อจะอยู่ตรงกลาง */}
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                ข้อมูลส่วนตัว
              </span>

              {/* 3. ปุ่มสามจุดจะถูกดันไปชิดขวาสุดพอดี */}
              <div
                style={{
                  width: "24px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <ProfileActionsButton
                  userId={Number(userId)}
                  companyId={Number(viewer?.id)}
                />
              </div>
            </div>
            <div className={styles.personalInfoContent}>
              <div className={styles.avatarWrapper}>
                <Image
                  src={
                    profile.profile_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullname || "User")}&background=random`
                  }
                  alt="avatar"
                  className={styles.avatar}
                  width={150}
                  height={150}
                  priority
                  unoptimized
                />
              </div>
              <strong>
                <h2 className={styles.name}>{fmt(profile.fullname)}</h2>
              </strong>
              <strong>
                <p className={styles.email}>{fmt(profile.email)}</p>
              </strong>

              <div className={styles.detailsBox}>
                <div className={styles.titleinfoRow}>
                  <strong>เกี่ยวกับ</strong>
                </div>
                {[
                  { label: "เพศ", value: profile.gender },
                  { label: "สถานะทางทหาร", value: profile.military_status },
                  {
                    label: "วันเกิด",
                    value: formatDate(profile.date_of_birth),
                  },
                  { label: "สัญชาติ", value: profile.nationality },
                  { label: "ศาสนา", value: profile.religion },
                  { label: "น้ำหนัก (กก.)", value: profile.weight },
                  { label: "ส่วนสูง (ซม.)", value: profile.height },
                  { label: "ความพิการ", value: profile.disability_status },
                  { label: "สถานภาพการสมรส", value: profile.marital_status },
                  { label: "เบอร์โทรศัพท์", value: profile.mobile_phone },
                ].map((item) => (
                  <div className={styles.infoRow} key={item.label}>
                    <strong>{item.label}:</strong> {fmt(item.value)}
                  </div>
                ))}

                <div
                  className={styles.titleinfoRow}
                  style={{ marginTop: "12px" }}
                >
                  <strong>ช่องทางการติดต่อ</strong>
                </div>
                {[
                  { label: "Line ID", key: "line_id" },
                  { label: "ประเทศ", key: "country" },
                  { label: "จังหวัด", key: "province" },
                  { label: "อำเภอ/เขต", key: "district" },
                  { label: "ตำบล/แขวง", key: "sub_district" },
                ].map((item) => (
                  <div className={styles.infoRow} key={item.key}>
                    <strong>{item.label}:</strong> {fmt(profile[item.key])}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 2: Job Preferences ── */}
          <div className={styles.column}>
            <div className={styles.cardHeader}>ความต้องการในการทำงาน</div>
            <div className={styles.contentPadding}>
              <section className={styles.section}>
                <h4>ตำแหน่งงานที่สนใจ</h4>
                <ol className={styles.plainList}>
                  {profile.job_titles?.map(
                    (job: { job_name: string }, i: number) => (
                      <li key={i}>{fmt(job.job_name)}</li>
                    ),
                  )}
                </ol>
              </section>

              <section className={styles.section}>
                <h4>รูปแบบการทำงาน</h4>
                <div className={styles.tagGroup}>
                  {[
                    "Full-time",
                    "Freelance",
                    "Part-time",
                    "Internship",
                    "Contract",
                  ].map((t) => (
                    <span
                      key={t}
                      className={
                        typeOfWorkList.includes(t)
                          ? styles.tagActive
                          : styles.tag
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h4>เงินเดือนที่ต้องการ (บาท)</h4>
                <p>{fmt(profile.desired_salary)} บาท</p>
              </section>

              <section className={styles.Educontainer}>
                <h4 style={{ marginBottom: "1rem" }}>ประวัติการศึกษา</h4>
                <div className={styles.timeline}>
                  <div className={styles.centralLine} />
                  {profile.educations?.map((item: Education, index: number) => (
                    <div
                      key={index}
                      className={`${styles.timelineItem} ${index % 2 === 0 ? styles.left : styles.right}`}
                    >
                      <div className={styles.content}>
                        <p className={styles.level}>{fmt(item.level)}</p>
                        <h4 className={styles.degree}>{fmt(item.major)}</h4>
                        <p className={styles.school}>{fmt(item.institution)}</p>
                        <p>
                          {fmt(item.year_start)} – {fmt(item.year_end)}
                        </p>
                      </div>
                      <div className={styles.connector} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* ── Column 3: Skills ── */}
          <div className={styles.column}>
            <div className={styles.cardHeader}>ทักษะความสามารถ</div>
            <div className={styles.contentPadding}>
              <section className={styles.section}>
                <h4>ทักษะเฉพาะทาง</h4>
                <ol className={styles.plainList}>
                  {profile.skills?.map((s: Skills, i: number) => (
                    <li key={i}>{fmt(s.skill_name)}</li>
                  ))}
                </ol>
              </section>

              <section className={styles.section}>
                <h4>ความเร็วในการพิมพ์</h4>
                {profile.typing_speeds?.map((t: TypingSpeed, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem", listStyle: "none", paddingLeft: 0 }}>
                    <li>
                      <strong>{fmt(t.typing_language)}</strong>
                    </li>
                    <li>- {fmt(t.typing_wpm)} คำ/นาที (WPM)</li>
                  </ul>
                ))}
              </section>

              <section className={styles.section}>
                <h4>โปรเจกต์ & ประวัติการทำงาน</h4>
                {profile.experiences?.map((exp: Experiences, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem", listStyle: "none", paddingLeft: 0 }}>
                    <li>
                      – <strong>{fmt(exp.ex_title)}</strong>
                    </li>
                    <li className={styles.setLi}>{fmt(exp.ex_description)}</li>
                    <li className={`${styles.setLi} ${styles.dateText}`}>
                      {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                    </li>
                  </ul>
                ))}
              </section>

              <section className={styles.section}>
                <h4>ความสามารถทางภาษา</h4>
                {profile.languages?.map((exp: Language, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem", listStyle: "none", paddingLeft: 0 }}>
                    <li>
                      <h4>{fmt(exp.language_type)}</h4>
                    </li>
                    <li>- {fmt(exp.level)}</li>
                    {(exp.test_name || exp.score) && (
                      <li>
                        - {fmt(exp.test_name)}
                        {exp.score ? `: ${fmt(exp.score)}` : ""}
                      </li>
                    )}
                  </ul>
                ))}
              </section>
            </div>
          </div>

          {/* ── Column 4: Files ── */}
          <div className={styles.columnTransparent}>
            <div className={styles.fileGroup}>
              {[
                { cat: "transcript", label: "ใบรายงานผลการเรียน" },
                { cat: "resume", label: "เรซูเม่" },
                { cat: "portfolio", label: "แฟ้มสะสมผลงาน" },
                { cat: "certificate", label: "ใบรับรอง / เกียรติบัตร" }
              ].map(
                (item) => {
                  const files: FileRecord[] = (profile.files ?? []).filter(
                    (f: FileRecord) => f.file_category?.toLowerCase() === item.cat,
                  );
                  return (
                    <div key={item.cat} className={styles.fileItem}>
                      <label style={{ textTransform: "none", marginBottom: "10px" }}>
                        {item.label} ({files.length})
                      </label>
                      <div className={styles.fileList}>
                        {files.length === 0 && (
                          <p className={styles.noFile}>ไม่มีไฟล์</p>
                        )}
                        {files.map((file: FileRecord) => {
                          const shortName =
                            (file.file_name?.length ?? 0) > 15
                              ? (file.file_name ?? "").substring(0, 13) + "..."
                              : file.file_name || "File";
                          return (
                            <div
                              key={file.file_id}
                              className={styles.fileContainerBox}
                            >
                              <div
                                className={styles.fileNameDisplay}
                                title={file.file_name}
                              >
                                {shortName}
                              </div>
                              {/* ── Client Component สำหรับ popup ── */}
                              <FilePreviewButton
                                filePath={file.file_path ?? ""}
                                fileName={file.file_name ?? ""}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
            <div className={styles.contactCard}>
              <h3>การติดต่อ</h3>
              <ApplySeeker
                mode="invite"
                postId={Number(postId) ?? 0}
                userId={Number(userId)}
                companyId={Number(viewer.id)}
                companyName={
                  company?.company_name ||
                  viewer?.company_name ||
                  "invaid Company"
                }
                seekerName={profile.fullname || "invaid Seeker"}
                jobTitle={jobTitle || profile.job_titles?.[0]?.job_name}
                seekerEmail={profile.email || ""}
                companyEmail={viewer.email || ""}
                companyJobs={companyJobs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
