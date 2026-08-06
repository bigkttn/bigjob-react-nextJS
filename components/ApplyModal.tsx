'use client';

import { useEffect, useState } from 'react';
import styles from './ApplyModel.module.css'

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId:number;
  userId:number;
  seekerEmail:string;
  seekerName:string;
  companyName: string;
  companyEmail: string;
  jobTitle: string;
}

export default function ApplyModal({
  isOpen,
  onClose,
  postId,
  userId,
  companyName, 
  seekerName,
  jobTitle,
  seekerEmail,
  companyEmail
  
}: ApplyModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
 const indent = "\u00A0".repeat(109);
  useEffect(() => {
    if (isOpen) {
      setMessage(`เรียน ฝ่ายทรัพยากรบุคคล (HR) บริษัท ${companyName || 'invaild company name'}

ข้าพเจ้า ${seekerName || 'invaild seeker name'} มีความประสงค์ขอสมัครงานในตำแหน่ง ${jobTitle || 'invaild job Title'}

เนื่องด้วยข้าพเจ้า มีความสนใจในสายงานนี้ และเชื่อมั่นว่าทักษะ รวมถึงประสบการณ์ที่มีจะสามารถนำมาประยุกต์ใช้เพื่อร่วมสร้างประโยชน์ให้แก่องค์กรของท่านได้เป็นอย่างดี

ทั้งนี้ หากต้องการข้อมูลเพิ่มเติมหรือประสงค์นัดสัมภาษณ์งาน สามารถติดต่อกลับได้ผ่านอีเมลนี้

${indent}ขอแสดงความนับถือ
${indent}${seekerName || 'invalid seeker name'}`);
    }},[isOpen, companyName, seekerName,jobTitle,seekerEmail,companyEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/interview_tracking/apply-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        postId:postId,
        userId:userId,
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
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

      setStatusMsg({ type: 'success', text: 'ส่งใบสมัครสำเร็จแล้ว!' });
      
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

 return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h3 className={styles.modalTitle}>สมัครงานตำแหน่ง {jobTitle}</h3>

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
              rows={4}
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
              {loading ? 'กำลังส่ง...' : 'ส่งใบสมัคร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}