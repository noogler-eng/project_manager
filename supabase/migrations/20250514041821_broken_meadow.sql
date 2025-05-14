/*
  # Add team chat and tasks functionality

  1. New Tables
    - `team_chats`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `user_id` (uuid, references users)
      - `message` (text)
      - `created_at` (timestamp)
    
    - `team_tasks`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `title` (text)
      - `description` (text)
      - `status` (text: pending, in_progress, completed)
      - `assigned_to` (uuid, references users)
      - `deadline` (timestamp)
      - `created_at` (timestamp)

  2. Changes
    - Add description column to teams table
    - Add deadline column to teams table

  3. Security
    - Enable RLS on new tables
    - Add policies for team members and admins
*/

-- Add new columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- Create team_chats table
CREATE TABLE IF NOT EXISTS team_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team_tasks table
CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  deadline timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for team_chats
CREATE POLICY "Team members can view their team chats"
  ON team_chats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_chats.team_id
      AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM teams
      JOIN projects ON teams.project_id = projects.id
      WHERE teams.id = team_chats.team_id
      AND projects.admin_id = auth.uid()
    )
  );

CREATE POLICY "Team members can send messages"
  ON team_chats
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = team_chats.team_id
        AND team_members.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM teams
        JOIN projects ON teams.project_id = projects.id
        WHERE teams.id = team_chats.team_id
        AND projects.admin_id = auth.uid()
      )
    )
  );

-- Policies for team_tasks
CREATE POLICY "Team members can view their team tasks"
  ON team_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM teams
      JOIN projects ON teams.project_id = projects.id
      WHERE teams.id = team_tasks.team_id
      AND projects.admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tasks"
  ON team_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN projects ON teams.project_id = projects.id
      WHERE teams.id = team_tasks.team_id
      AND projects.admin_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update assigned tasks"
  ON team_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );