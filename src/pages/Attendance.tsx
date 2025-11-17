import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AttendanceWidget from "@/components/attendance/AttendanceWidget";
import { getUserRole, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/auth";
// 1. Import component đồng hồ
import VietnamClock from "@/components/VietnamClock"; // (Đảm bảo đường dẫn này đúng với vị trí file của bạn)

const Attendance = () => {
 const [role, setRole] = useState<UserRole>('staff');

 useEffect(() => {
  const loadRole = async () => {
   const user = await getCurrentUser();
   if (!user) return;
   const userRole = await getUserRole(user.id);
   setRole(userRole);
  };
  loadRole();
 }, []);

 return (
  <DashboardLayout role={role}>
   <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
        {/* 2. Thay đổi cấu trúc div để chứa đồng hồ và tiêu đề */}
    <div className="mb-2 flex justify-between items-start"> 
          {/* Khu vực Tiêu đề */}
          <div>
            <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
       Attendance
      </h2>
      <p className="text-muted-foreground mt-2">Track your work hours and attendance</p>
          </div>
          
          {/* 3. Thêm component đồng hồ vào góc phải */}
          <VietnamClock />
    </div>

    <div className="shadow-strong rounded-lg">
     <AttendanceWidget />
    </div>
   </div>
  </DashboardLayout>
 );
};

export default Attendance;