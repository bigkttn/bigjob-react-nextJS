"use client";
import ProvinceSelect from "@/components/ProvinceSelect";
import styles from "./companyEditForm.module.css";

type FieldValue = string | number | null | undefined;

interface CompanyEditFormProps {
  form: Record<string, FieldValue>;
  email: string;
  onChange: (field: string, value: string) => void;
}

const text = (value: FieldValue) => (value ?? "").toString();

// ฟอร์มแก้ไขโปรไฟล์บริษัท แบ่งเป็น 3 หมวด: ข้อมูลบริษัท / ผู้ติดต่อ / ที่ตั้ง
export default function CompanyEditForm({
  form,
  email,
  onChange,
}: CompanyEditFormProps) {
  return (
    <div className={styles.form}>
      {/* ── ข้อมูลบริษัท ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined">apartment</span>
          ข้อมูลบริษัท
        </h3>

        <div className={styles.field}>
          <label htmlFor="company_name" className={styles.label}>
            ชื่อบริษัท <span className={styles.required}>*</span>
          </label>
          <input
            id="company_name"
            type="text"
            className={`${styles.input} ${styles.nameInput}`}
            placeholder="เช่น บริษัท บิ๊กจ๊อบส์ จำกัด"
            value={text(form.company_name)}
            onChange={(e) => onChange("company_name", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="brief_history" className={styles.label}>
            เกี่ยวกับบริษัท
          </label>
          <textarea
            id="brief_history"
            className={`${styles.input} ${styles.textarea}`}
            placeholder="แนะนำบริษัทสั้น ๆ เช่น ทำธุรกิจอะไร ก่อตั้งเมื่อไร วัฒนธรรมองค์กร สวัสดิการเด่น"
            value={text(form.brief_history)}
            onChange={(e) => onChange("brief_history", e.target.value)}
          />
          <p className={styles.hint}>ผู้หางานจะเห็นข้อความนี้ในหน้าบริษัท</p>
        </div>
      </section>

      {/* ── ผู้ติดต่อ ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined">contact_phone</span>
          ผู้ติดต่อ
        </h3>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="contact_information" className={styles.label}>
              ชื่อผู้ติดต่อ (HR / ผู้ประสานงาน)
            </label>
            <input
              id="contact_information"
              type="text"
              className={styles.input}
              placeholder="เช่น คุณสมชาย ใจดี"
              value={text(form.contact_information)}
              onChange={(e) => onChange("contact_information", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="mobile_phone" className={styles.label}>
              เบอร์โทรศัพท์
            </label>
            <input
              id="mobile_phone"
              type="tel"
              inputMode="tel"
              className={styles.input}
              placeholder="เช่น 0812345678"
              value={text(form.mobile_phone)}
              onChange={(e) => onChange("mobile_phone", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="company_email" className={styles.label}>
            อีเมล
          </label>
          <div className={styles.readonlyWrap}>
            <input
              id="company_email"
              type="email"
              className={`${styles.input} ${styles.readonly}`}
              value={email}
              readOnly
              disabled
            />
            <span className={`material-symbols-outlined ${styles.lockIcon}`}>
              lock
            </span>
          </div>
          <p className={styles.hint}>ใช้สำหรับเข้าสู่ระบบ แก้ไขไม่ได้</p>
        </div>
      </section>

      {/* ── ที่ตั้งบริษัท ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined">location_on</span>
          ที่ตั้งบริษัท
        </h3>

        <div className={styles.field}>
          <label htmlFor="full_address" className={styles.label}>
            รายละเอียดที่อยู่
          </label>
          <textarea
            id="full_address"
            className={`${styles.input} ${styles.textareaSmall}`}
            placeholder="เลขที่ ถนน ตำบล/แขวง อำเภอ/เขต"
            value={text(form.full_address)}
            onChange={(e) => onChange("full_address", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>จังหวัด</span>
          <ProvinceSelect
            value={text(form.province)}
            onChange={(val) => onChange("province", val)}
            inputClassName={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="company_latitude" className={styles.label}>
              ละติจูด (Latitude)
            </label>
            <input
              id="company_latitude"
              type="number"
              className={styles.input}
              placeholder="เช่น 13.7563"
              value={text(form.company_latitude)}
              onChange={(e) => onChange("company_latitude", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="company_longitude" className={styles.label}>
              ลองจิจูด (Longitude)
            </label>
            <input
              id="company_longitude"
              type="number"
              className={styles.input}
              placeholder="เช่น 100.5018"
              value={text(form.company_longitude)}
              onChange={(e) => onChange("company_longitude", e.target.value)}
            />
          </div>
        </div>
        <p className={styles.mapHint}>
          <span className="material-symbols-outlined">info</span>
          พิมพ์ตัวเลขเอง หรือคลิก/ลากหมุดบนแผนที่ด้านล่างเพื่อปักตำแหน่งบริษัท
        </p>
      </section>
    </div>
  );
}
