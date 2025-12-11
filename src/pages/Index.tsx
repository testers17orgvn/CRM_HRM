import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { ArrowRight, Zap, Users, BarChart3 } from "lucide-react";

// --- Custom Constants ---
const APP_NAME = "LifeOS HRM AI";
const LOGO_PATH = "/LOGO.PNG";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Quản Lý Nhân Viên",
    description: "Quản lý toàn bộ thông tin nhân sự, vai trò, và quyền hạn"
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Bảng Điều Khiển",
    description: "Xem thống kê và báo cáo chi tiết theo thời gian thực"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Tự Động Hóa Quy Trình",
    description: "Tự động hóa công việc, phê duyệt, và quản lý dữ liệu"
  }
];

const Index = () => {
  const navigate = useNavigate();

  // Logic Redirect: Chuyển hướng người dùng dựa trên trạng thái tài khoản
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        // Check account status
        const profile = await getUserProfile(user.id);
        if (profile?.account_status === 'APPROVED') {
          // User is approved, go to dashboard
          navigate("/dashboard");
        } else if (profile?.account_status === 'PENDING' || profile?.account_status === 'REJECTED') {
          // User is pending or rejected, redirect to pending approval page
          navigate("/auth/pending-approval");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

        {/* Main Content Card */}
        <div className="flex flex-col items-center max-w-2xl w-full mb-12">

          {/* Logo and App Name */}
          <div className="flex flex-col items-center gap-6 mb-12 animate-fade-in-down">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-full blur-xl opacity-50"></div>
              <img
                src={LOGO_PATH}
                alt={`${APP_NAME} Logo`}
                className="relative w-24 h-24 rounded-full object-cover shadow-2xl ring-4 ring-primary/30"
              />
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {APP_NAME}
              </h1>
              <p className="text-lg text-slate-300">
                Nền tảng quản lý nhân sự thông minh với AI
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 w-full mb-12">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-all duration-300 hover:bg-white/10 hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Auth Card */}
          <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in backdrop-blur-sm">

            <div className="space-y-6">
              {/* Heading */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Bắt Đầu Ngay
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Truy cập hệ thống quản lý nhân sự của bạn
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Button 1: Đăng ký */}
                <Button
                  size="lg"
                  className="w-full text-base font-semibold px-8 py-6 h-auto rounded-lg shadow-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                  onClick={() => navigate("/auth/login")}
                >
                  <span>Đăng Ký Tài Khoản Mới</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {/* Button 2: Đăng nhập */}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-base font-semibold px-8 py-6 h-auto rounded-lg border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300"
                  onClick={() => navigate("/auth/login")}
                >
                  <span>Đã Có Tài Khoản? Đăng Nhập</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Hoặc
                  </span>
                </div>
              </div>

              {/* Help Text */}
              <div className="text-center text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>Cần hỗ trợ?</p>
                <a href="mailto:support@hrm.local" className="text-primary hover:underline font-medium">
                  Liên hệ với chúng tôi
                </a>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-sm text-slate-400 space-y-2">
            <p>© 2024 {APP_NAME}. Tất cả quyền được bảo lưu.</p>
            <p className="text-xs">Hệ thống quản lý nhân sự được bảo vệ bằng mã hóa SSL</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Animations
const styles = `
.animate-fade-in-down {
  animation: fadeInDown 0.8s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards 0.2s;
  opacity: 0;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`;

const StyleInjector = () => (
  <style dangerouslySetInnerHTML={{ __html: styles }} />
);

export default Index;
