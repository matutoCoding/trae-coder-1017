import { NavLink } from "react-router-dom";
import {
  Flower2,
  Leaf,
  Sprout,
  CalendarDays,
  Scissors,
  ClipboardList,
  Truck,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "花田台账", path: "/", icon: Sprout },
  { title: "种植排期", path: "/planting-schedule", icon: CalendarDays },
  { title: "采后处理", path: "/post-harvest", icon: Scissors },
  { title: "订单供货", path: "/orders", icon: ClipboardList },
  { title: "冷链物流", path: "/logistics", icon: Truck },
  { title: "客户管理", path: "/customers", icon: Users },
  { title: "产销统计", path: "/statistics", icon: BarChart3 },
];

export function Sidebar() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <aside className="w-[260px] h-screen bg-forest-800 text-white flex flex-col flex-shrink-0">
      <div className="px-6 py-6 border-b border-forest-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center">
            <Flower2 className="w-6 h-6 text-chrysanthemum-400" />
            <Leaf className="w-4 h-4 text-forest-300 absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif tracking-wide">花语田源</h1>
          </div>
        </div>
        <p className="text-xs text-forest-300 ml-[52px] tracking-wider">
          殡仪鲜花种植供应系统
        </p>
      </div>

      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-forest-600 text-white shadow-md"
                      : "text-forest-100 hover:bg-forest-700 hover:text-white"
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-forest-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-forest-600 flex items-center justify-center ring-2 ring-forest-500">
            <Users className="w-4 h-4 text-forest-100" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">基地管理员</p>
            <p className="text-xs text-forest-300">管理权限</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-forest-300">
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{dateStr}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
