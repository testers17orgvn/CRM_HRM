import { useState, useEffect } from "react"; // Nhập các hook useState, useEffect từ React
import DashboardLayout from "@/components/layout/DashboardLayout"; // Nhập DashboardLayout
import { getUserRole, getCurrentUser } from "@/lib/auth"; // Nhập getUserRole, getCurrentUser từ thư viện xác thực
import { UserRole } from "@/lib/auth"; // Nhập kiểu UserRole
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Nhập các thành phần Tabs
import TeamsManagement from "@/components/organization/TeamsManagement"; // Nhập Quản lý Đội nhóm
import ShiftsManagement from "@/components/organization/ShiftsManagement"; // Nhập Quản lý Ca làm
import UsersManagement from "@/components/organization/UsersManagement"; // Nhập Quản lý Người dùng
import AttendanceSettings from "@/components/organization/AttendanceSettings"; // Nhập Cài đặt Chấm công
import SalaryManagement from "@/components/organization/SalaryManagement"; // Nhập Quản lý Lương
import SalaryStatistics from "@/components/organization/SalaryStatistics"; // Nhập Thống kê Lương

const Organization = () => {
 // Khởi tạo state role (vai trò) mặc định là 'staff' (nhân viên)
 const [role, setRole] = useState<UserRole>('staff');

 useEffect(() => {
  // Hàm bất đồng bộ để tải vai trò của người dùng
  const loadRole = async () => {
   // Lấy người dùng hiện tại
   const user = await getCurrentUser();
   // Nếu không có người dùng, thoát
   if (!user) return;
   // Lấy vai trò của người dùng dựa trên ID
   const userRole = await getUserRole(user.id);
   // Cập nhật state role
   setRole(userRole);
  };
  // Chạy hàm tải vai trò
  loadRole();
 }, []); // Chạy chỉ một lần sau khi render ban đầu

 // Kiểm tra xem người dùng có phải là admin không
 if (role !== 'admin') {
  return (
   // Hiển thị layout Dashboard
   <DashboardLayout role={role}>
    <div className="text-center py-12">
     <h2 className="text-2xl font-bold">Truy Cập Bị Từ Chối</h2>
     <p className="text-muted-foreground mt-2">Chỉ quản trị viên (admin) mới có thể truy cập trang này.</p>
    </div>
   </DashboardLayout>
  );
 }

 return (
  // Hiển thị layout Dashboard
  <DashboardLayout role={role}>
   <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
    <div className="mb-2">
     <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
      Tổ Chức
     </h2>
     <p className="text-muted-foreground mt-2">Quản lý đội nhóm, người dùng, ca làm và cài đặt</p>
    </div>

    <Tabs defaultValue="teams" className="w-full">
     <TabsList className="bg-secondary shadow-soft">
      <TabsTrigger value="teams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Đội nhóm</TabsTrigger>
      <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Người dùng</TabsTrigger>
      <TabsTrigger value="shifts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ca làm</TabsTrigger>
      <TabsTrigger value="salary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Lương</TabsTrigger>
      <TabsTrigger value="statistics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Thống kê</TabsTrigger>
      <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Chấm công</TabsTrigger>
     </TabsList>
     <TabsContent value="teams" className="mt-6">
      <TeamsManagement /> 
     </TabsContent>
     <TabsContent value="users" className="mt-6">
      <UsersManagement />
     </TabsContent>
     <TabsContent value="shifts" className="mt-6">
      <ShiftsManagement /> 
     </TabsContent>
     <TabsContent value="salary" className="mt-6">
      <SalaryManagement /> 
     </TabsContent>
     <TabsContent value="statistics" className="mt-6">
      <SalaryStatistics /> 
     </TabsContent>
     <TabsContent value="settings" className="mt-6">
      <AttendanceSettings /> 
     </TabsContent>
    </Tabs>
   </div>
  </DashboardLayout>
 );
};

export default Organization; // Xuất component Organization