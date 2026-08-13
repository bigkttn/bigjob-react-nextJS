'use client';

import { useEffect, useState } from 'react';
import styles from './ApplyModel.module.css'

// interface ApplyModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   postId:number;
//   userId:number;
//   seekerEmail:string;
//   seekerName:string;
//   companyName: string;
//   companyEmail: string;
//   jobTitle: string;
// }

interface  jobOption{
  post_id:number;
  job_position:string;
}

interface ContactModalProps {
  mode: 'apply' | 'invite'; // 'apply' = ผู้สมัครกดสมัคร, 'invite' = บริษัทกดทักหา
  isOpen: boolean;
  onClose: () => void;
  postId?: number;           // ใส่หรือไม่ใส่ก็ได้
  userId: number;            // ID ผู้สมัคร
  companyId?: number;        // ID บริษัท (ถ้ามี)
  seekerEmail: string;
  seekerName: string;
  companyName: string;
  companyEmail: string;
  jobTitle?: string;         // ใส่หรือไม่ใส่ก็ได้
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
  companyJobs = []
}: ContactModalProps) {
  // derive initial values from props to avoid undefined identifier errors
  const initialPostId = postId;
  const initialJobTitle = jobTitle;
  // State สำหรับจัดการงานที่เลือก
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>(initialPostId);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(initialJobTitle || '');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
 const indent = "\u00A0".repeat(109);
 

 // เมื่อมีการเลือก Job ใหม่จาก Dropdown
  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = Number(e.target.value);
    const job = companyJobs.find((j) => j.post_id === pId);
    if (job) {
      setSelectedPostId(job.post_id);
      setSelectedJobTitle(job.job_position);
    }
  };

  // Sync state เมื่อ Prop เปลี่ยน
  useEffect(() => {
    if (initialPostId) setSelectedPostId(initialPostId);
    if (initialJobTitle) setSelectedJobTitle(initialJobTitle);
  }, [initialPostId, initialJobTitle]);
  
  useEffect(() => {
    if (!isOpen) return;
    if(mode === 'apply') {
      
      setMessage(`เรียน ฝ่ายทรัพยากรบุคคล (HR) บริษัท ${companyName || 'invaild company name'}

ข้าพเจ้า ${seekerName || 'invaild seeker name'} มีความประสงค์ขอสมัครงานในตำแหน่ง ${jobTitle || 'invaild job Title'}

เนื่องด้วยข้าพเจ้า มีความสนใจในสายงานนี้ และเชื่อมั่นว่าทักษะ รวมถึงประสบการณ์ที่มีจะสามารถนำมาประยุกต์ใช้เพื่อร่วมสร้างประโยชน์ให้แก่องค์กรของท่านได้เป็นอย่างดี

ทั้งนี้ หากต้องการข้อมูลเพิ่มเติมหรือประสงค์นัดสัมภาษณ์งาน สามารถติดต่อกลับได้ผ่านอีเมลนี้

${indent}ขอแสดงความนับถือ
${indent}${seekerName || 'invalid seeker name'}`);
    } else  if (mode === 'invite'){
      setMessage(`เรียนคุณ ${seekerName || 'invaild seeker name'}
     ทางบริษัท ${companyName || 'เรา companyyyName'} ได้รับชมโปรไฟล์ของคุณแล้ว มีความสนใจในประสบการณ์และทักษะของคุณเป็นอย่างมาก 

จึงขออนุญาตติดต่อเพื่อสอบถามความสนใจ และเรียนเชิญพูดคุยรายละเอียดเกี่ยวกับโอกาสในการมารร่วมงานกับเราค่ะ

ทั้งนี้หากสะดวก สามารถติดต่อกลับได้ผ่านอีเมลนี้ค่ะ

${indent}ขอแสดงความนับถือ
${indent}ฝ่ายทรัพยากรบุคคล ${companyName || 'invaild companyNameyyyyyy'}`);
      }
},[isOpen, companyName, seekerName,jobTitle,seekerEmail,companyEmail]);

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
        postId,
        userId,
        companyName,
        seekerName,
        jobTitle,
        seekerEmail,
        companyEmail,
        message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการส่ง');
      }

      setStatusMsg({ type: 'success', 
        text: mode === 'apply' ? 'ส่งใบสมัครสำเร็จแล้ว!': 'ส่งข้อความเชิญชวนสำเร็จแล้ว!', });
    
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

  const titleText = mode === 'apply'? `สมัครงานตำแหน่ง ${jobTitle || ''}` : `ส่งข้อความติดต่อคุณ ${seekerName}`;

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

          <div className={styles.formItem}>
            {/* <label>ข้อความถึง HR</label> */}
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
              {loading ? 'กำลังส่ง...' : mode === 'apply' ? 'ส่งใบสมัคร':'ส่งข้อความ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}