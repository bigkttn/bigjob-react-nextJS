'use client';

import { useEffect, useState } from 'react';
import styles from './applySeeker.module.css';
import ApplyModal from '@/components/ApplyModal';
import { apiUrl } from '@/lib/hostURL';
import { useRouter } from 'next/navigation';

interface ContactModalProps {
  mode: 'apply' | 'invite';
  postId: number;
  userId: number;
  companyId: number;
  companyName: string;
  seekerName: string;
  jobTitle: string;
  seekerEmail: string;
  companyEmail: string;
  companyJobs?: any[];
}

export default function ApplySeeker({
  mode,
  postId,
  userId,
  companyId,
  companyName,
  seekerName,
  jobTitle,
  seekerEmail,
  companyEmail,
  companyJobs = [],
}: ContactModalProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);

  useEffect(() => {
    if (userId && postId) {
      checkApplied();
    }
  }, [userId, postId]);

  const checkApplied = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/company/check_interview_company/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: Number(userId),
          post_id: Number(postId),
        }),
      });

      const data = await response.json();
      console.log('Check Applied Response:', data);

      const isExist =
        (Array.isArray(data) && data.length > 0) ||
        Boolean(data?.exists) ||
        (Array.isArray(data?.rows) && data.rows.length > 0);

      setIsReported(isExist);
    } catch (error) {
      console.error('Error in checkApplied:', error);
      setIsReported(false);
    }
  };

  const handleCloseModal = () => {
     checkApplied();     
    setIsModalOpen(false); 
   
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`${styles.applyBtn} ${isReported ? styles.invitedBtn : ''}`}
          disabled={isReported}
        >
          {isReported ? 'เชิญแล้ว' : 'เชิญ'}
        </button>
      </div>

      <ApplyModal
        mode={mode}
        isOpen={isModalOpen}
       onClose={handleCloseModal}
        userId={userId}
        companyId={companyId}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
        companyJobs={companyJobs}
      />
    </main>
  );
}