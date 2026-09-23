"use client";
import React from "react";
import styles from "./ReviewSection.module.css";

type ReviewType = {
  tracking_id: number;
  user_id: string | number;
  review_rating: string | number;
  review_comment: string;
  created_review_at: string;
  profile_image?: string;
  fullname?: string;
  job_position?: string;
};

type ReviewSectionProps = {
  reviews: ReviewType[];
  viewerId?: string | number | null;
  onDeleteReview?: (trackingId: number) => void;
  maxHeight?: string;
};

export default function ReviewSection({ reviews, viewerId, onDeleteReview, maxHeight = "400px" }: ReviewSectionProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        การให้คะแนนและบทวิจารณ์
      </h3>

      {/* Top Score Section (Google Play Style) */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreDisplay}>
          <div className={styles.bigScore}>
            {(
              reviews.reduce(
                (acc, curr) => acc + (Number(curr.review_rating) || 0),
                0
              ) / reviews.length
            ).toFixed(1)}
          </div>
          <div className={styles.starsWrapper}>
            {[1, 2, 3, 4, 5].map((star) => {
              const avg =
                reviews.reduce(
                  (acc, curr) => acc + (Number(curr.review_rating) || 0),
                  0
                ) / reviews.length;
              if (star <= Math.floor(avg))
                return (
                  <span
                    key={star}
                    className={`material-symbols-outlined ${styles.starIcon}`}
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    star
                  </span>
                );
              if (star - avg < 1)
                return (
                  <span
                    key={star}
                    className={`material-symbols-outlined ${styles.starIcon}`}
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    star_half
                  </span>
                );
              return (
                <span
                  key={star}
                  className={`material-symbols-outlined ${styles.starIcon}`}
                  style={{ fontVariationSettings: '"FILL" 0' }}
                >
                  star
                </span>
              );
            })}
          </div>
          <span className={styles.reviewCount}>
            {reviews.length} บทวิจารณ์
          </span>
        </div>

        {/* Progress Bars */}
        <div className={styles.progressBars}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(
              (r) => Math.round(Number(r.review_rating)) === star
            ).length;
            const percentage =
              reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className={styles.progressBarRow}>
                <span className={styles.starLabel}>
                  {star}
                </span>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={styles.reviewsList}
        style={{ maxHeight: maxHeight }}
      >
        {[...reviews]
          .sort((a, b) => {
            const isAViewer = String(viewerId) === String(a.user_id);
            const isBViewer = String(viewerId) === String(b.user_id);
            if (isAViewer && !isBViewer) return -1;
            if (!isAViewer && isBViewer) return 1;
            return 0;
          })
          .map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              {onDeleteReview && String(viewerId) === String(r.user_id) && (
                <button
                  onClick={() => onDeleteReview(r.tracking_id)}
                  className={styles.deleteBtn}
                  title="ลบรีวิว"
                >
                  <span
                    className={`material-symbols-outlined ${styles.deleteBtnIcon}`}
                  >
                    delete
                  </span>
                </button>
              )}
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  <img
                    src={
                      r.profile_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        r.fullname || "User"
                      )}&background=random`
                    }
                    className={styles.avatar}
                    alt="User Avatar"
                  />
                  <div className={styles.namePosition}>
                    <span className={styles.fullname}>
                      {r.fullname}
                    </span>
                    {r.job_position && (
                      <span className={styles.jobPosition}>
                        {r.job_position}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date moved here */}
                <span
                  className={`${styles.date} ${
                    onDeleteReview && String(viewerId) === String(r.user_id)
                      ? styles.dateWithDelete
                      : ""
                  }`}
                >
                  {r.created_review_at
                    ? new Date(r.created_review_at).toLocaleDateString(
                        "th-TH",
                        { day: "numeric", month: "short", year: "numeric" }
                      )
                    : ""}
                </span>
              </div>

              <div className={styles.reviewStars}>
                <div className={styles.reviewStarsWrapper}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`material-symbols-outlined ${styles.smallStarIcon}`}
                      style={{
                        fontVariationSettings:
                          star <= Number(r.review_rating)
                            ? '"FILL" 1'
                            : '"FILL" 0',
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>

              <p className={styles.comment}>
                {r.review_comment}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
