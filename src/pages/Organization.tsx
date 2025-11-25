import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUserRole, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/auth";
import TeamsManagement from "@/components/organization/TeamsManagement";
import ShiftsManagement from "@/components/organization/ShiftsManagement";
import UsersManagement from "@/components/organization/UsersManagement";
import AttendanceManagement from "@/components/organization/AttendanceManagement";
import SalaryManagement from "@/components/organization/SalaryManagement";
import SalaryStatistics from "@/components/organization/SalaryStatistics";

const Organization = () => {
 const [role, setRole] = useState<UserRole>('staff');
 const [activeSection, setActiveSection] = useState<string>('teams');

 useEffect(() => {
  const loadRole = async () => {
   const user = await getCurrentUser();
   if (!user) return;
   const userRole = await getUserRole(user.id);
   setRole(userRole);
  };
  loadRole();
 }, []);

 if (role !== 'admin') {
  return (
   <DashboardLayout role={role}>
    <div className="text-center py-12">
     <h2 className="text-2xl font-bold">Truy Cập Bị Từ Chối</h2>
     <p className="text-muted-foreground mt-2">Chỉ quản trị viên (admin) mới có thể truy cập trang này.</p>
    </div>
   </DashboardLayout>
  );
 }

 const renderSection = () => {
  switch (activeSection) {
   case 'teams':
    return <TeamsManagement />;
   case 'users':
    return <UsersManagement />;
   case 'shifts':
    return <ShiftsManagement />;
   case 'attendance':
    return <AttendanceManagement />;
   case 'salary':
    return <SalaryManagement />;
   case 'statistics':
    return <SalaryStatistics />;
   default:
    return <TeamsManagement />;
  }
 };

  return (
    <DashboardLayout role={role}>
      <div className="animate-fade-in pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent text-2xl md:text-3xl lg:text-4xl">
            Quản Lý Tổ Chức
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Quản lý đội nhóm, người dùng, ca làm, chấm công và lương</p>
        </div>

        <Accordion type="single" collapsible defaultValue="teams" className="w-full space-y-4">
          <AccordionItem value="teams">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <Users className="h-5 w-5" />
              <span>Đội nhóm</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <TeamsManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="users">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <Users className="h-5 w-5" />
              <span>Người dùng</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <UsersManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shifts">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <Clock className="h-5 w-5" />
              <span>Ca làm</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <ShiftsManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="attendance">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <CheckSquare className="h-5 w-5" />
              <span>Chấm công</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <AttendanceManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="salary">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <DollarSign className="h-5 w-5" />
              <span>Lương</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <SalaryManagement />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="statistics">
            <AccordionTrigger className="flex items-center gap-2 text-base md:text-lg hover:bg-accent px-3 rounded-lg">
              <LineChart className="h-5 w-5" />
              <span>Thống kê</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4 px-2">
              <SalaryStatistics />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DashboardLayout>
  );
};

export default Organization; // Xuất component Organization
