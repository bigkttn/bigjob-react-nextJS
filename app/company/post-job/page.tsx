"use client";
import { use, useEffect, useState } from "react";
import styles from "./postjob.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PostJob = () => {
  const [isNext, setIsNext] = useState(false);
  const router = useRouter();
  const [forData, setFormData] = useState({
    jobPosition: "",
    workLocation: "",
    salary_min: "",
    salary_max: "",
    age_min: "",
    age_max: "",
    vacancy: "",
    jobType: "",
    deadline: "",
    jobDescription: "",
    qualifications: "",
    benefits: "",
    howToApply: "",
    contact: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // console.log(forData);

  const handLesubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forData.jobPosition || !forData.workLocation || !forData.jobType) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const response = await fetch("/api/posts/insertPost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forData),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Post created successfully!");
        router.push(`/company/createTest/${data.postId}`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const [myPosts, setMyPosts] = useState<any[]>([]);
  // ในหน้า page.tsx
  const fetchMyPosts = async () => {
    try {
      const response = await fetch("/api/posts/getPostbyCompanyId");
      const data = await response.json();

      // ตรวจสอบว่าถ้ามาเป็น Array ตรงๆ ให้ set ได้เลย
      if (Array.isArray(data)) {
        setMyPosts(data);
      } else if (data.posts && Array.isArray(data.posts)) {
        // หรือถ้า API ส่งมาในรูป { posts: [] }
        setMyPosts(data.posts);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }
    try {
      const response = await fetch(`/api/posts/deletePost/${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Post deleted successfully!");
        fetchMyPosts(); // ดึงข้อมูลงานใหม่หลังจากลบ
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []); // ดึงข้อมูลงานเมื่อคอมโพเนนต์โหลดครั้งแรก

  return (
    <div>
      <div className={styles.myPostsSection}>
        <h2 className={styles.myPostsTitle}>My Posts</h2>
        <div className={styles.item}>
          {myPosts.length > 0 ? (
            myPosts.map((post: any) => (
              <div key={post.post_id}>
                {/* <Link href={`/company/detail/${post.post_id}`}> */}
                <div className={styles.postMiniCard}>
                  {/* <img
                  src={post.logo_image || "/placeholder.png"}
                  alt={post.company_name}
                /> */}

                  <div className={styles.postMiniCardInfo}>
                    <span
                      className={`${styles.statusBadge} ${post.status === "Open" ? styles.open : styles.closed}`}
                    >
                      {post.status}
                    </span>
                    <p className={styles.bold}>{post.job_position}</p>
                    <p className={styles.subText}>{post.company_name}</p>
                    <div className={styles.cardFooter}>
                      <Link href={`/company/detail/${post.post_id}`}>
                        <button className={styles.detailBtn}>Detail</button>
                      </Link>
                      <button
                        className={styles.DeleteBtn}
                        onClick={() => handleDelete(post.post_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {/* </Link> */}
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>ยังไม่มีรายการประกาศงาน</p>
          )}
        </div>
      </div>
      <div className={styles.postContainer}>
        <form onSubmit={handLesubmit}>
          {/* Header Area */}

          <div className={styles.postHeader}>
            {isNext ? (
              <button
                className={styles.nextBtn}
                onClick={() => setIsNext(false)}
              >
                back
              </button>
            ) : (
              <h2 className={styles.myPostsTitle}>Create Posts</h2>
            )}

            {/* <Link href={"/company/createTest/1"}> */}
            {/* <Link href={"/company/post-job"}> */}
            {isNext ? (
              <button className={styles.nextBtn} type="submit">
                submit
              </button>
            ) : (
              <button
                className={styles.nextBtn}
                onClick={() => setIsNext(true)}
              >
                Next
              </button>
            )}

            {/* </Link> */}
          </div>
          {isNext ? (
            <h1>submit</h1>
          ) : (
            <div className={styles.postForm}>
              {/* --- Left Column --- */}
              <div className={styles.formColumn}>
                <div className={styles.inputGroupInline}>
                  <label>Job Position</label>
                  <input
                    type="text"
                    name="jobPosition"
                    value={forData.jobPosition}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroupInline}>
                  <label>Work Location</label>
                  <input
                    type="text"
                    name="workLocation"
                    value={forData.workLocation}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroupInline}>
                  <label>Salary Range</label>
                  <input
                    type="number"
                    name="salary_min"
                    value={forData.salary_min}
                    onChange={handleChange}
                    style={{ width: "100%" }}
                  />
                  -
                  <input
                    type="number"
                    name="salary_max"
                    value={forData.salary_max}
                    onChange={handleChange}
                    style={{ width: "100%" }}
                  />
                </div>

                <div className={styles.inputGroupInline}>
                  <label>Age Range</label>
                  <input
                    type="number"
                    name="age_min"
                    value={forData.age_min}
                    onChange={handleChange}
                    style={{ width: "100%" }}
                  />
                  -
                  <input
                    type="number"
                    name="age_max"
                    value={forData.age_max}
                    onChange={handleChange}
                    style={{ width: "100%" }}
                  />
                </div>

                <div className={styles.inputGroupInline}>
                  <label>Vacancy</label>
                  <input
                    type="number"
                    name="vacancy"
                    value={forData.vacancy}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroupInline}>
                  <label>Job Type</label>
                  <select
                    name="jobType"
                    value={forData.jobType}
                    className={styles.selectInput}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select Job Type
                    </option>
                    <option value="Full-time">Full-time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className={styles.inputGroupFull}>
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    className={styles.dateInput}
                    name="deadline"
                    value={forData.deadline}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.inputGroupFull}>
                  <label>Job Description</label>
                  <textarea
                    name="jobDescription"
                    value={forData.jobDescription}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
              </div>

              {/* --- Right Column --- */}
              <div className={styles.formColumn}>
                <div className={styles.inputGroupFull}>
                  <label>Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={forData.qualifications}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>

                <div className={styles.inputGroupFull}>
                  <label>Benefits</label>
                  <textarea
                    name="benefits"
                    value={forData.benefits}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>

                <div className={styles.inputGroupFull}>
                  <label>How To Apply</label>
                  <textarea
                    name="howToApply"
                    value={forData.howToApply}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>

                <div className={styles.inputGroupFull}>
                  <label>Contact</label>
                  <textarea
                    name="contact"
                    value={forData.contact}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PostJob;
