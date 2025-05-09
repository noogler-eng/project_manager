import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, School, BookOpen, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'student',
    collegeName: '',
    semester: '',
    section: '',
    usn: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    
    if (formData.role === 'student') {
      if (!formData.collegeName) newErrors.collegeName = 'College name is required';
      if (!formData.semester) newErrors.semester = 'Semester is required';
      else if (isNaN(Number(formData.semester)) || Number(formData.semester) < 1 || Number(formData.semester) > 8) {
        newErrors.semester = 'Semester must be between 1 and 8';
      }
      if (!formData.section) newErrors.section = 'Section is required';
      if (!formData.usn) newErrors.usn = 'USN is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const { error } = await register(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: formData.role as 'student' | 'admin',
          collegeName: formData.collegeName,
          semester: Number(formData.semester),
          section: formData.section,
          usn: formData.usn,
        }
      );
      
      if (error) {
        toast.error(error.message || 'Registration failed. Please try again.');
      } else {
        toast.success('Account created successfully!');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          leftIcon={<User className="h-5 w-5 text-gray-400" />}
          placeholder="John Doe"
          disabled={loading}
        />

        <Input
          label="Email Address"
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
          placeholder="your@email.com"
          disabled={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            placeholder="••••••••"
            disabled={loading}
          />

          <Input
            label="Confirm Password"
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            autoComplete="new-password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            error={errors.passwordConfirm}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <Select
          label="Role"
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={[
            { value: 'student', label: 'Student' },
            { value: 'admin', label: 'Admin/Teacher' },
          ]}
          disabled={loading}
        />

        {formData.role === 'student' && (
          <div className="space-y-4 animate-slide-down">
            <Input
              label="College Name"
              type="text"
              id="collegeName"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              error={errors.collegeName}
              leftIcon={<School className="h-5 w-5 text-gray-400" />}
              placeholder="Your College"
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Semester"
                type="number"
                id="semester"
                name="semester"
                min="1"
                max="8"
                value={formData.semester}
                onChange={handleChange}
                error={errors.semester}
                leftIcon={<BookOpen className="h-5 w-5 text-gray-400" />}
                placeholder="1-8"
                disabled={loading}
              />

              <Input
                label="Section"
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                error={errors.section}
                leftIcon={<Users className="h-5 w-5 text-gray-400" />}
                placeholder="A/B/C"
                disabled={loading}
              />

              <Input
                label="USN/Roll Number"
                type="text"
                id="usn"
                name="usn"
                value={formData.usn}
                onChange={handleChange}
                error={errors.usn}
                placeholder="1XX20XX000"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            isLoading={loading}
            className="transition-all duration-300 transform hover:scale-[1.02]"
          >
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/login">
            <Button
              variant="outline"
              fullWidth
              className="transition-all duration-300"
              disabled={loading}
            >
              Sign in instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;