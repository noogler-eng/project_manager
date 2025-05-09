import { create } from 'zustand';
import { Project, Team, TeamMember, Comment } from '../lib/types';
import { supabase } from '../lib/supabase';

interface ProjectState {
  projects: Project[];
  teams: Team[];
  currentProject: Project | null;
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  comments: Comment[];
  loading: boolean;
  
  // Project methods
  fetchProjects: () => Promise<void>;
  fetchUserProjects: (userId: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at'>) => Promise<{ error: any }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ error: any }>;
  deleteProject: (id: string) => Promise<{ error: any }>;
  getProjectById: (id: string) => Promise<void>;
  
  // Team methods
  fetchTeams: (projectId: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'created_at'>) => Promise<{ error: any, data: any }>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<{ error: any }>;
  deleteTeam: (id: string) => Promise<{ error: any }>;
  getTeamById: (id: string) => Promise<void>;
  
  // Team member methods
  fetchTeamMembers: (teamId: string) => Promise<void>;
  addTeamMember: (teamMember: Omit<TeamMember, 'id' | 'created_at'>) => Promise<{ error: any }>;
  removeTeamMember: (id: string) => Promise<{ error: any }>;
  
  // Comments
  fetchComments: (projectId: string) => Promise<void>;
  addComment: (comment: Omit<Comment, 'id' | 'created_at'>) => Promise<{ error: any }>;
  deleteComment: (id: string) => Promise<{ error: any }>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  teams: [],
  currentProject: null,
  currentTeam: null,
  teamMembers: [],
  comments: [],
  loading: false,
  
  fetchProjects: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('projects')
      .select('*, admin:users(name, email)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      set({ projects: data, loading: false });
    } else {
      set({ loading: false });
    }
  },
  
  fetchUserProjects: async (userId: string) => {
    set({ loading: true });
    
    // First, get projects where user is admin
    const { data: adminProjects } = await supabase
      .from('projects')
      .select('*, admin:users(name, email)')
      .eq('admin_id', userId)
      .order('created_at', { ascending: false });
    
    // Then, get projects where user is a team member
    const { data: teamMemberProjects } = await supabase
      .from('team_members')
      .select('team:teams(project:projects(*, admin:users(name, email)))')
      .eq('user_id', userId);
    
    // Combine and deduplicate projects
    const memberProjects = teamMemberProjects
      ? teamMemberProjects
          .map(tm => tm.team?.project)
          .filter(Boolean) as Project[]
      : [];
    
    const allProjects = [...(adminProjects || []), ...memberProjects];
    const uniqueProjects = Array.from(
      new Map(allProjects.map(project => [project.id, project])).values()
    );
    
    set({ projects: uniqueProjects, loading: false });
  },
  
  createProject: async (project) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
      
    if (!error && data) {
      set({ projects: [data, ...get().projects] });
    }
    
    return { error };
  },
  
  updateProject: async (id, updates) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);
      
    if (!error) {
      set({
        projects: get().projects.map(project => 
          project.id === id ? { ...project, ...updates } : project
        ),
        currentProject: get().currentProject?.id === id 
          ? { ...get().currentProject, ...updates } 
          : get().currentProject
      });
    }
    
    return { error };
  },
  
  deleteProject: async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (!error) {
      set({ 
        projects: get().projects.filter(project => project.id !== id),
        currentProject: get().currentProject?.id === id ? null : get().currentProject
      });
    }
    
    return { error };
  },
  
  getProjectById: async (id) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('projects')
      .select('*, admin:users(name, email)')
      .eq('id', id)
      .single();
      
    if (!error && data) {
      set({ currentProject: data, loading: false });
    } else {
      set({ loading: false });
    }
  },
  
  fetchTeams: async (projectId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      set({ teams: data, loading: false });
    } else {
      set({ loading: false });
    }
  },
  
  createTeam: async (team) => {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();
      
    if (!error && data) {
      set({ teams: [data, ...get().teams] });
    }
    
    return { error, data };
  },
  
  updateTeam: async (id, updates) => {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id);
      
    if (!error) {
      set({
        teams: get().teams.map(team => 
          team.id === id ? { ...team, ...updates } : team
        ),
        currentTeam: get().currentTeam?.id === id 
          ? { ...get().currentTeam, ...updates } 
          : get().currentTeam
      });
    }
    
    return { error };
  },
  
  deleteTeam: async (id) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
      
    if (!error) {
      set({ 
        teams: get().teams.filter(team => team.id !== id),
        currentTeam: get().currentTeam?.id === id ? null : get().currentTeam
      });
    }
    
    return { error };
  },
  
  getTeamById: async (id) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('teams')
      .select('*, project:projects(*)')
      .eq('id', id)
      .single();
      
    if (!error && data) {
      set({ currentTeam: data, loading: false });
      await get().fetchTeamMembers(id);
    } else {
      set({ loading: false });
    }
  },
  
  fetchTeamMembers: async (teamId) => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(*),
        student_profile:student_profiles(*)
      `)
      .eq('team_id', teamId);
      
    if (!error && data) {
      set({ teamMembers: data });
    }
  },
  
  addTeamMember: async (teamMember) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert(teamMember)
      .select(`
        *,
        user:users(*),
        student_profile:student_profiles(*)
      `)
      .single();
      
    if (!error && data) {
      set({ teamMembers: [...get().teamMembers, data] });
    }
    
    return { error };
  },
  
  removeTeamMember: async (id) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
      
    if (!error) {
      set({ teamMembers: get().teamMembers.filter(member => member.id !== id) });
    }
    
    return { error };
  },
  
  fetchComments: async (projectId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(name, email)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      set({ comments: data });
    }
  },
  
  addComment: async (comment) => {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select('*, user:users(name, email)')
      .single();
      
    if (!error && data) {
      set({ comments: [...get().comments, data] });
    }
    
    return { error };
  },
  
  deleteComment: async (id) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
      
    if (!error) {
      set({ comments: get().comments.filter(comment => comment.id !== id) });
    }
    
    return { error };
  },
}));