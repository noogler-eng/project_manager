import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { useStudentStore } from '../../store/studentStore';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Save,
  Users,
  Plus,
  X,
  MessageSquare,
  Send,
  UserPlus,
  Check,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentProject,
    getProjectById,
    updateProject,
    teams,
    fetchTeams,
    createTeam,
    deleteTeam,
    teamMembers,
    fetchTeamMembers,
    addTeamMember,
    removeTeamMember,
    comments,
    fetchComments,
    addComment,
  } = useProjectStore();
  const { students, searchStudents } = useStudentStore();
  
  // Form states
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Team states
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);
  
  // Member states
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  
  // Comment states
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load project data
  useEffect(() => {
    if (id) {
      getProjectById(id);
      fetchTeams(id);
      fetchComments(id);
    }
  }, [id, getProjectById, fetchTeams, fetchComments]);

  // Update form data when project loaded
  useEffect(() => {
    if (currentProject) {
      setFormData({
        title: currentProject.title,
        description: currentProject.description,
        status: currentProject.status,
        deadline: currentProject.deadline.split('T')[0],
      });
    }
  }, [currentProject]);

  // Load team members when team selected
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam, fetchTeamMembers]);

  // Search students
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        setSearchLoading(true);
        searchStudents(searchQuery)
          .finally(() => setSearchLoading(false));
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery, searchStudents]);

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

  const handleSave = async () => {
    if (!validate() || !id) return;
    
    setSaving(true);
    
    try {
      const { error } = await updateProject(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status as 'pending' | 'in_progress' | 'completed',
        deadline: formData.deadline,
      });
      
      if (error) {
        toast.error('Failed to update project. Please try again.');
      } else {
        toast.success('Project updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !id) return;
    
    setCreatingTeam(true);
    
    try {
      const { error, data } = await createTeam({
        name: teamName.trim(),
        project_id: id,
      });
      
      if (error) {
        toast.error('Failed to create team. Please try again.');
      } else {
        toast.success('Team created successfully!');
        setTeamName('');
        setShowTeamForm(false);
        if (data) {
          setSelectedTeam(data.id);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will remove all team members as well.')) {
      setDeletingTeam(teamId);
      
      try {
        const { error } = await deleteTeam(teamId);
        
        if (error) {
          toast.error('Failed to delete team. Please try again.');
        } else {
          toast.success('Team deleted successfully!');
          if (selectedTeam === teamId) {
            setSelectedTeam(null);
          }
        }
      } catch (err) {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setDeletingTeam(null);
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedStudent) return;
    
    setAddingMember(true);
    
    try {
      const { error } = await addTeamMember({
        team_id: selectedTeam,
        user_id: selectedStudent,
        role: memberRole,
      });
      
      if (error) {
        toast.error('Failed to add team member. Please try again.');
      } else {
        toast.success('Team member added successfully!');
        setSelectedStudent(null);
        setMemberRole('member');
        setSearchQuery('');
        setShowAddMemberForm(false);
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setRemovingMember(memberId);
      
      try {
        const { error } = await removeTeamMember(memberId);
        
        if (error) {
          toast.error('Failed to remove team member. Please try again.');
        } else {
          toast.success('Team member removed successfully!');
        }
      } catch (err) {
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setRemovingMember(null);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !id || !user?.id) return;
    
    setSubmittingComment(true);
    
    try {
      const { error } = await addComment({
        project_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });
      
      if (error) {
        toast.error('Failed to add comment. Please try again.');
      } else {
        setNewComment('');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-3"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          {editMode ? (
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              className="text-2xl font-bold px-0 border-0 focus:ring-0"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{currentProject.title}</h1>
          )}
        </div>
        {!editMode ? (
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusVariant(currentProject.status)} className="px-3 py-1 text-sm">
              {currentProject.status === 'pending' ? 'Pending' : 
               currentProject.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              Edit Project
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader className="bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Project Details</h2>
            </CardHeader>
            <CardBody>
              {editMode ? (
                <div className="space-y-6">
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
                      `}
                      placeholder="Enter project description"
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
                    />

                    <Input
                      label="Deadline"
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      error={errors.deadline}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="prose max-w-none">
                    <p className="text-gray-700">{currentProject.description}</p>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status:</span>
                      <Badge variant={getStatusVariant(currentProject.status)}>
                        {currentProject.status === 'pending' ? 'Pending' : 
                         currentProject.status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Created:</span>
                      <span>{formatDate(currentProject.created_at)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Deadline:</span>
                      <span>{formatDate(currentProject.deadline)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Admin:</span>
                      <span>{currentProject.admin?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="bg-gray-50">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Comments</h2>
              </div>
            </CardHeader>
            <CardBody className="max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="py-6 text-center text-gray-500">
                  No comments yet. Be the first to add one!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.user?.name || 'Unknown'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
            <CardFooter className="bg-gray-50">
              <form onSubmit={handleCommentSubmit} className="w-full">
                <div className="flex">
                  <Input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={submittingComment}
                    className="rounded-r-none"
                  />
                  <Button
                    type="submit"
                    className="rounded-l-none"
                    disabled={!newComment.trim() || submittingComment}
                    isLoading={submittingComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Teams Management */}
          <Card>
            <CardHeader className="bg-gray-50 flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Teams</h2>
              </div>
              {!showTeamForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTeamForm(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Team
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {showTeamForm && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 animate-slide-down">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Create New Team</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowTeamForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Team Name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateTeam}
                      disabled={!teamName.trim() || creatingTeam}
                      isLoading={creatingTeam}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}

              {teams.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No teams yet. Create a team to start assigning students.
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`
                        p-2 rounded-md border cursor-pointer transition
                        ${selectedTeam === team.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{team.name}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                          isLoading={deletingTeam === team.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Team Members */}
          {selectedTeam && (
            <Card>
              <CardHeader className="bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
                </div>
                {!showAddMemberForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMemberForm(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Member
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {showAddMemberForm && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 animate-slide-down">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-700">Add Team Member</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddMemberForm(false);
                          setSearchQuery('');
                          setSelectedStudent(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                        />
                        {searchLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          </div>
                        )}
                      </div>

                      {searchQuery && students.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                          {students.map((student) => (
                            <div
                              key={student.id}
                              className={`
                                p-2 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between
                                ${selectedStudent === student.id ? 'bg-primary-50' : ''}
                              `}
                              onClick={() => setSelectedStudent(student.id)}
                            >
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-2">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-gray-800">{student.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {student.student_profile?.usn || ''} | {student.student_profile?.semester || '-'} Sem
                                  </div>
                                </div>
                              </div>
                              {selectedStudent === student.id && (
                                <Check className="h-4 w-4 text-primary-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {searchQuery && students.length === 0 && !searchLoading && (
                        <div className="text-sm text-gray-500 p-2">
                          No students found matching your search.
                        </div>
                      )}

                      <Select
                        label="Role in team"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        options={[
                          { value: 'leader', label: 'Team Leader' },
                          { value: 'member', label: 'Team Member' },
                        ]}
                      />

                      <Button
                        fullWidth
                        onClick={handleAddMember}
                        disabled={!selectedStudent || addingMember}
                        isLoading={addingMember}
                      >
                        Add to Team
                      </Button>
                    </div>
                  </div>
                )}

                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No members in this team yet. Add members to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-3">
                            {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{member.user?.name}</div>
                            <div className="flex items-center">
                              <Badge
                                variant={member.role === 'leader' ? 'primary' : 'neutral'}
                                className="text-xs"
                              >
                                {member.role === 'leader' ? 'Team Leader' : 'Member'}
                              </Badge>
                              {member.student_profile && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {member.student_profile.usn}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id)}
                          isLoading={removingMember === member.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetails;