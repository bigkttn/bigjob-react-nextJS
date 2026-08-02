'use client';

import { useState } from 'react';
import "./ApplyModel.css"

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  targetEmail: string; // อีเมลบริษัท เช่น careers@chaophrayaunited.com
}

export default function ApplyModal({
  isOpen,
  onClose,
  // jobTitle,
  // targetEmail,
}: ApplyModalProps) {
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  // const [message, setMessage] = useState(`สวัสดีครับ/ค่ะ มีความสนใจสมัครงานตำแหน่ง ${jobTitle}`);
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          // message,
          // targetEmail,
          // jobTitle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

      setStatusMsg({ type: 'success', text: 'ส่งใบสมัครสำเร็จแล้ว!' });
      
      // ปิด modal หลังส่งสำเร็จ 1.5 วินาที
      setTimeout(() => {
        onClose();
        setStatusMsg({ type: '', text: '' });
      }, 1500);

    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <h3 className="text-xl font-bold text-gray-800 mb-1">สมัครงานตำแหน่ง</h3>
        {/* <p className="text-sm font-semibold text-blue-600 mb-4">{jobTitle}</p> */}

        {statusMsg.text && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              statusMsg.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">ชื่อ-นามสกุล ผู้สมัคร</label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="นาย สมชาย ใจดี"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">อีเมลติดต่อกลับ</label>
            <input
              type="email"
              required
              className="w-full border rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="your-name@email.com"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">ข้อความถึง HR</label>
            <textarea
              rows={4}
              className="w-full border rounded-lg p-2.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              // value={message}
              // onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งใบสมัคร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}