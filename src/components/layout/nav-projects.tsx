"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  type: 'fiscal-year' | 'quarter' | 'audit' | 'budget' | 'client'
  status: 'active' | 'completed' | 'planned'
  startDate: string
  endDate?: string
  budget?: number
  clientCount?: number
  progress?: number
}

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Fiscal Year 2024',
    type: 'fiscal-year',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 2500000,
    progress: 85
  },
  {
    id: '2',
    name: 'Q4 2024 Reporting',
    type: 'quarter',
    status: 'active',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    budget: 750000,
    progress: 60
  }
]

const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'completed': return 'bg-blue-500'
    case 'planned': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

const getStatusText = (status: Project['status']) => {
  switch (status) {
    case 'active': return 'Active'
    case 'completed': return 'Completed'
    case 'planned': return 'Planned'
    default: return 'Unknown'
  }
}

const getTypeIcon = (type: Project['type']) => {
  switch (type) {
    case 'fiscal-year': return <Calendar className="h-3 w-3" />;
    case 'quarter': return <TrendingUp className="h-3 w-3" />;
    case 'audit': return <FileText className="h-3 w-3" />;
    case 'budget': return <DollarSign className="h-3 w-3" />;
    case 'client': return <Users className="h-3 w-3" />;
    default: return <FileText className="h-3 w-3" />;
  }
}

export function NavProjects() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [activeProject, setActiveProject] = useState<string>('1')
  const router = useRouter()

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        if (parsedProjects.length > 0 && !activeProject) {
          setActiveProject(parsedProjects[0].id);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  }, []);

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId)
    // Navigate to projects page with the selected project
    router.push('/projects')
  }

  // Show only first 5 projects in sidebar
  const displayedProjects = projects.slice(0, 5)

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
        {!isCollapsed && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {projects.length}
          </Badge>
        )}
      </Button>

      {!isCollapsed && (
        <div className="mt-1 space-y-1 pl-6">
          {displayedProjects.map((project) => {
            const isActive = activeProject === project.id

            return (
              <Button
                key={project.id}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start text-sm h-auto p-2"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getTypeIcon(project.type)}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{project.name}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getStatusText(project.status)}</span>
                      {project.budget && (
                        <span>• ${(project.budget / 1000000).toFixed(1)}M</span>
                      )}
                      {project.clientCount && (
                        <span>• {project.clientCount} clients</span>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}

          {projects.length > 5 && (
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-8 text-muted-foreground"
              onClick={() => router.push('/projects')}
            >
              <Folder className="mr-2 h-3 w-3" />
              View All ({projects.length})
            </Button>
          )}
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