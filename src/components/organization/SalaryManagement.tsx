import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp, Clock, Download, FileSpreadsheet, Hourglass } from "lucide-react";
import { format } from "date-fns";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { SkeletonStatCard } from "@/components/ui/skeleton-card";
import * as XLSX from 'xlsx';

// --- INTERFACES ---
interface Salary {
  id: string;
  user_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  total_salary: number;
  hours_worked: number;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttendanceRecord {
    user_id: string;
    timestamp: string;
    type: 'check_in' | 'check_out'; 
    location: string | null;
    notes: string | null;
}

const SalaryManagement = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]); // Đã fix kiểu dữ liệu
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    base_salary: "",
    bonus: "0",
    deductions: "0",
    notes: ""
  });

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Không rõ';
  };
  
  // KHẮC PHỤC LỖI 57: Đóng gói fetchData bằng useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all salaries
      const { data: salaryData, error: salaryError } = await supabase
        .from('salaries')
        .select('*')
        .order('month', { ascending: false });

      if (salaryError) throw salaryError;

      // Fetch all profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');

      if (profileError) throw profileError;

      // Fetch attendance data for hours calculation
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id, timestamp, type, location, notes'); // Đã chọn các cột cần thiết

      if (attendanceError) throw attendanceError;
      
      // KHẮC PHỤC LỖI any (Đã ép kiểu an toàn)
      setSalaries(salaryData as Salary[] || []);
      setProfiles(profileData as Profile[] || []);
      setAttendanceData(attendanceData as AttendanceRecord[] || []); 
      
    } catch (error) {
      toast({
        title: "Lỗi Tải Dữ liệu",
        description: (error as Error).message, // Đã fix lỗi 'any'
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  // Hàm tính giờ làm (Đã fix lỗi 'any')
  const calculateHoursWorked = (userId: string, month: string) => {
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const userAttendance = attendanceData.filter(a => {
      const date = new Date(a.timestamp);
      return a.user_id === userId && date >= monthStart && date <= monthEnd;
    });

    const dateGroups: { [key: string]: AttendanceRecord[] } = {};
    userAttendance.forEach(record => {
      const date = record.timestamp.split('T')[0];
      if (!dateGroups[date]) dateGroups[date] = [];
      dateGroups[date].push(record);
    });

    let totalHours = 0;
    Object.values(dateGroups).forEach(dayRecords => {
      const checkIn = dayRecords.find(r => r.type === 'check_in');
      const checkOut = dayRecords.find(r => r.type === 'check_out');
      
      if (checkIn && checkOut) {
        const hours = (new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    return Math.round(totalHours * 100) / 100;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedMonth || !formData.base_salary) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn nhân viên, tháng và nhập lương cơ bản.",
        variant: "destructive"
      });
      return;
    }

    try {
      const hoursWorked = calculateHoursWorked(selectedUser, selectedMonth);

      const { error } = await supabase
        .from('salaries')
        .upsert({
          user_id: selectedUser,
          month: selectedMonth + '-01',
          base_salary: parseFloat(formData.base_salary),
          bonus: parseFloat(formData.bonus),
          deductions: parseFloat(formData.deductions),
          hours_worked: hoursWorked,
          notes: formData.notes || null
        } as Salary); // Ép kiểu dữ liệu an toàn khi upsert

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Bản ghi lương đã được lưu/cập nhật.",
      });

      setIsDialogOpen(false);
      setFormData({ base_salary: "", bonus: "0", deductions: "0", notes: "" });
      fetchData();
    } catch (error) {
      toast({
        title: "Lỗi Lưu Trữ",
        description: (error as Error).message, // Đã fix lỗi 'any'
        variant: "destructive"
      });
    }
  };

  // Hàm xuất file Excel (Đã fix lỗi 'any')
  const exportToExcel = (type: 'salary' | 'attendance') => {
    if (type === 'salary') {
      const exportData = salaries.map(salary => ({
        'Nhân viên': getUserName(salary.user_id),
        'Email': profiles.find(p => p.id === salary.user_id)?.email || '',
        'Tháng': format(new Date(salary.month), 'MMM yyyy'),
        'Lương Cơ bản (VND)': Number(salary.base_salary).toFixed(2),
        'Thưởng (VND)': Number(salary.bonus).toFixed(2),
        'Khấu trừ (VND)': Number(salary.deductions).toFixed(2),
        'Tổng lương (VND)': Number(salary.total_salary).toFixed(2),
        'Giờ làm việc (h)': Number(salary.hours_worked).toFixed(2),
        'Ghi chú': salary.notes || '',
        'Ngày tạo': format(new Date(salary.created_at), 'yyyy-MM-dd HH:mm')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bản ghi Lương");
      
      const maxWidth = exportData.reduce((w, r) => Math.max(w, r['Nhân viên'].length), 10);
      ws['!cols'] = [
        { wch: maxWidth }, { wch: 25 }, { wch: 12 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 30 }, { wch: 18 }
      ];

      XLSX.writeFile(wb, `BaoCao_Luong_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({ title: "Xuất file thành công", description: "Dữ liệu lương đã được xuất ra Excel" });
    } else {
      exportAttendanceData(); // Gọi hàm export Attendance
    }
  };

  const exportAttendanceData = async () => {
    try {
        const { data: allAttendance, error } = await supabase
            .from('attendance')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1000);

        if (error) throw error;

        const exportData = allAttendance?.map((record: AttendanceRecord) => ({ // Đã fix lỗi 'any'
            'Nhân viên': getUserName(record.user_id),
            'Email': profiles.find(p => p.id === record.user_id)?.email || '',
            'Loại': record.type === 'check_in' ? 'Check In' : 'Check Out',
            'Ngày': format(new Date(record.timestamp), 'yyyy-MM-dd'),
            'Giờ': format(new Date(record.timestamp), 'HH:mm:ss'),
            'Vị trí': record.location || 'N/A',
            'Ghi chú': record.notes || ''
        })) || [];

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bản ghi Chấm công");
        
        ws['!cols'] = [
            { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, 
            { wch: 10 }, { wch: 25 }, { wch: 30 }
        ];

        XLSX.writeFile(wb, `BaoCao_ChamCong_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

        toast({ title: "Xuất file thành công", description: "Dữ liệu chấm công đã được xuất ra Excel" });
    } catch (error) {
        toast({ title: "Xuất file thất bại", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const exportToCSV = (type: 'salary' | 'attendance') => {
    if (type === 'salary') {
      const exportData = salaries.map(salary => ({
        'Employee': getUserName(salary.user_id),
        'Email': profiles.find(p => p.id === salary.user_id)?.email || '',
        'Month': format(new Date(salary.month), 'MMM yyyy'),
        'Base Salary': Number(salary.base_salary).toFixed(2),
        'Bonus': Number(salary.bonus).toFixed(2),
        'Deductions': Number(salary.deductions).toFixed(2),
        'Total Salary': Number(salary.total_salary).toFixed(2),
        'Hours Worked': Number(salary.hours_worked).toFixed(2),
        'Notes': salary.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BaoCao_Luong_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Xuất file thành công", description: "Dữ liệu lương đã được xuất ra CSV" });
    } else {
      exportAttendanceDataCSV();
    }
  };

  const exportAttendanceDataCSV = async () => {
    try {
        const { data: allAttendance, error } = await supabase
            .from('attendance')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1000);

        if (error) throw error;

        const exportData = allAttendance?.map((record: AttendanceRecord) => ({ // Đã fix lỗi 'any'
            'Employee': getUserName(record.user_id),
            'Email': profiles.find(p => p.id === record.user_id)?.email || '',
            'Type': record.type === 'check_in' ? 'Check In' : 'Check Out',
            'Date': format(new Date(record.timestamp), 'yyyy-MM-dd'),
            'Time': format(new Date(record.timestamp), 'HH:mm:ss'),
            'Location': record.location || 'N/A',
            'Notes': record.notes || ''
        })) || [];

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BaoCao_ChamCong_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast({ title: "Xuất file thành công", description: "Dữ liệu chấm công đã được xuất ra CSV" });
    } catch (error) {
        toast({ title: "Xuất file thất bại", description: (error as Error).message, variant: "destructive" });
    }
  };


  // KHẮC PHỤC LỖI 368, 379, 390: Tính toán Stats trước khi return
  const totalPayout = salaries.reduce((sum, s) => sum + Number(s.total_salary), 0);
  const totalBonus = salaries.reduce((sum, s) => sum + Number(s.bonus), 0);
  const totalHours = salaries.reduce((sum, s) => sum + Number(s.hours_worked), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --- 1. THỐNG KÊ TỔNG QUAN --- */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-medium overflow-hidden relative border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Chi Lương</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {/* Đã sửa lỗi Undefined Variable */}
            <div className="text-3xl font-bold">{formatCurrency(totalPayout)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tổng cộng đã chi trả</p>
          </CardContent>
        </Card>

        <Card className="shadow-medium overflow-hidden relative border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Thưởng & Phụ cấp</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {/* Đã sửa lỗi Undefined Variable */}
            <div className="text-3xl font-bold">{formatCurrency(totalBonus)}</div>
            <p className="text-xs text-muted-foreground mt-1">Đã thanh toán</p>
          </CardContent>
        </Card>

        <Card className="shadow-medium overflow-hidden relative border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Giờ Làm</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {/* Đã sửa lỗi Undefined Variable */}
            <div className="text-3xl font-bold">{totalHours.toFixed(0)} giờ</div>
            <p className="text-xs text-muted-foreground mt-1">Theo dõi từ Check-in/out</p>
          </CardContent>
        </Card>
      </div>

      {/* --- 2. BẢN GHI LƯƠNG & CÔNG CỤ QUẢN LÝ --- */}
      <Card className="shadow-strong">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Quản lý Bản ghi Lương</CardTitle>
              <CardDescription>Nhập lương, thưởng, khấu trừ và xem chi tiết theo từng tháng.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToCSV('salary')}><FileSpreadsheet className="h-4 w-4 mr-2" />Xuất CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportToExcel('salary')}><Download className="h-4 w-4 mr-2" />Xuất Excel</Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" /> Thêm Lương</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Thêm/Cập nhật Bản ghi Lương</DialogTitle>
                    <DialogDescription>Tạo hoặc cập nhật thông tin lương cho nhân viên.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nhân viên</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.first_name} {profile.last_name} - {profile.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tháng</Label>
                      <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                      <Label>Lương Cơ bản (VND)</Label>
                      <Input type="number" step="0.01" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Thưởng (VND)</Label>
                        <Input type="number" step="0.01" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <Label>Khấu trừ (VND)</Label>
                        <Input type="number" step="0.01" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ghi chú</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Ghi chú thêm (ví dụ: Lý do thưởng/khấu trừ)..." />
                    </div>

                    <Button type="submit" className="w-full">Lưu Bản ghi Lương</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Tháng</TableHead>
                  <TableHead>Lương CB</TableHead>
                  <TableHead>Thưởng</TableHead>
                  <TableHead>Khấu trừ</TableHead>
                  <TableHead>Giờ làm</TableHead>
                  <TableHead>Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có bản ghi lương nào</TableCell></TableRow>
                ) : (
                  salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{getUserName(salary.user_id)}</TableCell>
                      <TableCell>{format(new Date(salary.month), 'MM/yyyy')}</TableCell>
                      <TableCell>{formatCurrency(Number(salary.base_salary))}</TableCell>
                      <TableCell className="text-success">{formatCurrency(Number(salary.bonus))}</TableCell>
                      <TableCell className="text-destructive">{formatCurrency(Number(salary.deductions))}</TableCell>
                      <TableCell>{Number(salary.hours_worked).toFixed(1)}h</TableCell>
                      <TableCell className="font-bold">{formatCurrency(Number(salary.total_salary))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- 3. XUẤT DỮ LIỆU CHẤM CÔNG --- */}
      <Card className="shadow-strong">
        <CardHeader>
          <CardTitle className="text-xl">Xuất Dữ liệu Chấm công</CardTitle>
          <CardDescription>Xuất toàn bộ bản ghi chấm công để tính lương hoặc báo cáo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => exportToCSV('attendance')} className="flex-1"><FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Chấm công CSV</Button>
            <Button variant="outline" onClick={() => exportToExcel('attendance')} className="flex-1"><Download className="h-4 w-4 mr-2" />Xuất Chấm công Excel</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Xuất tối đa 1,000 bản ghi chấm công gần nhất.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryManagement;