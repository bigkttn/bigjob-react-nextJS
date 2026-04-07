'use client';

import React, { useState } from 'react'; // เอา useEffect ออก
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import styles from './login.module.css'; // เปลี่ยนเป็น .module.css
declare global {
  interface Window {
    google: any;
  }
}
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // แนะนำให้ย้าย Client ID ไปไว้ใน .env.local (เช่น NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // ฟังก์ชันตั้งค่าปุ่ม Google
  const initGoogleButton = () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-btn-login-container'),
        {
          theme: 'filled_black',
          size: 'large',
          width: '350',
          shape: 'pill',
          text: 'signin_with',
        }
      );
    }
  };

  // จัดการเมื่อ Login ด้วย Google สำเร็จ
  const handleGoogleLogin = async (response: any) => {
    const payload = {
      token: response.credential,
      userType: 'seeker',
    };

    try {
      // เรียก API (แทน ApiService ของ Angular)
      const res = await fetch('/api/auth/google', { // เปลี่ยนเป็น URL Backend ของคุณ
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 404) {
          alert('ไม่พบข้อมูลบัญชี Google นี้ กรุณาสมัครสมาชิกก่อน');
          router.push('/register');
          return;
        }
        throw new Error('Login failed');
      }

      const data = await res.json();
      console.log('Google Login Success:', data);
      
      // TODO: เก็บ Session/Token (เช่น localStorage, Cookies, หรือ Context)
      // authService.login(data.user); 

      redirectUser(data.user.role);
    } catch (err: any) {
      console.error(err);
      alert('เข้าสู่ระบบไม่สำเร็จ: ' + err.message);
    }
  };

  // จัดการ Login ด้วย Email/Password ปกติ
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ Refresh เมื่อกด Submit

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', { // เปลี่ยนเป็น URL Backend ของคุณ
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Login failed. Please check your email/password.');

      const data = await res.json();
      console.log('Login Success:', data);

      // TODO: เก็บ Session/Token
      
      redirectUser(data.user.role);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  // ฟังก์ชันช่วย Redirect แยกตาม Role
  const redirectUser = (role: string) => {
    switch (role) {
      case 'seeker':
        router.push('/user/user-home');
        break;
      case 'company':
        router.push('/company/company-home');
        break;
      case 'admin':
        router.push('/admin/home');
        break;
      default:
        alert('Unknown Role: ' + role);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initGoogleButton}
      />

      <div className={styles.loginCard}>
        
        {/* แถบด้านซ้าย */}
        <div className={styles.brandSide}>
          <div className={styles.logo}>
            <span className={styles.icon}>☰</span> BIGJOBs
          </div>
          <div className={styles.slogan}>
            <h1>Find the job you want.<br /><span>If available.</span></h1>
          </div>
        </div>

        {/* แถบฟอร์มด้านขวา */}
        <div className={styles.formSide}>
          <div className={styles.formContent}>
            <h2>Welcome Back!</h2>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>Login to access your account</p>

            <form onSubmit={onLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className={styles.btnLogin}>Login</button>
            </form>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <div 
              id="google-btn-login-container" 
              style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}
            ></div>

            <div className={styles.footerLink}>
              <p>Don’t have an account? <Link href="/register">Sign up</Link></p>
            </div>
            <div className={styles.footerLink}>
              <Link href="/forgot-password">ลืมรหัสผ่าน?</Link>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}