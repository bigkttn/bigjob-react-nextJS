'use client';

import { useState } from 'react';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  targetEmail: string;
}

//ส่งเมล
const openNativeMailClient = ({
  toEmail,
  jobTitle,
  applicantName,
  userEmail,
  message,
}: {
  toEmail: string;
  jobTitle: string;
  applicantName: string;
  userEmail: string;
  message: string;
}) => {
  const subject = encodeURIComponent(`Application for ${jobTitle}`);
  const body = encodeURIComponent(
    `Name: ${applicantName}\nEmail: ${userEmail}\n\n${message}`
  );
  window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`;
};


export default function ApplyModal({
  isOpen,
  onClose,
  jobTitle,
  targetEmail,
}: ApplyModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    `I am interested in applying for the ${jobTitle} position.`
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // เรียกใช้ helper function ที่แยกไว้
    openNativeMailClient({
      toEmail: targetEmail,
      jobTitle,
      applicantName: name,
      userEmail: email,
      message,
    });

    onClose(); // ปิด modal เมื่อกดส่ง
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Apply for {jobTitle}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium">Your Name</label>
            <input
              type="text"
              required
              className="w-full border p-2 rounded mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Your Email</label>
            <input
              type="email"
              required
              className="w-full border p-2 rounded mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea
              rows={4}
              className="w-full border p-2 rounded mt-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded"
            >
              Open Email App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}