import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUserRole, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TaskBoard from "@/components/tasks/TaskBoard";
import TaskList from "@/components/tasks/TaskList";
import ScheduleTab from "@/components/tasks/ScheduleTab";
import TeamAllocationTab from "@/components/tasks/TeamAllocationTab";
import ReportsTab from "@/components/tasks/ReportsTab";

// NEW COMPONENTS (bạn sẽ thêm file sau, mình tạo cho)
import { LayoutGrid, List, Calendar, Users, FileText, Goal, GitBranch, File, Waypoints } from "lucide-react";

const Tasks = () => {
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
        
        <div className="mb-2">
          <h2 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Công việc
          </h2>
          <p className="text-muted-foreground mt-2">Quản lý và theo dõi nhiệm vụ của bạn</p>
        </div>

        <Tabs defaultValue="board" className="w-full">
          
          {/* ======= TABS LIST ======= */}
          <TabsList className="bg-secondary shadow-soft flex flex-wrap h-auto gap-1 p-1">

            {/* Bảng */}
            <TabsTrigger value="board" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Bảng</span>
            </TabsTrigger>

            {/* Danh sách */}
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Danh sách</span>
            </TabsTrigger>

            {/* Lịch */}
            <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch & Gantt</span>
            </TabsTrigger>

            {/* Nhóm */}
            <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Nhóm</span>
            </TabsTrigger>

            {/* Báo cáo */}
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Báo Cáo</span>
            </TabsTrigger>

            {/* ======= TABS GỢI Ý THÊM (bật nếu muốn) ======= */}

            {/* Goals / OKRs */}
            {/* 
            <TabsTrigger value="goals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Goal className="h-4 w-4" />
              <span className="hidden sm:inline">Mục tiêu</span>
            </TabsTrigger>
            */}

            {/* Roadmap */}
            {/* 
            <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Waypoints className="h-4 w-4" />
              <span className="hidden sm:inline">Roadmap</span>
            </TabsTrigger>
            */}

            {/* Development */}
            {/* 
            <TabsTrigger value="dev" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Development</span>
            </TabsTrigger>
            */}

            {/* Files */}
            {/* 
            <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="hidden sm:inline">Tài liệu</span>
            </TabsTrigger>
            */}

          </TabsList>

          {/* ======= CONTENT ======= */}
          <TabsContent value="board" className="mt-6">
            <TaskBoard role={role} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <TaskList role={role} />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <ScheduleTab />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamAllocationTab role={role} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsTab role={role} />
          </TabsContent>

          {/* Goals */}
          {/* <TabsContent value="goals" className="mt-6">ComponentGoalsHere</TabsContent> */}

          {/* Roadmap */}
          {/* <TabsContent value="roadmap" className="mt-6">ComponentRoadmapHere</TabsContent> */}

          {/* Dev */}
          {/* <TabsContent value="dev" className="mt-6">ComponentDevHere</TabsContent> */}

          {/* Files */}
          {/* <TabsContent value="files" className="mt-6">ComponentFilesHere</TabsContent> */}

        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
