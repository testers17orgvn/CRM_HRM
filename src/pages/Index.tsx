import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, CheckSquare, Calendar, TrendingUp, Shield, Zap,
  Settings, Bot 
} from "lucide-react"; 
import { getCurrentUser } from "@/lib/auth";

// --- Custom Constants ---
const APP_NAME = "LifeOS HRM AI";
const LOGO_PATH = "/logo.png"; // Đường dẫn đến logo trong thư mục public

// Danh sách các tính năng cốt lõi
const FEATURES = [
  {
    icon: Users,
    title: "Quản lý Tổ chức & Vai trò",
    description: "Quản lý đội nhóm, phòng ban và phân cấp người dùng hiệu quả với bảo mật RLS."
  },
  {
    icon: CheckSquare,
    title: "Chấm công GPS Thông minh",
    description: "Check-in/Check-out thời gian thực với xác thực vị trí GPS chính xác (Công thức Haversine)."
  },
  {
    icon: Bot,
    title: "Tóm tắt Cuộc họp AI",
    description: "Tự động tạo tóm tắt thông minh và ghi chú hành động (Action Items) từ bản ghi cuộc họp."
  },
  {
    icon: Settings,
    title: "Tự động hóa Quy trình",
    description: "Xây dựng các luồng công việc tự động (n8n-like) cho phê duyệt và tác vụ."
  },
  {
    icon: TrendingUp,
    title: "Phân tích Hiệu suất",
    description: "Dashboard theo vai trò, chấm điểm đánh giá và báo cáo hiệu suất toàn diện."
  },
  {
    icon: Shield,
    title: "Bảo mật Cấp Doanh nghiệp",
    description: "Bảo vệ bởi Supabase RLS, JWT, và kiểm soát truy cập dựa trên vai trò đa cấp."
  }
];

const Index = () => {
  const navigate = useNavigate();

  // Logic Redirect: Chuyển hướng người dùng đã đăng nhập về Dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* --- 1. HERO SECTION: Giới thiệu và Kêu gọi hành động --- */}
      <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-48 gradient-secondary">
        <div className="container mx-auto px-4 text-center animate-fade-in">
          <div className="flex flex-col items-center max-w-5xl mx-auto">
            
            {/* Logo and App Name */}
            <div className="flex items-center gap-3 mb-6">
                <img 
                    src="/LOGO.PNG" 
                    alt="Logo Tổ chức" 
                    className="w-16 h-16 rounded-full shadow-xl shadow-primary/30"
                />
                <p className="text-xl font-bold text-primary tracking-widest uppercase">
                    {APP_NAME}
                </p>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow">
                CRM {" "}
              </span>
             HRM
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
              Giải pháp toàn diện cho vận hành và nguồn nhân lực, được tăng cường sức mạnh bởi AI và bảo mật Supabase.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="xl" 
                className="text-lg px-10 h-14 shadow-2xl shadow-primary/40 gradient-primary transition-all hover:scale-[1.03] transform"
                onClick={() => navigate("/auth/login")}
              >
                Truy cập Dashboard
              </Button>
              <Button 
                size="xl"
                variant="outline" 
                className="text-lg px-10 h-14 border-2 border-border/80 transition-all hover:bg-muted"
                onClick={() => navigate("/auth/login")}
              >
                Đăng nhập
              </Button>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-border/50" />

      {/* --- 2. FEATURES GRID: Lưới tính năng --- */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <p className="text-sm font-semibold uppercase text-primary mb-2 tracking-widest">
            CÁC PHÂN HỆ CỐT LÕI
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Toàn diện và Phù hợp theo Vai trò
          </h2>
          <p className="text-lg text-muted-foreground">
            Từ chấm công GPS liền mạch đến tự động hóa quy trình và chấm điểm hiệu suất, chúng tôi cung cấp mọi thứ doanh nghiệp bạn cần.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {FEATURES.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-card border border-border shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/50 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 shadow-medium">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-base text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-border/50" />

      {/* --- 3. CTA SECTION: Kêu gọi hành động cuối cùng --- */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center bg-card rounded-3xl p-12 md:p-16 shadow-2xl border-2 border-border/70 transform hover:scale-[1.01] transition-all duration-500">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Sẵn sàng chuyển đổi quy trình HR của bạn?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Truy cập ngay vào dashboard cá nhân hóa, bảo mật, tốc độ cao và sẵn sàng mở rộng quy mô.
          </p>
          <Button 
            size="xl" 
            className="text-lg px-12 h-14 shadow-2xl shadow-primary/40 gradient-primary transition-all hover:scale-105"
            onClick={() => navigate("/auth/login")}
          >
            Đăng nhập ngay →
          </Button>
        </div>
      </section>

      <hr className="border-t border-border/50" />

      {/* --- 4. FOOTER --- */}
      <footer className="bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="text-sm">
            © {new Date().getFullYear()} {APP_NAME}. Được xây dựng bởi Phòng CNTT.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;