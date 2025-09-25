import { 
    Sidebar, 
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenuItem,
    SidebarMenuButton,
} from './ui/sidebar'
import { Home, ChartScatter } from 'lucide-react'

const items = [
    {
        title: 'Home',
        href: '/user/dashboard',
        icon: Home,
    },
    {
        title: 'Predictions',
        href: '/user/predictions',
        icon: ChartScatter,
    }
]

export function SideNavbar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>ClutchCall</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {items.map((item) => (
                            <SidebarMenuItem key = {item.title}>
                                <SidebarMenuButton asChild>
                                    <a href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}