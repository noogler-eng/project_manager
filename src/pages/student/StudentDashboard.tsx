import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Project, Team } from '../../lib/types';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FolderKanban, Users, Clock, CalendarClock } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, studentProfile } = useAuthStore();
  const { projects, fetchUserProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        await fetchUserProjects(user.id);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, fetchUserProjects]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const calculateDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        {studentProfile && (
          <p className="mt-1 text-gray-500">
            {studentProfile.college_name} | Semester {studentProfile.semester} | Section {studentProfile.section} | USN {studentProfile.usn}
          </p>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">
            You haven't been assigned to any projects yet. Check back later or contact your instructor.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                to={`/projects/${project.id}`}
                key={project.id}
                className="block transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              >
                <Card className="h-full">
                  <CardHeader className="flex items-start justify-between bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        By {project.admin?.name || 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(project.status)}>
                      {getStatusText(project.status)}
                    </Badge>
                  </CardHeader>
                  <CardBody className="flex flex-col h-full">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {project.description}
                    </p>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarClock className="h-4 w-4 mr-1.5" />
                        <span>Created: {formatDate(project.created_at)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1.5" />
                        <span>
                          {calculateDaysRemaining(project.deadline) > 0
                            ? `${calculateDaysRemaining(project.deadline)} days remaining`
                            : 'Deadline passed'}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;