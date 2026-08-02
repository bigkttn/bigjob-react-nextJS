'use client';

import { useState } from 'react';
import ApplyModal from '@/components/ApplyModal';
import styles from './applyCompany.module.css'

export default function JobDetailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock ข้อมูลตำแหน่งงาน (ในงานจริงอาจมาจาก API/Database)
  const jobData = {
    title: 'job',
    company: 'company',
    email: 'mail',
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{jobData.company}</h1>
        
        {/* ปุ่มกด Apply Now */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.applyBtn}
        >
          Apply Now
        </button>
      </div>

      <p className="text-lg">Job Title: {jobData.title}</p>
      
      {/* เรียกใช้งาน Modal Component */}
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobTitle={jobData.title}
        targetEmail={jobData.email}
      />
    </main>
  );
}