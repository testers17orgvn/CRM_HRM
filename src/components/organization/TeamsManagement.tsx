import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Loader2, Users, Edit, Trash2, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";


// --- INTERFACES ---
interface LeaderProfile { first_name: string; last_name: string; }
interface Team {
    id: string;
    name: string;
    description: string | null;
    leader_id: string | null;
    created_at: string;
    updated_at: string;
    leader_profile: LeaderProfile[] | null; 
}

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string; 
}
// --- END INTERFACES ---


const TeamsManagement = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', description: '', leader_id: '' });
    
    const { toast } = useToast();

    const getLeaderName = (team: Team) => {
        const profile = team.leader_profile && team.leader_profile.length > 0 ? team.leader_profile[0] : null;

        if (profile) {
            return `${profile.first_name} ${profile.last_name}`;
        }
        if (team.leader_id) {
            return `ID: ${team.leader_id.substring(0, 8)}...`;
        }
        return '— Chưa chỉ định';
    };

    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true);
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select(`
                    *,
                    leader_profile:profiles ( 
                        first_name,
                        last_name,
                        email 
                    )
                `) 
                .order('name');
            
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email');


            if (teamError) throw teamError;
            if (profileError) throw profileError;

            setTeams(teamData as Team[] || []);
            setProfiles(profileData as Profile[] || []);

        } catch (error) {
            console.error('Lỗi tải đội nhóm:', error);
            toast({ title: "Lỗi", description: "Không thể tải danh sách đội nhóm.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // --- CHỨC NĂNG DELETE ---
    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa đội nhóm "${teamName}" không? Hành động này không thể hoàn tác.`)) {
            return;
        }
        
        try {
            setLoading(true);
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (error) throw error;

            toast({ title: "Thành công", description: `Đội nhóm '${teamName}' đã bị xóa.` });
            await fetchTeams();
        } catch (error) {
            console.error('Lỗi xóa đội nhóm:', error);
            toast({ title: "Lỗi Xóa", description: (error as Error).message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    // --- CHỨC NĂNG SỬA/THÊM (HANDLE SAVE) ---
    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast({ title: "Lỗi", description: "Tên đội nhóm không được để trống.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const leaderId = formData.leader_id === "none" ? null : formData.leader_id || null;
            
            const baseQuery = supabase.from('teams');
            
            const payload = {
                name: formData.name,
                description: formData.description,
                leader_id: leaderId,
            };

            let error;
            if (isEditMode) {
                ({ error } = await baseQuery.update(payload).eq('id', formData.id));
            } else {
                ({ error } = await baseQuery.insert(payload));
            }

            if (error) throw error;

            toast({ title: "Thành công", description: `Đội nhóm '${formData.name}' đã được ${isEditMode ? 'cập nhật' : 'thêm'}.` });
            
            setIsDialogOpen(false);
            setFormData({ id: '', name: '', description: '', leader_id: '' });
            setIsEditMode(false);
            
            await fetchTeams();

        } catch (error) {
            console.error('Lỗi lưu đội nhóm:', error);
            toast({ title: "Lỗi", description: (error as Error).message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const initEditMode = (team: Team) => {
        setFormData({
            id: team.id,
            name: team.name,
            description: team.description || '',
            leader_id: team.leader_id || 'none', // Dùng 'none' cho Select
        });
        setIsEditMode(true);
        setIsDialogOpen(true);
    };
    
    const initAddMode = () => {
        setFormData({ id: '', name: '', description: '', leader_id: 'none' });
        setIsEditMode(false);
        setIsDialogOpen(true);
    };


    // --- UI PHỤ TRỢ ---

    if (loading) {
        return <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-6 w-6 inline animate-spin mr-2" /> Đang tải dữ liệu...</div>;
    }

    return (
        <div className="space-y-6 p-4">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Users className="h-7 w-7 text-primary" /> QUẢN LÝ ĐỘI NHÓM
            </h1>

            <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4">
                    <div>
                        <CardTitle className="text-xl font-semibold">Danh sách Đội nhóm ({teams.length})</CardTitle>
                        <CardDescription>Quản lý các đội nhóm, trưởng nhóm và mô tả công việc.</CardDescription>
                    </div>
                    
                    {/* Nút THÊM ĐỘI NHÓM */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90" onClick={initAddMode}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm Đội nhóm
                            </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{isEditMode ? 'Cập nhật' : 'Thêm'} Đội nhóm</DialogTitle>
                                <DialogDescription>{isEditMode ? 'Chỉnh sửa chi tiết đội nhóm đã chọn.' : 'Nhập chi tiết thông tin đội nhóm mới.'}</DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleSaveTeam} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên Đội nhóm</Label>
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="leader">Leader (Trưởng nhóm)</Label>
                                    <Select 
                                        value={formData.leader_id || 'none'} 
                                        onValueChange={(value) => setFormData({ ...formData, leader_id: value })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Chọn Trưởng nhóm (Tùy chọn)" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key="none" value="none">— Chưa chỉ định —</SelectItem>
                                            {profiles.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.first_name} {p.last_name} ({p.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <Button type="submit" className="w-full mt-4" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {isEditMode ? 'Lưu Cập nhật' : 'Thêm Đội nhóm'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[200px] text-primary">Tên Đội nhóm</TableHead>
                                    <TableHead className="min-w-[250px]">Mô tả</TableHead>
                                    <TableHead className="w-[200px]">Leader</TableHead>
                                    <TableHead className="w-[150px]">Ngày Tạo</TableHead>
                                    <TableHead className="w-[80px] text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                            Chưa có đội nhóm nào được tạo.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    teams.map((team) => (
                                        <TableRow key={team.id} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                                            <TableCell className="font-semibold text-base text-primary">{team.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{team.description || '—'}</TableCell>
                                            <TableCell className="font-medium text-sm">{getLeaderName(team)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{format(new Date(team.created_at), 'dd/MM/yyyy')}</TableCell>
                                            
                                            {/* NÚT HÀNH ĐỘNG */}
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Mở menu</span>
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                                        <DropdownMenuItem 
                                                            onClick={() => initEditMode(team)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" /> Sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteTeam(team.id, team.name)}
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
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamsManagement;