'use client';

import { useEffect, useState } from 'react';
import styles from './applySeeker.module.css'
import ApplyModal from '@/components/ApplyModal';
import { apiUrl } from '@/lib/hostURL';

interface JobOption {
  post_id: number;
  job_position: string;
}

interface ContactModalProps {
  mode: 'apply' | 'invite';
  postId: number,
  userId: number,
  companyId: number;
  companyName: string,
  seekerName: string,
  jobTitle: string,
  seekerEmail: string,
  companyEmail: string
  companyJobs?: any[]
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);

  // LOG ตรวจสอบค่าที่ส่งมาจาก DetailJob
  console.log('--- InviteSeeker Props ---', {
    jobTitle,
    companyName,
    companyEmail,
    seekerName,
    seekerEmail,
    postId,
    userId,
    companyId
  });

  useEffect(() => {
    if (userId) {
      checkApplied();
    }
  }, [userId, postId]);

  // check รายการสมัครซ้ำ ทำroute แล้ว เหลือเทศ
  const checkApplied = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/company/check_favour_user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          post_id: Number(postId),
        }),
      });
      const data = await response.json();
      if (data && data.rows && data.rows.length > 0) {
        setIsReported(true);
      } else {
        setIsReported(false);
      }
    } catch (error) {
      console.error("Error in checkSaved:", error);
    }
  };



  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">

        {/* ปุ่มกด Apply Now */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.applyBtn}
          disabled={isReported} >

          {isReported ? 'Invited' : 'Sent'}
        </button>
      </div>

      {/* <p className="text-lg">Job Title: {jobData.title}</p> */}

      {/* เรียกใช้งาน Modal Component */}
      <ApplyModal
        mode={mode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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