import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

const AdminCreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createProject } = useProjectStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    deadline: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !user?.id) return;
    
    setLoading(true);
    
    try {
      const { error } = await createProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        admin_id: user.id,
        status: formData.status as 'pending' | 'in_progress' | 'completed',
        deadline: formData.deadline,
      });
      
      if (error) {
        toast.error('Failed to create project. Please try again.');
      } else {
        toast.success('Project created successfully!');
        navigate('/admin/projects');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-3"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="bg-gray-50">
            <h2 className="font-semibold text-gray-800">Project Details</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <Input
              label="Project Title"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="Enter project title"
              disabled={loading}
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className={`
                  block w-full rounded-md shadow-sm sm:text-sm
                  border-gray-300 focus:ring-primary-500 focus:border-primary-500
                  ${errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                `}
                placeholder="Enter project description"
                disabled={loading}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Status"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
                disabled={loading}
              />

              <Input
                label="Deadline"
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                error={errors.deadline}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
          </CardBody>
          <CardFooter className="bg-gray-50 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="mr-3"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Create Project
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default AdminCreateProject;