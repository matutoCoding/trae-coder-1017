import { useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronRight,
  User,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routeTitleMap: Record<string, string> = {
  "/": "花田台账",
  "/planting-schedule": "种植排期",
  "/post-harvest": "采后处理",
  "/orders": "订单供货",
  "/logistics": "冷链物流",
  "/customers": "客户管理",
  "/statistics": "产销统计",
};

function getBreadcrumbs(pathname: string): { path: string; title: string }[] {
  const paths = pathname === "/" ? ["/"] : pathname.split("/").filter(Boolean);
  const result: { path: string; title: string }[] = [];
  let currentPath = "";

  if (pathname === "/") {
    return [{ path: "/", title: "花田台账" }];
  }

  for (const segment of paths) {
    currentPath += `/${segment}`;
    const title = routeTitleMap[currentPath] || segment;
    result.push({ path: currentPath, title });
  }

  return result;
}

export function Header() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const notificationCount = 5;

  return (
    <header className="h-16 bg-white border-b border-cream-200 flex items-center px-6 gap-6 flex-shrink-0">
      <nav className="flex items-center gap-2 text-sm">
        <Home className="w-4 h-4 text-forest-400" />
        {breadcrumbs.map((item, index) => (
          <div key={item.path} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-cream-400" />
            <span
              className={cn(
                index === breadcrumbs.length - 1
                  ? "text-forest-800 font-medium"
                  : "text-forest-500"
              )}
            >
              {item.title}
            </span>
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="relative">
        <Search className="w-4 h-4 text-forest-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="搜索花田、订单、客户..."
          className="w-72 pl-9 pr-4 py-2 text-sm bg-cream-50 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all placeholder:text-forest-300"
        />
      </div>

      <button className="relative w-10 h-10 rounded-lg bg-cream-50 border border-cream-200 flex items-center justify-center text-forest-600 hover:bg-cream-100 hover:text-forest-700 transition-colors">
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-warning-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-3 pl-4 border-l border-cream-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-sm">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-forest-800 truncate">张管理员</p>
          <p className="text-xs text-forest-400">基地运营</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
