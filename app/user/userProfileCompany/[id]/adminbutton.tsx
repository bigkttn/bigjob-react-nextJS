"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminButtonProps {
  id: string;
  role: string;
  // post_id: string;
  company_id?: string;
}
export default function AdminButton({
  id,
  role,
  // post_id,
  company_id,
}: AdminButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("3"); // ค่าเริ่มต้นเป็น 3 วัน
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // const handleDelete = async () => {
  //   const isConfirm = confirm(
  //     `Are you sure you want to delete Company ID: ${company_id} ? This action cannot be undone.`,
  //   );
  //   if (!isConfirm) return;
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(`/api/posts/deletePost/${company_id}`, {
  //       method: "DELETE",
  //     });
  //     if (response.ok) {
  //       console.log("Post deleted successfully");
  //       router.back();
  //       // อัปเดตรายการโพสต์หลังจากลบ
  //     } else {
  //       const errorData = await response.json();
  //       console.error("Error deleting post:", errorData);
  //     }
  //   } catch (error) {
  //     console.error("Error deleting post:", error);
  //     alert("เกิดข้อผิดพลาดในการลบประกาศงาน กรุณาลองใหม่อีกครั้ง");
  //   } finally {
  //     setIsLoading(false);
  //   }
  //   // โค้ดลบประกาศงานของคุณ
  // };

  const handleBan = async () => {
    const durationText = banDuration === "999" ? "ถาวร" : `${banDuration} วัน`;
    const isConfirm = confirm(
      `คุณต้องการแบนผู้ company ID: ${company_id} เป็นเวลา ${durationText} ใช่หรือไม่?`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/Ban`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          company_id,
          durationDays: parseInt(banDuration),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(`แบนcompanyสำเร็จ! (ระยะเวลา: ${durationText})`);
        setIsOpen(false);
        router.back();
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message || "ไม่สามารถแบนโพสต์ได้"}`);
      }
    } catch (error) {
      console.error("Ban error:", error);
      alert("เกิดข้อผิดพลาดในการแบนผู้ใช้");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
      >
        จัดการโพสต์ (Admin)
      </button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999, // ให้อยู่ชั้นบนสุด
          }}
        >
          {/* กล่องเนื้อหาของ Popup */}
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              color: "#333",
              fontFamily: "inherit",
            }}
          >
            {/* Header ของ Modal */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#222",
              }}
            >
              Admin Post Management
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              Managing Target ID:{" "}
              <span style={{ fontWeight: "bold", color: "#000" }}>
                {company_id}
              </span>
            </p>

            <hr
              style={{
                border: "0",
                borderTop: "1px solid #eee",
                marginBottom: "20px",
              }}
            />

            {/* ส่วนที่ 1: การลบโพสต์ (Delete)
            <div style={{ marginBottom: "25px" }}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#dc3545",
                }}
              >
                1. Delete This Post
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#777",
                  marginBottom: "10px",
                }}
              >
                This post will be permanently deleted from the database.
              </p>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  width: "100%",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  !isLoading &&
                  (e.currentTarget.style.backgroundColor = "#c82333")
                }
                onMouseOut={(e) =>
                  !isLoading &&
                  (e.currentTarget.style.backgroundColor = "#dc3545")
                }
              >
                {isLoading ? "Processing..." : "Delete Post Now"}
              </button>
            </div>

            <hr
              style={{
                border: "0",
                borderTop: "1px solid #eee",
                marginBottom: "20px",
              }}
            /> */}

            {/* ส่วนที่ 2: การแบนผู้สร้างโพสต์ (Ban) */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#fd7e14",
                }}
              >
                {/* 2.  */}Ban User Account
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#777",
                  marginBottom: "10px",
                }}
              >
                Temporarily or permanently suspend the account that created this
                post.
              </p>

              {/* เมนูเลือกช่วงเวลาที่ต้องการแบน */}
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "12px" }}
              >
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "0.9rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="3">Ban for 3 Days</option>
                  <option value="7">Ban for 7 Days</option>
                  <option value="30">Ban for 30 Days</option>
                  <option value="999">Permanently Suspend Account</option>
                </select>
              </div>

              <button
                onClick={handleBan}
                disabled={isLoading}
                style={{
                  width: "100%",
                  backgroundColor: "#fd7e14",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  !isLoading &&
                  (e.currentTarget.style.backgroundColor = "#e06907")
                }
                onMouseOut={(e) =>
                  !isLoading &&
                  (e.currentTarget.style.backgroundColor = "#fd7e14")
                }
              >
                {isLoading ? "Processing..." : "Confirm Ban"}
              </button>
            </div>

            {/* ส่วนที่ 3: ปุ่มยกเลิก / ปิด Popup */}
            <button
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "#f1f3f5",
                color: "#495057",
                border: "none",
                padding: "10px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#e9ecef")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#f1f3f5")
              }
            >
              Cancel / Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
