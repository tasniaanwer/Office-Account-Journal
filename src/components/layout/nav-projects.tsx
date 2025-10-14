"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

const projects = [
  {
    name: 'Fiscal Year 2024',
    href: '/projects/fy2024',
    isActive: true,
  },
  {
    name: 'Q4 2024',
    href: '/projects/q4-2024',
    isActive: false,
  },
  {
    name: 'Budget Planning',
    href: '/projects/budget',
    isActive: false,
  },
]

export function NavProjects() {
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <div className="px-3 py-2">
      <Button
        variant="ghost"
        className="w-full justify-start px-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="mr-2 h-4 w-4" />
        ) : (
          <ChevronDown className="mr-2 h-4 w-4" />
        )}
        <span className="text-sm font-medium">Projects</span>
      </Button>

      {!isCollapsed && (
        <div className="mt-1 space-y-1 pl-6">
          {projects.map((project) => (
            <Button
              key={project.href}
              variant={project.isActive ? "secondary" : "ghost"}
              className="w-full justify-start text-sm h-8"
            >
              <Folder className="mr-2 h-3 w-3" />
              {project.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export function NavProjectsSkeleton() {
  return (
    <div className="px-3 py-2">
      <Skeleton className="h-8 w-full" />
      <div className="mt-1 space-y-1 pl-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}