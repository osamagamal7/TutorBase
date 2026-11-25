import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function AppSidebar() {
  const isStudent = false;
  const isTutor = true;
  const role = isStudent ? 'student' : isTutor ? 'tutor' : 'admin';

  const menuItems =
    role === 'student'
      ? [
          {
            label: 'Dashboard',
            href: '/dashboard',
            icon: 'dashboard',
          },
          {
            label: 'Courses',
            href: '/courses',
            icon: 'book',
          },
          { label: 'Settings', href: '/settings', icon: 'settings' },
        ]
      : role === 'tutor'
        ? [
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'settings', href: '/settings', icon: 'settings' },
            { label: 'availablitity', href: '/availability', icon: 'book' },
          ]
        : [];
  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-2xl font-bold">Tutorbase</h1>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton render={<Link href={item.href} />}>
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
