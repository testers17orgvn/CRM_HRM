import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Clock, Trash2, Edit, Save, Minus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";


// --- INTERFACE CHÍNH XÁC ---
interface ShiftInterface {
    id: string;
    name: string;
    start_time: string; // Định dạng TIME (HH:mm:ss)
    end_time: string;   // Định dạng TIME (HH:mm:ss)
    created_at: string;
    updated_at: string;
}
// --- END INTERFACE ---


const ShiftsManagement = () => {
    // KHẮC PHỤC LỖI: Đã thay 'any[]' bằng 'ShiftInterface[]'
    const [shifts, setShifts] = useState<ShiftInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // STATE CHO CRUD
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', start_time: '', end_time: '' });
    
    const { toast } = useToast();

    // --- LOGIC TẢI DỮ LIỆU ---
    const fetchShifts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .order('start_time');

            if (error) throw error;
            // Ép kiểu an toàn
            setShifts(data as ShiftInterface[] || []);
        } catch (error) {
            console.error('Lỗi tải ca làm việc:', error);
            toast({ title: "Lỗi", description: "Không thể tải danh sách ca làm việc.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]); // Thêm fetchShifts vào dependency

    // --- LOGIC TÍNH TOÁN THỜI LƯỢNG ---
    const calculateDuration = (start: string, end: string) => {
        // Tạo đối tượng Date giả định (ví dụ: ngày 1/1/2000) để tính toán chênh lệch giờ
        const startDate = new Date(`2000-01-01T${start}`);
        let endDate = new Date(`2000-01-01T${end}`);

        // Xử lý ca qua đêm (ví dụ: 22:00 - 06:00)
        if (endDate <= startDate) {
            endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // Thêm 24 giờ
        }

        const diffMilliseconds = endDate.getTime() - startDate.getTime();
        const diffHours = diffMilliseconds / (1000 * 60 * 60);

        // Làm tròn đến 2 chữ số thập phân
        return `${Math.round(diffHours * 100) / 100} giờ`;
    };

    // --- CHỨC NĂNG CRUD ---

    const handleSaveShift = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.start_time || !formData.end_time) {
            toast({ title: "Lỗi", description: "Vui lòng điền đủ tên, giờ bắt đầu và kết thúc.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            
            const payload = {
                name: formData.name,
                start_time: formData.start_time,
                end_time: formData.end_time,
            };

            let error;
            if (isEditMode) {
                // CHẾ ĐỘ SỬA
                ({ error } = await supabase.from('shifts').update(payload).eq('id', formData.id));
            } else {
                // CHẾ ĐỘ THÊM
                ({ error } = await supabase.from('shifts').insert(payload));
            }

            if (error) throw error;

            toast({ title: "Thành công", description: `Ca làm việc '${formData.name}' đã được ${isEditMode ? 'cập nhật' : 'thêm'}.` });
            
            // Đóng modal và reset
            setIsDialogOpen(false);
            setFormData({ id: '', name: '', start_time: '', end_time: '' });
            setIsEditMode(false);
            
            await fetchShifts();
        } catch (error) {
            console.error('Lỗi lưu ca làm việc:', error);
            toast({ title: "Lỗi", description: (error as Error).message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteShift = async (shift: ShiftInterface) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ca làm việc "${shift.name}" (${calculateDuration(shift.start_time, shift.end_time)}) không?`)) {
            return;
        }
        
        try {
            setLoading(true);
            const { error } = await supabase
                .from('shifts')
                .delete()
                .eq('id', shift.id);

            if (error) throw error;

            toast({ title: "Thành công", description: `Ca làm việc '${shift.name}' đã bị xóa.` });
            await fetchShifts(); 
        } catch (error) {
            console.error('Lỗi xóa ca làm việc:', error);
            toast({ title: "Lỗi Xóa", description: (error as Error).message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Khởi tạo chế độ Sửa
    const initEditMode = (shift: ShiftInterface) => {
        setFormData({
            id: shift.id,
            name: shift.name,
            start_time: shift.start_time.substring(0, 5), // Cắt bớt giây nếu cần
            end_time: shift.end_time.substring(0, 5),     // Cắt bớt giây nếu cần
        });
        setIsEditMode(true);
        setIsDialogOpen(true);
    };
    
    // Khởi tạo chế độ Thêm
    const initAddMode = () => {
        setFormData({ id: '', name: '', start_time: '', end_time: '' });
        setIsEditMode(false);
        setIsDialogOpen(true);
    };


    // --- UI RENDER ---

    if (loading) {
        return <div className="p-6 text-center"><Loader2 className="h-6 w-6 inline animate-spin mr-2" /> Đang tải dữ liệu ca làm việc...</div>;
    }

    return (
        <div className="space-y-6 p-4">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-primary">
                <Clock className="h-7 w-7 text-primary" /> QUẢN LÝ CA LÀM VIỆC
            </h1>

            <div className="flex justify-between items-center">
                 <p className="text-muted-foreground">Tổng cộng: **{shifts.length}** ca làm việc</p>
                
                {/* Nút THÊM CA LÀM */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90" onClick={initAddMode}>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm Ca làm
                        </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Cập nhật' : 'Thêm'} Ca làm việc</DialogTitle>
                            <DialogDescription>Nhập giờ bắt đầu và kết thúc ca làm (HH:MM).</DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSaveShift} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên Ca làm việc</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Giờ Bắt đầu</Label>
                                    <Input id="start_time" type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="end_time">Giờ Kết thúc</Label>
                                    <Input id="end_time" type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required />
                                </div>
                            </div>
                            
                            <Button type="submit" className="w-full mt-4" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isEditMode ? 'Lưu Cập nhật' : 'Thêm Ca làm'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* BẢNG HIỂN THỊ DỮ LIỆU */}
            <div className="border rounded-xl shadow-lg overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[200px] text-primary">Tên Ca</TableHead>
                            <TableHead className="w-[150px]">Bắt đầu</TableHead>
                            <TableHead className="w-[150px]">Kết thúc</TableHead>
                            <TableHead className="w-[120px]">Thời lượng</TableHead>
                            <TableHead className="w-[100px] text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shifts.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Chưa có ca làm việc nào được tạo.</TableCell></TableRow>
                        ) : (
                            shifts.map((shift) => (
                                <TableRow key={shift.id} className="hover:bg-secondary/30 transition-colors">
                                    <TableCell className="font-semibold text-base text-primary">
                                        {shift.name}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{shift.start_time.substring(0, 5)}</TableCell>
                                    <TableCell className="text-sm font-medium">{shift.end_time.substring(0, 5)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {calculateDuration(shift.start_time, shift.end_time)}
                                    </TableCell>
                                    
                                    {/* NÚT HÀNH ĐỘNG */}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Mở menu</span>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                                <DropdownMenuItem 
                                                    onClick={() => initEditMode(shift)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> Sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteShift(shift)}
                                                    className="text-red-600 hover:!bg-red-500/10 focus:!bg-red-500/10 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ShiftsManagement;