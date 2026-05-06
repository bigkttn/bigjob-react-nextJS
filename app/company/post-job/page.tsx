"use client";
import {useState} from 'react';
import styles from './postjob.module.css'
import Link from 'next/link';

const PostJob = () => {
  return (
    <div className={styles.postContainer}>
      {/* Header Area */}
      <div className={styles.postHeader}>
        <Link href={''}>
            <button className={styles.nextBtn}>Next</button>
        </Link>
       
      </div>

      <form className={styles.postForm}>
        {/* --- Left Column --- */}
        <div className={styles.formColumn}>
          <div className={styles.inputGroupInline}>
            <label>Work Location</label>
            <input type="text" />
          </div>

          <div className={styles.inputGroupInline}>
            <label>Salary</label>
            <input type="text" placeholder="As per Company Structure" />
          </div>

          <div className={styles.inputGroupInline}>
            <label>Vacancy</label>
            <input type="text" />
          </div>

          <div className={styles.inputGroupFull}>
            <label>Job Description</label>
            <textarea rows={6}></textarea>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Qualifications</label>
            <textarea rows={6}></textarea>
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className={styles.formColumn}>
          <div className={styles.inputGroupFull}>
            <label>Benefits</label>
            <textarea rows={6}></textarea>
          </div>

          <div className={styles.inputGroupFull}>
            <label>How to Apply</label>
            <textarea rows={6}></textarea>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Contact</label>
            <textarea rows={6}></textarea>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostJob;