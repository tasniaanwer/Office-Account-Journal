"use client"

import { LayoutDashboard, FolderTree, Receipt, FileText, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface NavMainProps {
  items: Array<{
    title: string
    href: string
    icon: string
    description?: string
  }>
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  // Map icon names to Lucide icons
  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'layout-dashboard': <LayoutDashboard className="h-4 w-4" />,
      'account-tree': <FolderTree className="h-4 w-4" />,
      'receipt': <Receipt className="h-4 w-4" />,
      'file-text': <FileText className="h-4 w-4" />,
      'settings': <Settings className="h-4 w-4" />,
    }
    return iconMap[iconName] || <div className="h-4 w-4 flex items-center justify-center"><span className="text-xs">{iconName[0]?.toUpperCase()}</span></div>
  }

  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
        Main Menu
      </h2>
      <div className="space-y-1">
        {items.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href}>
              {getIcon(item.icon)}
              <span className="ml-2">{item.title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function NavMainSkeleton() {
  return (
    <div className="px-3 py-2">
      <div className="mb-2 px-4">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}