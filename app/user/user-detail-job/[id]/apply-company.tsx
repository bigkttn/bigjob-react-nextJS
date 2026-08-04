'use client';

import { useState } from 'react';
import ApplyModal from '@/components/ApplyModal';
import styles from './applyCompany.module.css'

interface ApplyCompanyProps {
  companyName:string,
  seekerName:string,
  jobTitle:string,
  seekerEmail:string,
  companyEmail:string
}

export default function ApplyCompany({
  companyName,
   seekerName,
   jobTitle,
   seekerEmail,
   companyEmail
  }:ApplyCompanyProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
// LOG ตรวจสอบค่าที่ส่งมาจาก DetailJob
  console.log('--- ApplyCompany Props ---', {
    jobTitle,
    companyName,
    companyEmail,
    seekerName,
    seekerEmail,
  });


  

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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyName={companyName}
        seekerName={seekerName}
        jobTitle={jobTitle}
        seekerEmail={seekerEmail}
        companyEmail={companyEmail}
      />

      
    </main>
  );
}