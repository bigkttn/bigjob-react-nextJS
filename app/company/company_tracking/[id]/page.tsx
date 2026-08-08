import styles from "./company_tracking.module.css";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { apiUrl } from "@/lib/hostURL";
import CompanyApplication from "./company_application";

interface CustomJwtPayload extends JwtPayload{
  id: number;
}

interface PageProps{
  params: Promise<{id:string}>;
}

export default async function SeekerTracking({params}:PageProps) {
  const resParams = await params;
  const companyId = resParams.id;
  // console.log("userId",userId);

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let viewer:CustomJwtPayload | null = null;

  if(token){
    try{
      const secret = process.env.JWT_SECRET || "fallback_secret";
      viewer = jwt.verify(token, secret) as CustomJwtPayload;
    }catch{
      console.error("Token invaild");
    }
  }

  if(!viewer){
     return (
      <div className={styles.centerMsg}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }
  let trackingList:any[]=[];
  try {
    const res = await fetch(`${apiUrl}/api/interview_tracking/GetByCompany/${companyId}`,{
      cache:"no-store"
    });
    if(res.ok){
      const data = await res.json();
      trackingList = data.rows || [];
      console.log("trackingList",trackingList);
    }
    
  } catch (error) {
    console.error("Error fetching tracking list:", error);
  }

  return <CompanyApplication initialJobs={trackingList} companyId={companyId} />;
}