'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './applySeeker.module.css';
import ApplyModal from '@/components/ApplyModal';
import { apiUrl } from '@/lib/hostURL';

interface CompanyJob {
  post_id: number;
  job_position: string;
}

interface ContactModalProps {
  mode: 'apply' | 'invite';
  postId?: number;
  userId: number;
  companyId: number;
  companyName: string;
  seekerName: string;
  jobTitle?: string;
  seekerEmail: string;
  companyEmail: string;
  companyJobs?: CompanyJob[];
}

export default function ApplySeeker({
  mode,
  postId,
  userId,
  companyId,
  companyName,
  seekerName,
  jobTitle = '',
  seekerEmail,
  companyEmail,
  companyJobs = [],
}: ContactModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActioned, setIsActioned] = useState(false);
  const [existingPostIds, setExistingPostIds] = useState<number[]>([]);

  const checkStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${apiUrl}/api/company/check-repeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: Number(userId),
          post_id: postId ? Number(postId) : undefined,
          company_id: Number(companyId),
          role: mode === 'apply' ? 'seeker' : 'company',
        }),
      });

      if (!response.ok) {
        setIsActioned(false);
        return;
      }

      const data = await response.json();

      if (data.exists && Array.isArray(data.rows)) {
        // เก็บรายชื่อ post_id ทั้งหมดที่เคยมีการสร้าง record ไว้อยู่แล้ว
        const takenPostIds = data.rows.map((item: { post_id: number | string }) => Number(item.post_id));
        setExistingPostIds(takenPostIds);

        // เช็กว่า postId ปัจจุบัน ถูกใช้ไปแล้วหรือยัง
        if (postId && takenPostIds.includes(Number(postId))) {
          setIsActioned(true);
        } else {
          setIsActioned(false);
        }
      } else {
        setIsActioned(false);
        setExistingPostIds([]);
      }
    } catch (error) {
      console.error('Error in checkStatus:', error);
      setIsActioned(false);
    }
  }, [userId, postId, companyId, mode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkStatus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId, postId, checkStatus]);

  const handleCloseModal = () => {
    void checkStatus();
    setIsModalOpen(false);
  };

  // กรองเฉพาะตำแหน่งงานที่ยังไม่เคยสมัคร/เชิญ ส่งไปให้ Modal เลือก
  const availableCompanyJobs = companyJobs.filter(
    (job) => !existingPostIds.includes(Number(job.post_id))
  );

  const getButtonText = () => {
    if (mode === 'apply') {
      return isActioned ? 'สมัครแล้ว' : 'สมัครงาน';
    }
    return isActioned ? 'เชิญแล้ว' : 'เชิญสัมภาษณ์';
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`${styles.applyBtn} ${isActioned ? styles.invitedBtn : ''}`}
          disabled={isActioned}
        >
          {getButtonText()}
        </button>
      </div>

      <ApplyModal
        mode={mode}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        postId={postId || 0}
        userId={userId}
        companyId={companyId}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
        companyJobs={availableCompanyJobs} // ส่งเฉพาะตำแหน่งที่ยังไม่ได้กด
      />
    </main>
  );
}