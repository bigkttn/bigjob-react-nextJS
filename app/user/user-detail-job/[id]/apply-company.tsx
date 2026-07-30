'use client';

import { useState } from 'react';
import ApplyModal from '@/components/ApplyModal';

export default function JobDetailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock ข้อมูลตำแหน่งงาน (ในงานจริงอาจมาจาก API/Database)
  const jobData = {
    title: 'Soccer coach',
    company: 'Chao Phraya United',
    email: 'careers@chaophrayaunited.com',
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{jobData.company}</h1>
        
        {/* ปุ่มกด Apply Now */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800"
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