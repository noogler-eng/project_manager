import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useStudentStore } from '../../store/studentStore';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  FolderKanban,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchUserProjects } = useProjectStore();
  const { students, fetchStudents } = useStudentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        await Promise.all([
          fetchUserProjects(user.id),
          fetchStudents(),
        ]);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, fetchUserProjects, fetchStudents]);

  const getProjectStats = () => {
    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
    };
  };

  const getRecentProjects = () => {
    return [...projects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusVariant = (status: string): 'warning' | 'primary' | 'success' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const stats = getProjectStats();
  const recentProjects = getRecentProjects();

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">Manage your projects and students</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/admin/projects/new">
            <Button leftIcon={<Plus size={16} />} className="transition-transform duration-300 hover:scale-105">
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="bg-gradient-to-br from-primary-50 to-white">
          <CardBody className="flex items-center py-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary-100 text-primary-700 mr-4">
              <FolderKanban size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <h4 className="text-2xl font-bold text-gray-900">{stats.total}</h4>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <CardBody className="flex items-center py-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <h4 className="text-2xl font-bold text-gray-900">{stats.pending}</h4>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardBody className="flex items-center py-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <h4 className="text-2xl font-bold text-gray-900">{stats.inProgress}</h4>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardBody className="flex items-center py-6">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-green-100 text-green-700 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <h4 className="text-2xl font-bold text-gray-900">{stats.completed}</h4>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
              <Link to="/admin/projects">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No projects yet. Create your first project!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/admin/projects/${project.id}`}
                      className="block hover:bg-gray-50 transition-colors p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.title}</h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                            {project.description}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Created on {formatDate(project.created_at)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Students */}
        <div>
          <Card>
            <CardHeader className="flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Students</h2>
              <Link to="/admin/students">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students registered yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {students.slice(0, 5).map((student) => (
                    <div key={student.id} className="p-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-3">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{student.name}</h3>
                          <p className="text-xs text-gray-500">
                            {student.student_profile?.usn || 'No USN'} | {student.student_profile?.semester || '-'} Sem
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;