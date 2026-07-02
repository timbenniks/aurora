import {
  InboxIcon,
  LayoutDashboardIcon,
  RocketIcon,
  SettingsIcon,
  BoxesIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean
) {
  if (exact) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/launch",
    label: "Launch room",
    icon: RocketIcon,
  },
  {
    href: "/workspaces",
    label: "Workspaces",
    icon: BoxesIcon,
  },
  {
    href: "/inbox",
    label: "Merge inbox",
    icon: InboxIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
]
