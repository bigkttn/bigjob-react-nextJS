import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import styles from "./seekerProfile.module.css";
import FilePreviewButton from "./FilePreviewButton";
import BackButton from "./BackButton";
import ProfileActionsButton from "./ProfileActionsButton";
import AdminButton from "./adminbutton";
interface CustomJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

async function getSeekerProfile(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/user/getUserById/${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

const fmt = (val: any) =>
  val !== null && val !== undefined ? String(val) : "-";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default async function SeekerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  // console.log(viewer);
  // if (viewer.role === "admin") {
  //   console.log(1);
  // }
  const profile = await getSeekerProfile(id);

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
    <div className={styles.container}>
      {/* ── ปุ่มย้อนกลับ ── */}
      <div className={styles.backRow}>
        <BackButton />
      </div>
      <div
        style={{
          position: "absolute",
        }}
      >
        {viewer.role === "admin" && (
          <AdminButton
            user_id={id}
            role={viewer.role}
            id={viewer.id.toString()}
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
              Personal Information
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
                userId={Number(id)}
                companyId={Number(viewer?.id)}
              />
            </div>
          </div>
          <div className={styles.personalInfoContent}>
            <div className={styles.avatarWrapper}>
              <img
                src={profile.profile_image ?? "/assets/images/seeker.jpg"}
                alt="avatar"
                className={styles.avatar}
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
                <strong>About</strong>
              </div>
              {[
                { label: "Gender", value: profile.gender },
                { label: "Military Status", value: profile.military_status },
                {
                  label: "Date of Birth",
                  value: formatDate(profile.date_of_birth),
                },
                { label: "Nationality", value: profile.nationality },
                { label: "Religion", value: profile.religion },
                { label: "Weight (Kg)", value: profile.weight },
                { label: "Height (Cm)", value: profile.height },
                { label: "Disability", value: profile.disability_status },
                { label: "Marital", value: profile.marital_status },
                { label: "Mobile", value: profile.mobile_phone },
              ].map((item) => (
                <div className={styles.infoRow} key={item.label}>
                  <strong>{item.label}:</strong> {fmt(item.value)}
                </div>
              ))}

              <div
                className={styles.titleinfoRow}
                style={{ marginTop: "12px" }}
              >
                <strong>Contact</strong>
              </div>
              {[
                { label: "Line ID", key: "line_id" },
                { label: "Country", key: "country" },
                // { label: "Address", key: "address" },
                { label: "Province", key: "province" },
                { label: "District", key: "district" },
                { label: "Sub District", key: "sub_district" },
                // { label: "Postal Code", key: "postal_code" },
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
          <div className={styles.cardHeader}>Job Preferences</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Job Title</h4>
              <ol className={styles.plainList}>
                {profile.job_titles?.map((job: any, i: number) => (
                  <li key={i}>{fmt(job.job_name)}</li>
                ))}
              </ol>
            </section>

            <section className={styles.section}>
              <h4>Type Of Work</h4>
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
                      typeOfWorkList.includes(t) ? styles.tagActive : styles.tag
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h4>Desired Salary</h4>
              <p>{fmt(profile.desired_salary)} baht</p>
            </section>

            <section className={styles.Educontainer}>
              <h4 style={{ marginBottom: "1rem" }}>Education</h4>
              <div className={styles.timeline}>
                <div className={styles.centralLine} />
                {profile.educations?.map((item: any, index: number) => (
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
          <div className={styles.cardHeader}>Skills</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Specific Skills</h4>
              <ol className={styles.plainList}>
                {profile.skills?.map((s: any, i: number) => (
                  <li key={i}>{fmt(s.skill_name)}</li>
                ))}
              </ol>
            </section>

            <section className={styles.section}>
              <h4>Typing Speed</h4>
              {profile.typing_speeds?.map((t: any, i: number) => (
                <ul key={i} className={styles.plainUl}>
                  <li>
                    <strong>{fmt(t.typing_language)}</strong>
                  </li>
                  <li className={styles.setLi}>{fmt(t.typing_wpm)} WPM</li>
                </ul>
              ))}
            </section>

            <section className={styles.section}>
              <h4>Projects & Experiences</h4>
              {profile.experiences?.map((exp: any, i: number) => (
                <ul key={i} className={styles.plainUl}>
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
          </div>
        </div>

        {/* ── Column 4: Files ── */}
        <div className={styles.columnTransparent}>
          <div className={styles.fileGroup}>
            {["transcript", "resume", "portfolio", "certificate"].map((cat) => {
              const files: any[] = (profile.files ?? []).filter(
                (f: any) => f.file_category?.toLowerCase() === cat,
              );
              return (
                <div key={cat} className={styles.fileItem}>
                  <label style={{ textTransform: "lowercase" }}>
                    {cat} ({files.length})
                  </label>
                  <div className={styles.fileList}>
                    {files.length === 0 && (
                      <p className={styles.noFile}>No files</p>
                    )}
                    {files.map((file: any) => {
                      const shortName =
                        file.file_name?.length > 15
                          ? file.file_name.substring(0, 13) + "..."
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
                            📄 {shortName}
                          </div>
                          {/* ── Client Component สำหรับ popup ── */}
                          <FilePreviewButton
                            filePath={file.file_path}
                            fileName={file.file_name}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.contactCard}>
            <h3>Contact</h3>
            <button className={styles.sentBtn}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
