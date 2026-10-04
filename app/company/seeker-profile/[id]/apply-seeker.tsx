'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './applySeeker.module.css';
import ApplyModal from '@/components/ApplyModal';

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
  existingPostIds?: number[];
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
  existingPostIds: initialExistingPostIds = [],
}: ContactModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActioned, setIsActioned] = useState(false);
  const [existingPostIds, setExistingPostIds] = useState<number[]>(
    initialExistingPostIds.map((id) => Number(id))
  );

  const checkStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/interview_tracking/check-repeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: Number(userId),
          company_id: Number(companyId),
          post_id: postId ? Number(postId) : undefined,
        }),
      });

      if (!response.ok) {
        setIsActioned(false);
        return;
      }

      const data = await response.json();

      if (data.exists && Array.isArray(data.rows)) {
        // ดึงรายการ post_id ทั้งหมดที่เคยมีการติดต่อกันแล้ว
        const takenPostIds = data.rows.map((item: { post_id: number | string }) =>
          Number(item.post_id)
        );
        setExistingPostIds(takenPostIds);

        // คำนวณหาตำแหน่งที่บริษัทยังไม่เคยเชิญ
        const remainingJobs = companyJobs.filter(
          (job) => !takenPostIds.includes(Number(job.post_id))
        );

        if (mode === 'invite' && companyJobs.length > 0) {
          // โหมดเชิญเลือกตำแหน่งได้ในฟอร์ม: ปุ่มด้านนอกเป็นสีเทาเมื่อเชิญครบทุกตำแหน่งแล้วเท่านั้น
          // (เดิมเช็ก postId ก่อน ซึ่งเป็นโพสต์แรกของบริษัทเสมอ ทำให้กดเชิญไม่ได้ทั้งที่ยังมีตำแหน่งอื่น)
          setIsActioned(remainingJobs.length === 0);
        } else if (postId) {
          // หากดูเจาะจงเฉพาะตำแหน่ง
          setIsActioned(takenPostIds.includes(Number(postId)));
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
  }, [userId, postId, companyId, mode, companyJobs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkStatus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkStatus]);

  // ค่าเริ่มต้นในฟอร์มเชิญ: ตำแหน่งแรกที่ยังไม่เคยเชิญ/สมัคร
  const firstOpenJob =
    mode === 'invite'
      ? companyJobs.find((job) => !existingPostIds.includes(Number(job.post_id)))
      : undefined;
  const defaultPostId = firstOpenJob ? firstOpenJob.post_id : postId;
  const defaultJobTitle = firstOpenJob ? firstOpenJob.job_position : jobTitle;

  const handleCloseModal = () => {
    void checkStatus();
    setIsModalOpen(false);
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`${styles.applyBtn} ${isActioned ? styles.invitedBtn : ''}`}
          disabled={isActioned}
        >
          {isActioned ? (
            'เชิญแล้ว'
          ) : (
            <span className="text-md font-medium whitespace-nowrap">เชิญสัมภาษณ์</span>
          )}
        </button>
      </div>

      {/* 🟢 ส่ง companyJobs ทั้งหมด และเพิ่ม existingPostIds เข้าไปใน Modal */}
      <ApplyModal
        mode={mode}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        postId={defaultPostId || 0}
        userId={userId}
        companyId={companyId}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={defaultJobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
        companyJobs={companyJobs}
        existingPostIds={existingPostIds}
      />
    </main>
  );
}