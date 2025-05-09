import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  CalendarClock,
  Clock,
  Users,
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentProject,
    getProjectById,
    teams,
    fetchTeams,
    currentTeam,
    getTeamById,
    teamMembers,
    comments,
    fetchComments,
    addComment,
  } = useProjectStore();
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    if (id) {
      getProjectById(id);
      fetchTeams(id);
      fetchComments(id);
    }
  }, [id, getProjectById, fetchTeams, fetchComments]);

  useEffect(() => {
    const findUserTeam = async () => {
      if (!teams.length || !user) return;
      
      setLoadingTeam(true);
      
      // Find team that current user is a member of
      for (const team of teams) {
        await getTeamById(team.id);
        
        if (teamMembers.some(member => member.user_id === user.id)) {
          setLoadingTeam(false);
          return;
        }
      }
      
      setLoadingTeam(false);
    };
    
    findUserTeam();
  }, [teams, user, getTeamById, teamMembers]);

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

  const calculateDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
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
          <h1 className="text-2xl font-bold text-gray-900">{currentProject.title}</h1>
        </div>
        <Badge variant={getStatusVariant(currentProject.status)} className="px-3 py-1 text-sm">
          {getStatusText(currentProject.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader className="bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Project Details</h2>
            </CardHeader>
            <CardBody>
              <div className="prose max-w-none">
                <p className="text-gray-700">{currentProject.description}</p>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Admin: {currentProject.admin?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarClock className="h-5 w-5 mr-2 text-gray-400" />
                  <span>Created: {formatDate(currentProject.created_at)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" />
                  <span className={calculateDaysRemaining(currentProject.deadline) < 0 ? 'text-red-500' : ''}>
                    {calculateDaysRemaining(currentProject.deadline) > 0
                      ? `${calculateDaysRemaining(currentProject.deadline)} days remaining`
                      : 'Deadline passed'}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium mr-2">Deadline:</span>
                  <span>{formatDate(currentProject.deadline)}</span>
                </div>
              </div>
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
          {/* Team Details */}
          <Card>
            <CardHeader className="bg-gray-50">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Your Team</h2>
              </div>
            </CardHeader>
            <CardBody>
              {loadingTeam ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-primary-200 rounded-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ) : currentTeam ? (
                <div>
                  <h3 className="font-medium text-lg text-gray-900 mb-2">{currentTeam.name}</h3>
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Team Members:</h4>
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center border-b border-gray-100 pb-2">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-3">
                          {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.user?.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">You're not assigned to a team for this project yet.</p>
                  <p className="text-sm text-gray-400">Contact your instructor for team assignment.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProjectDetails;