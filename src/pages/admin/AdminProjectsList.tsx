import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  FolderKanban,
  Trash2,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProjectsList: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchUserProjects, deleteProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        await fetchUserProjects(user.id);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, fetchUserProjects]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setDeleteLoading(id);
      
      try {
        const { error } = await deleteProject(id);
        
        if (error) {
          toast.error('Failed to delete project. Please try again.');
        } else {
          toast.success('Project deleted successfully!');
        }
      } catch (err) {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setDeleteLoading(null);
      }
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

  const filterProjects = () => {
    return projects.filter((project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
                           
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
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

  const filteredProjects = filterProjects();

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-500">Manage all your projects</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/admin/projects/new">
            <Button leftIcon={<Plus size={16} />} className="transition-transform duration-300 hover:scale-105">
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center bg-white rounded-lg border border-gray-200 py-12">
          <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {searchTerm || statusFilter !== 'all' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching projects</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first project to get started.
              </p>
              <Link to="/admin/projects/new">
                <Button leftIcon={<Plus size={16} />}>Create Project</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              to={`/admin/projects/${project.id}`}
              key={project.id}
              className="block transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              <Card className="h-full">
                <CardHeader className="flex items-start justify-between bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{project.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created: {formatDate(project.created_at)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </CardHeader>
                <CardBody className="flex flex-col h-full">
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {project.description}
                  </p>
                  <div className="mt-auto flex justify-end space-x-2">
                    <Link to={`/admin/projects/${project.id}`} className="block">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit className="h-4 w-4" />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={(e) => handleDelete(project.id, e)}
                      isLoading={deleteLoading === project.id}
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectsList;