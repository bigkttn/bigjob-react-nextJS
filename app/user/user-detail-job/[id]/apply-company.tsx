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
  companyEmail: string
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


  useEffect(() => {
    if (userId) {
      checkApplied();
    }
  }
    , [userId, postId]);

const checkApplied = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/user/check_interview_seeker/`, {
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
          className={styles.applyBtn}
        >
          Apply Now
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.applyBtn}
          disabled={isReported} >

          {isReported ? 'Applied' : ' Apply Now'}
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
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
        companyJobs={[]}
      />

      
    </main>
  );
}