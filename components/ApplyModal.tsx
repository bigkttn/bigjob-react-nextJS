'use client';

import { useEffect, useState } from 'react';
import styles from './ApplyModel.module.css';

interface jobOption {
  post_id: number;
  job_position: string;
}

interface ContactModalProps {
  mode: 'apply' | 'invite'; // 'apply' = ผู้สมัครกดสมัคร, 'invite' = บริษัทกดทักหา
  isOpen: boolean;
  onClose: () => void;
  postId?: number;
  userId: number;
  companyId?: number;
  seekerEmail: string;
  seekerName: string;
  companyName: string;
  companyEmail: string;
  jobTitle?: string;
  companyJobs: jobOption[];
}

export default function ApplyModal({
  mode,
  isOpen,
  onClose,
  postId,
  userId,
  companyName,
  seekerName,
  jobTitle,
  seekerEmail,
  companyEmail,
  companyJobs = [],
}: ContactModalProps) {
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(postId);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(jobTitle || '');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  // const indent = "\u00A0".repeat(109);

  // 🟢 ฟังก์ชันสร้าง Template ข้อความ
  const generateMessage = (currentJobTitle: string) => {
    if (mode === 'apply') {
      return `เรียน ฝ่ายทรัพยากรบุคคล (HR) บริษัท ${companyName}

ข้าพเจ้า ${seekerName} มีความประสงค์ขอสมัครงานในตำแหน่ง ${currentJobTitle}

เนื่องด้วยข้าพเจ้า มีความสนใจในสายงานนี้ และเชื่อมั่นว่าทักษะ รวมถึงประสบการณ์ที่มีจะสามารถนำมาประยุกต์ใช้เพื่อร่วมสร้างประโยชน์ให้แก่องค์กรของท่านได้เป็นอย่างดี

ทั้งนี้ หากต้องการข้อมูลเพิ่มเติมหรือประสงค์นัดสัมภาษณ์งาน สามารถติดต่อกลับได้ผ่านอีเมลนี้

ขอแสดงความนับถือ
${seekerName}`;
    } else {
      return `เรียนคุณ ${seekerName}

  ทางบริษัท ${companyName} ได้รับชมโปรไฟล์ของคุณแล้ว มีความสนใจในประสบการณ์และทักษะของคุณเป็นอย่างมาก 

  จึงขอเรียนเชิญคุณ ${seekerName} มาสัมภาษณ์ในตำแหน่ง ${currentJobTitle}

จึงขออนุญาตติดต่อเพื่อสอบถามความสนใจ และเรียนเชิญพูดคุยรายละเอียดเกี่ยวกับโอกาสในการมาร่วมงานกับเราค่ะ

ทั้งนี้ หากสะดวก สามารถติดต่อกลับได้ผ่านอีเมลนี้ค่ะ 

ขอแสดงความนับถือ
ฝ่ายทรัพยากรบุคคล ${companyName}`;
    }
  };


  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPostId = Number(e.target.value);
    setSelectedPostId(newPostId);

    // 1. ค้นหา Job ที่ถูกเลือก
    const selectedJob = companyJobs.find(
      (job: any) => Number(job.post_id || job.id) === newPostId
    );

    const newTitle = selectedJob?.job_position || (selectedJob as any)?.title || '';
    setSelectedJobTitle(newTitle);

    // 2. ถ้าเป็น Mode Invite ให้อัปเดต Template ข้อความใหม่ทันที
    if (mode === 'invite' && newTitle) {
      setMessage(generateMessage(newTitle));
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const initialPostId = postId || (companyJobs.length > 0 ? companyJobs[0].post_id : undefined);
    const initialJobTitle =
      jobTitle || (companyJobs.length > 0 ? companyJobs[0].job_position : '');

    setSelectedPostId(initialPostId);
    setSelectedJobTitle(initialJobTitle);

  
    setMessage(generateMessage(initialJobTitle));
  }, [isOpen, postId, jobTitle, companyName, seekerName, mode, companyJobs]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    const endpoint =
      mode === 'apply'
        ? '/api/interview_tracking/apply-company'
        : '/api/interview_tracking/invite-seeker';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPostId,
          userId,
          companyName,
          seekerName,
          jobTitle: selectedJobTitle,
          seekerEmail,
          companyEmail,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการส่ง');
      }

      setStatusMsg({
        type: 'success',
        text: mode === 'apply' ? 'ส่งใบสมัครสำเร็จแล้ว!' : 'ส่งข้อความเชิญชวนสำเร็จแล้ว!',
      });

      // ปิด modal หลังส่งสำเร็จ 1.5 วินาที
      setTimeout(() => {
        onClose();
        setStatusMsg({ type: '', text: '' });
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const titleText =
    mode === 'apply'
      ? `สมัครงานตำแหน่ง ${jobTitle || ''}`
      : `ส่งข้อความติดต่อคุณ ${seekerName}`;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h3 className={styles.modalTitle}>{titleText}</h3>

        {statusMsg.text && (
          <div
            className={`${styles.statusAlert} ${
              statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGroup}>
          {mode === 'invite' && companyJobs.length > 0 && (
            <div className={styles.formItem} style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                เลือกตำแหน่งงานที่ต้องการเสนอ
              </label>
              <select
                value={selectedPostId || ''}
                onChange={handleJobChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                }}
              >
                <option value="" disabled>
                  เลือกตำแหน่งงาน
                </option>
                {companyJobs.map((job) => (
                  <option value={job.post_id} key={job.post_id}>
                    {job.job_position}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formItem}>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.btnCancel}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.btnSubmit}
            >
              {loading ? 'กำลังส่ง...' : mode === 'apply' ? 'ส่งใบสมัคร' : 'ส่งข้อความ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}