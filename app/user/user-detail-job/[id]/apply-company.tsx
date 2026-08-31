'use client';

import { useEffect, useState } from 'react';
import styles from './applyCompany.module.css'
import ApplyModal from '@/components/ApplyModal';
import { apiUrl } from '@/lib/hostURL';

interface ApplyCompanyProps {
  mode?:'apply'|'invite';
  isOpen?:boolean;
  onClose?:() => void;
  postId: number,
  userId: number,
  companyId:number,
  companyName: string,
  seekerName: string,
  jobTitle: string,
  seekerEmail: string,
  companyEmail: string,
  existingPostIds?: number[];
  
}

export default function ApplyCompany({
  postId,
  userId,
  companyName,
   seekerName,
   jobTitle,
   seekerEmail,
   companyEmail,
   companyId
  }:ApplyCompanyProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);
// LOG ตรวจสอบค่าที่ส่งมาจาก DetailJob
  // console.log('--- ApplyCompany Props ---', {
  //   jobTitle,
  //   companyName,
  //   companyEmail,
  //   seekerName,
  //   seekerEmail,
  //   postId,
  //   userId,
  //   companyId,
  // });
  
  const checkApplied = async () => {
    if(!userId || !postId) return;
    try {
      const response = await fetch(`${apiUrl}/api/interview_tracking/check-repeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          post_id: Number(postId),
        }),
      });

      if(!response.ok){
        console.error("API Error Status:",response.status);
      }

      const text = await response.text();
    const data = text ? JSON.parse(text) : {};
     
      console.log("Check Applied Response:", data);

      const isAlreadyApplied = 
        Boolean(data?.exists) || 
        (Array.isArray(data?.rows) && data.rows.length > 0) ||
        (Array.isArray(data?.data) && data.data.length > 0);

      setIsReported(isAlreadyApplied);

    } catch (error) {
      console.error("Error in checkSaved:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const timeoutId = window.setTimeout(() => {
      void checkApplied();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId, postId]);

  const handleCloseModal = () => {
     checkApplied();     
    setIsModalOpen(false); 
   
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        {/* <h1 className="text-3xl font-bold">{jobData.company}</h1> */}
        
        {/* ปุ่มกด Apply Now */}
        
       <button
          onClick={() => setIsModalOpen(true)}
          className={`${styles.applyBtn} ${isReported ? styles.invitedBtn : ''}`}
          disabled={isReported}
        >
          {isReported ? 'สมัครแล้ว' : 'สมัคร'}
        </button>
      </div>

      {/* <p className="text-lg">Job Title: {jobData.title}</p> */}
      
      {/* เรียกใช้งาน Modal Component */}
      <ApplyModal
        mode="apply"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        postId={Number(postId)}
        userId={userId}
        companyId={companyId}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
        companyJobs={[]}
        existingPostIds={[]}
      />

      
    </main>
  );
}