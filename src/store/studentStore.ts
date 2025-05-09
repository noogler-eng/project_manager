import { create } from "zustand";
import { User, StudentProfile } from "../lib/types";
import { supabase } from "../lib/supabase";

interface StudentState {
  students: (User & { student_profile?: StudentProfile })[];
  loading: boolean;

  fetchStudents: () => Promise<void>;
  searchStudents: (query: string) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  loading: false,

  fetchStudents: async () => {
    set({ loading: true });

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        student_profile:student_profiles(*)
      `
      )
      .eq("role", "student")
      .order("name");

    if (!error && data) {
      set({
        students: data.map((user) => ({
          ...user,
          student_profile: user.student_profile as StudentProfile,
        })),
        loading: false,
      });
    } else {
      console.error(error);
      set({ loading: false });
    }
  },

  searchStudents: async (query) => {
    set({ loading: true });

    // Only search on top-level fields of `users` table
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        student_profile:student_profiles(*)
      `
      )
      .eq("role", "student")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("name");

    if (!error && data) {
      set({
        students: data.map((user) => ({
          ...user,
          student_profile: user.student_profile as StudentProfile,
        })),
        loading: false,
      });
    } else {
      console.error(error);
      set({ loading: false });
    }
  },
}));
