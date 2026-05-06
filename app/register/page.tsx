"use client"; 
import React, { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './register.module.css'

const Register = () => {
     const router = useRouter();

     const [userType, setUserType] = useState<'seeker'|'company'>('seeker');
     const [captchaToken, setCaptchaToken] = useState<string | null>(null);
     const [otpCode, setOtpCode] = useState('');
     const [isOtpSent, setIsOtpSent]  = useState(false);
     const [isLoadingOtp, setIsLoadingOtp] = useState(false);

     const [registerData, setRegisterData] = useState({
          email: '',
          password: '',
          confirmPassword: '',
          fullname: '',
          companyName: '',
          businessType: '', // เพิ่มรับค่าประเภทธุรกิจ
          contactName: '',
          phone: ''
     });

     const googleClientId =  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

     // เชื่อมต่อ Google Auth และแสดงปุ่มสมัครสมาชิก
      useEffect(() => {
          const initGoogle = () => {
               const google = window.google;
               if (google) {
                    google.accounts.id.initialize({
                         client_id: googleClientId,
                         callback: handleGoogleCredentialResponse
                    });
                    google.accounts.id.renderButton(
                         document.getElementById("google-btn-register-container"),
                         { theme: "filled_back",
                           size: "large" , 
                           width: "350", 
                           shape: "pill",
                           text: "signup_with"}
                    );
               }
          };

          // เช็ค script โหลดหรือยัง
          if (!(window.google)) {
               const script = document.createElement('script');
               script.src = "https://accounts.google.com/gsi/client";
               script.async = true;
               script.defer = true;
               script.onload = initGoogle;
               document.head.appendChild(script);
          } else {
               initGoogle();
          }

      }, [userType]); 

      const handleGoogleCredentialResponse = async (response: any) => {
        console.log("Google Token:", response.credential);
        
        let payload: any = {
          token: response.credential, 
          userType: userType,          
        };
        
        if(userType === 'seeker'){
          if (registerData.fullname) {
               payload.fullname = registerData.fullname;
          }
        } else if (userType === 'company') {
          payload.company_name  = registerData.companyName;
          payload.business_type = registerData.businessType;
          payload.contact_name = registerData.contactName; 
          payload.mobile_phone = registerData.phone;    

          if (!registerData.companyName || !registerData.businessType || !registerData.phone) {
               alert('Please complete all the required company information !!')
               return;
          }
        }

        try {
               const res = await fetch('/api/auth/registerGoogle',{
                    method: 'POST',
                    headers:{'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
               });

          const data = await res.json();

          if (res.ok) {
              alert('Registration Successful! Welcome');
              localStorage.setItem('currentUser', JSON.stringify(data.user));
               if (data.user.role === 'seeker') {
                   window.location.href = '/user/user-home';
               } else {
                    window.location.href = '/company/company-home';
               }
          } else {
               alert('Google Sign-up Failed: ' + (data.message || 'Server Error'));
          }
      } catch (err) {
          console.error('Google Sign-up Error:', err);
          alert('Network Error: ติดต่อ Server ไม่ได้');
      }
  };

  const requestOtp = async () => {
        if (!registerData.email) return alert('กรุณากรอกอีเมลก่อนขอรหัส OTP');
        setIsLoadingOtp(true);
        
        try {
            // เรียก API ไปยัง Route ที่เราสร้างไว้
            const res = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registerData.email })
            });

            const data = await res.json();

            if (res.ok) {
                setIsOtpSent(true);
                alert('✅ ' + data.message); // แสดงข้อความ "ส่ง OTP สำเร็จ"
            } else {
                alert('❌ เกิดข้อผิดพลาด: ' + data.message);
            }
        } catch (error) {
            console.error('Request OTP Error:', error);
            alert('Network Error: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } finally {
            setIsLoadingOtp(false); // ปิดสถานะโหลดไม่ว่าจะสำเร็จหรือล้มเหลว
        }
    };

    // --------------------------------------------------------
    // อัปเดต: ฟังก์ชันสมัครสมาชิกแบบปกติ
    // --------------------------------------------------------
    const onRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. ตรวจสอบข้อมูลเบื้องต้น (Validation)
        if (!captchaToken) return alert('Please complete the CAPTCHA');
        if (registerData.password !== registerData.confirmPassword) return alert('Password mismatch!');
        if (!otpCode) return alert('Please enter and verify OTP first!'); // เช็ค OTP

        if (userType === 'company') {
             if (!registerData.companyName || !registerData.phone) {
                  return alert('Please fill in all required company information!');
             }
        } else {
             if (!registerData.fullname) {
                  return alert('Please enter your full name!');
             }
        }

        // 2. เตรียมข้อมูลส่งไป API 
        const payload = {
             email: registerData.email,
             password: registerData.password,
             userType: userType,
             fullname: registerData.fullname,
             company_name: registerData.companyName,
             business_type: registerData.businessType,
             contact_name: registerData.contactName,
             mobile_phone: registerData.phone,
             otpCode: otpCode // 👈 เพิ่มบรรทัดนี้ เพื่อส่ง OTP ไปให้หลังบ้านเช็ค!
        };

        try {
            // 3. ยิง API สมัครสมาชิกแบบปกติ
            const res = await fetch('/api/auth/registerB', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(payload)
            });

            // (โค้ดส่วนที่เหลือของคุณใช้งานได้ดีอยู่แล้วครับ)
            const data = await res.json();

            if (res.ok) {
                 alert('Registration Successful! Welcome to BIGJOBs');
                 localStorage.setItem('currentUser', JSON.stringify(data.user));
                 
                 if (data.user.role === 'seeker') {
                      window.location.href = '/user/user-home';
                 } else {
                      window.location.href = '/company/company-home';
                 }
            } else {
                 alert('Registration Failed: ' + (data.message || 'Something went wrong'));
            }

        } catch (error) {
             console.error('Registration Error:', error);
             alert('Network Error: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.registerCard}>

                {/* Brand Side */}
                <div className={styles.brandSide}>
                    <div className={styles.logo}>
                        <span className={styles.icon}>☰</span> BIGJOBs
                    </div>
                    <div className={styles.slogan}>
                        <h1>
                            {userType === 'seeker' ? 'Apply to join us.' : 'Partner with us.'}
                            <br />
                            <span>{userType === 'seeker' ? 'We are family.' : 'Grow your business.'}</span>
                        </h1>
                    </div>
                    <div className={styles.decorationCircle}></div>
                </div>

                {/* Form Side */}
                <div className={styles.formSide}>
                    <div className={styles.userTypeSelector}>
                        <button 
                            className={`${styles.typeBtn} ${userType === 'seeker' ? styles.typeBtnActive : ''}`}
                            onClick={() => setUserType('seeker')}
                        >
                            Job Seeker
                        </button>
                        <button 
                            className={`${styles.typeBtn} ${userType === 'company' ? styles.typeBtnActive : ''}`}
                            onClick={() => setUserType('company')}
                        >
                            Company
                        </button>
                    </div>

                    <div className={styles.formContent}>
                        <h2>Create Account for {userType === 'seeker' ? 'Job Seeker' : 'Company'}</h2>

                        <form onSubmit={onRegister}>
                            {/* Input: Full Name (Seeker Only) */}
                            {userType === 'seeker' && (
                                <div className={styles.inputGroup}>
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your full name" 
                                        value={registerData.fullname}
                                        onChange={(e) => setRegisterData({...registerData, fullname: e.target.value})}
                                        required 
                                    />
                                </div>
                            )}

                            {/* Input: Email */}
                            <div className={styles.inputGroup}>
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    placeholder="email@example.com" 
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                    required 
                                />
                            </div>

                            {/* Input: OTP */}
                            <div className={styles.inputGroup}>
                                <label>Verification Code (OTP)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Enter 6-digit Code"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        style={{ flex: 1, textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' }}
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={requestOtp}
                                        disabled={!registerData.email || isLoadingOtp}
                                        className={styles.otpRequestBtn} 
                                        style={{ padding: '0 15px', borderRadius: '5px', border: 'none', backgroundColor: '#333', color: '#fff', cursor: 'pointer', fontSize: '14px', minWidth: '100px' }}
                                    >
                                        {isLoadingOtp ? 'Sending...' : (isOtpSent ? 'Resend' : 'Get OTP')}
                                    </button>
                                </div>
                                {isOtpSent && <small style={{ color: '#28a745', marginTop: '5px', display: 'block' }}>✅ OTP sent.</small>}
                            </div>

                            {/* Password Row */}
                            <div className={styles.inputGroupRow}>
                                <div className={styles.inputGroup}>
                                    <label>Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Password" 
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Confirm Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="Confirm" 
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Company Fields */}
                            {userType === 'company' && (
                                <div className={styles.companyFields}>
                                    <div className={styles.inputGroupRow}>
                                        <div className={styles.inputGroup}>
                                            <label>Company Name</label>
                                            <input type="text" value={registerData.companyName} onChange={(e) => setRegisterData({...registerData, companyName: e.target.value})} required/>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Business Type</label>
                                            <input type="text" placeholder="e.g. IT, Healthcare" value={registerData.businessType} onChange={(e) => setRegisterData({...registerData, businessType: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroupRow}>
                                        <div className={styles.inputGroup}>
                                            <label>Contact Name</label>
                                            <input type="text" value={registerData.contactName} onChange={(e) => setRegisterData({...registerData, contactName: e.target.value})} />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Phone</label>
                                            <input type="tel" value={registerData.phone} onChange={(e) => setRegisterData({...registerData, phone: e.target.value})} required/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ReCaptcha */}
                            <div style={{ padding: '10px 0' }}>
                                <ReCAPTCHA
                                    sitekey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || ''}
                                    onChange={(token) => setCaptchaToken(token)}
                                />
                            </div>

                            <button type="submit" className={styles.btnRegister}>Create Account</button>
                        </form>

                        <div className={styles.divider}>
                            <span >OR</span>
                        </div>

                        {/* Google Button Container */}
                        <div id="google-btn-register-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}></div>

                        <div className={styles.footerLink}>
                            <p>Already have an account? <Link href="/login">Log in</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default  Register;