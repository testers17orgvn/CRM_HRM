import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, getCurrentUser } from "@/lib/auth";
import { Loader2 } from "lucide-react"; 

// --- Custom Constants ---
const APP_NAME = "LifeOS HRM AI";
const LOGO_PATH = "/LOGO.PNG"; // Đường dẫn đến logo tổ chức

const Login = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupFirstName, setSignupFirstName] = useState("");
    const [signupLastName, setSignupLastName] = useState("");

    // --- Logic: Kiểm tra Auth và Redirect ---
    useEffect(() => {
        const checkUser = async () => {
            const user = await getCurrentUser();
            if (user) {
                navigate("/dashboard");
            }
        };
        checkUser();
    }, [navigate]);

    // --- Xử lý Đăng nhập ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await signIn(loginEmail, loginPassword);
            
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Đăng nhập Thất bại",
                    description: error.message
                });
                return;
            }

            toast({
                title: "Chào mừng trở lại!",
                description: "Đăng nhập thành công, đang kiểm tra quyền..."
            });
            // Giả định logic kiểm tra quyền nằm trong /dashboard hoặc AuthProvider
            navigate("/dashboard"); 
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi Hệ thống",
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Xử lý Đăng ký ---
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await signUp(signupEmail, signupPassword, {
                first_name: signupFirstName,
                last_name: signupLastName
            });
            
            if (error) {
                toast({
                    variant: "destructive",
                    title: "Đăng ký Thất bại",
                    description: error.message
                });
                return;
            }

            toast({
                title: "Tạo tài khoản Thành công!",
                description: "Tài khoản của bạn đã được tạo và đang chờ phê duyệt từ Admin."
            });
            // Giữ nguyên ở trang này, chờ người dùng đọc thông báo
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi Hệ thống",
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-lg animate-fade-in">
                
                {/* --- HEADER/LOGO --- */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <img 
                            src={LOGO_PATH} 
                            alt="Logo Tổ chức" 
                            className="w-16 h-16 rounded-xl shadow-xl shadow-primary/30 object-contain"
                        />
                        <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">
                            {APP_NAME}
                        </h1>
                    </div>
                    <p className="text-md text-muted-foreground">Nền tảng Quản trị Nhân sự và Vận hành</p>
                </div>

                {/* --- LOGIN/SIGNUP CARD --- */}
                <Card className="shadow-2xl border-2 border-border/70 transform hover:shadow-primary/20 transition-all duration-300">
                    <Tabs defaultValue="login" className="w-full">
                        
                        {/* Tab Headers */}
                        <CardHeader className="pt-6 pb-0">
                            <TabsList className="grid w-full grid-cols-2 h-12 text-lg">
                                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                                {/* LỖI ĐÃ ĐƯỢC SỬA Ở ĐÂY */}
                                <TabsTrigger value="signup">Đăng ký</TabsTrigger> 
                            </TabsList>
                        </CardHeader>

                        {/* --- TAB CONTENT: ĐĂNG NHẬP --- */}
                        <TabsContent value="login">
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-6 pt-6">
                                    <CardTitle className="text-2xl">Chào mừng trở lại</CardTitle>
                                    <CardDescription>
                                        Nhập thông tin xác thực để truy cập hệ thống quản lý
                                    </CardDescription>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email">Email Công ty</Label>
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="tenban@congty.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">Mật khẩu</Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                            {/* Link Quên mật khẩu */}
                                            <p className="text-sm text-right text-primary hover:underline cursor-pointer pt-1" onClick={() => navigate("/auth/forgot-password")}>
                                                Quên mật khẩu?
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                
                                <CardFooter>
                                    <Button type="submit" className="w-full h-10 text-base gradient-primary shadow-lg shadow-primary/30" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            "Đăng nhập"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>

                        {/* --- TAB CONTENT: ĐĂNG KÝ --- */}
                        <TabsContent value="signup">
                            <form onSubmit={handleSignup}>
                                <CardContent className="space-y-6 pt-6">
                                    <CardTitle className="text-2xl">Tạo Tài khoản</CardTitle>
                                    <CardDescription>
                                        Đăng ký để bắt đầu sử dụng {APP_NAME}. Tài khoản sẽ chờ phê duyệt.
                                    </CardDescription>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* First Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-firstname">Tên</Label>
                                            <Input
                                                id="signup-firstname"
                                                type="text"
                                                placeholder="Văn"
                                                value={signupFirstName}
                                                onChange={(e) => setSignupFirstName(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {/* Last Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-lastname">Họ</Label>
                                            <Input
                                                id="signup-lastname"
                                                type="text"
                                                placeholder="Nguyễn"
                                                value={signupLastName}
                                                onChange={(e) => setSignupLastName(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email Công ty</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="tenban@congty.com"
                                            value={signupEmail}
                                            onChange={(e) => setSignupEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Mật khẩu</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                        <p className="text-xs text-muted-foreground pt-1">Mật khẩu tối thiểu 6 ký tự.</p>
                                    </div>
                                </CardContent>
                                
                                <CardFooter>
                                    <Button type="submit" className="w-full h-10 text-base gradient-primary shadow-lg shadow-primary/30" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang gửi yêu cầu...
                                            </>
                                        ) : (
                                            "Tạo Tài khoản"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
};

export default Login;