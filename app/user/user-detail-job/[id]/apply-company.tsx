'use client';

import { useState } from 'react';
import styles from './applyCompany.module.css'
import ApplyModal from '@/components/ApplyModal';

interface ApplyCompanyProps {
  mode?:'apply'|'invite';
  isOpen?:boolean;
  onClose?:() => void;
  postId: number,
  userId: number,
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
   companyEmail
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
  //   userId
  // });
const checkApplied = async () => {
    try {
      const response = await fetch("/api/seeker/check_report_company", {
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
        {/* <h1 className="text-3xl font-bold">{jobData.company}</h1> */}
        
        {/* ปุ่มกด Apply Now */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.applyBtn}
        >
          Apply Now
        </button>
      </div>

      {/* <p className="text-lg">Job Title: {jobData.title}</p> */}
      
      {/* เรียกใช้งาน Modal Component */}
      <ApplyModal
        mode="apply"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={Number(postId)}
        userId={userId}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
      />

      
    </main>
  );
}