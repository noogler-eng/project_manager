export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  college_name: string;
  semester: number;
  section: string;
  usn: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  admin_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  created_at: string;
  admin?: User;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  project_id: string;
  deadline: string;
  created_at: string;
  project?: Project;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user?: User;
  student_profile?: StudentProfile;
}

export interface TeamChat {
  id: string;
  team_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: User;
}

export interface TeamTask {
  id: string;
  team_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string;
  deadline: string;
  created_at: string;
  assignee?: User;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: Omit<StudentProfile, 'id' | 'created_at'>;
        Update: Partial<Omit<StudentProfile, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'created_at'>;
        Update: Partial<Omit<TeamMember, 'id' | 'created_at'>>;
      };
      team_chats: {
        Row: TeamChat;
        Insert: Omit<TeamChat, 'id' | 'created_at'>;
        Update: Partial<Omit<TeamChat, 'id' | 'created_at'>>;
      };
      team_tasks: {
        Row: TeamTask;
        Insert: Omit<TeamTask, 'id' | 'created_at'>;
        Update: Partial<Omit<TeamTask, 'id' | 'created_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
      };
    };
  };
}