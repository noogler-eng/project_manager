/*
  # Initial Schema Setup for College Project Manager

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, either 'student' or 'admin')
      - `created_at` (timestamp)
    
    - `student_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `college_name` (text)
      - `semester` (integer)
      - `section` (text)
      - `usn` (text, university/college ID)
      - `created_at` (timestamp)
    
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `admin_id` (uuid, references users.id)
      - `status` (text, either 'pending', 'in_progress', or 'completed')
      - `deadline` (timestamp)
      - `created_at` (timestamp)
    
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `project_id` (uuid, references projects.id)
      - `created_at` (timestamp)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams.id)
      - `user_id` (uuid, references users.id)
      - `role` (text, e.g., 'leader' or 'member')
      - `created_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects.id)
      - `user_id` (uuid, references users.id)
      - `content` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Set policies for authenticated access and specific role-based permissions
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  section TEXT NOT NULL,
  usn TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Public users are viewable by all authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for student_profiles
CREATE POLICY "Student profiles are viewable by all authenticated users"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can update their own profile"
  ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by all authenticated users"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update their own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete their own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by all authenticated users"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create teams for their projects"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id
      AND admin_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Admins can update teams for their projects"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id
      AND admin_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Admins can delete teams for their projects"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id
      AND admin_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Team members are viewable by all authenticated users"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage team members for their projects"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN projects ON teams.project_id = projects.id
      WHERE team_members.team_id = teams.id
      AND projects.admin_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by all authenticated users"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create necessary functions
CREATE OR REPLACE FUNCTION get_user_projects(user_uuid UUID)
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Projects where user is admin
  SELECT * FROM projects
  WHERE admin_id = user_uuid
  
  UNION
  
  -- Projects where user is a team member
  SELECT p.* FROM projects p
  JOIN teams t ON p.id = t.project_id
  JOIN team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = user_uuid;
$$;


-- ALTER TABLE team_members
-- ADD CONSTRAINT fk_team_members_student_profile
-- FOREIGN KEY (user_id)
-- REFERENCES student_profiles(user_id)
-- ON DELETE CASCADE;