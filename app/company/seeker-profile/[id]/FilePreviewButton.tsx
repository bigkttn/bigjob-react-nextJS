"use client";
import { useState } from "react";
import styles from "./seekerProfile.module.css";

interface FilePreviewButtonProps {
  filePath: string;
  fileName: string;
}

export default function FilePreviewButton({
  filePath,
  fileName,
}: FilePreviewButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.fileBox} onClick={() => setOpen(true)}>
        view file
      </button>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Preview: {fileName}</span>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setOpen(false)}
              >
                ปิดหน้าต่าง ✖
              </button>
            </div>
            <div className={styles.modalBody}>
              {filePath.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={filePath}
                  className={styles.modalIframe}
                  title="PDF View"
                />
              ) : (
                <img
                  src={filePath}
                  className={styles.modalImg}
                  alt="Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const iframe = document.createElement("iframe");
                    iframe.src = filePath;
                    iframe.className = styles.modalIframe;
                    (e.target as HTMLElement).parentElement?.appendChild(
                      iframe,
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
