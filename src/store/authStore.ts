import { create } from "zustand";
import { User, StudentProfile } from "../lib/types";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  studentProfile: StudentProfile | null;
  session: any;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Auth methods
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (
    email: string,
    password: string,
    userData: {
      name: string;
      role: "student" | "admin";
      collegeName?: string;
      semester?: number;
      section?: string;
      usn?: string;
    }
  ) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  getSession: () => Promise<void>;
  getProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  studentProfile: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false, error: error.message });
        return { error };
      }

      if (data.session) {
        set({ session: data.session });
        await get().getProfile();
      }

      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || "An unexpected error occurred",
      });
      console.error("Login error:", err);
      return { error: err };
    }
  },

  register: async (email, password, userData) => {
    try {
      set({ loading: true, error: null });

      // Register new user with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });

      if (error) {
        set({ loading: false, error: error.message });
        return { error };
      }

      if (!data.user) {
        set({ loading: false, error: "User registration failed" });
        return { error: new Error("User registration failed") };
      }

      // Insert into custom users table
      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        name: userData.name,
        role: userData.role,
      });

      if (userError) {
        set({ loading: false, error: userError.message });
        return { error: userError };
      }

      // If student, create profile
      if (
        userData.role === "student" &&
        userData.collegeName &&
        userData.semester &&
        userData.section &&
        userData.usn
      ) {
        const { error: profileError } = await supabase
          .from("student_profiles")
          .insert({
            user_id: data.user.id,
            college_name: userData.collegeName,
            semester: userData.semester,
            section: userData.section,
            usn: userData.usn,
          });

        if (profileError) {
          // Don't fail registration because of profile error, but log it
          console.error("Profile creation error:", profileError);
        }
      }

      // Set session and get profile
      if (data.session) {
        set({ session: data.session });
        await get().getProfile();
      }

      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || "An unexpected error occurred",
      });
      console.error("Registration error:", err);
      return { error: err };
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
      }

      // Clear state regardless of logout API success
      set({
        user: null,
        studentProfile: null,
        session: null,
        loading: false,
        error: error ? error.message : null,
      });
    } catch (err: any) {
      console.error("Logout error:", err);
      set({
        user: null,
        studentProfile: null,
        session: null,
        loading: false,
        error: err.message || "An unexpected error occurred during logout",
      });
    }
  },

  getSession: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Get session error:", error);
        set({
          session: null,
          user: null,
          studentProfile: null,
          loading: false,
          initialized: true,
          error: error.message,
        });
        return;
      }

      if (!data.session) {
        // No active session found
        set({
          session: null,
          user: null,
          studentProfile: null,
          loading: false,
          initialized: true,
        });
        return;
      }

      // We have a session, set it and then get the profile
      set({ session: data.session, loading: true });

      try {
        await get().getProfile();
      } catch (profileErr: any) {
        console.error("Error in getProfile during session init:", profileErr);
        // Don't fail the whole session process, just record the error
        set({ error: profileErr.message || "Failed to load profile" });
      } finally {
        // Always mark as initialized, even if profile loading fails
        set({ loading: false, initialized: true });
      }
    } catch (err: any) {
      console.error("Get session error:", err);
      set({
        session: null,
        user: null,
        studentProfile: null,
        loading: false,
        initialized: true,
        error:
          err.message ||
          "An unexpected error occurred while retrieving session",
      });
    }
  },

  getProfile: async () => {
    const { session } = get();

    try {
      if (!session?.user?.id) {
        set({ user: null, studentProfile: null });
        return;
      }

      // First check if user exists in auth
      const { data: authUser, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authUser?.user) {
        console.error("Auth user not found:", authError);
        set({
          user: null,
          studentProfile: null,
          error: authError?.message || "User not found in authentication",
          loading: false,
        });
        return;
      }

      // Get user data - use maybeSingle() instead of single() to avoid PGRST116 error
      const { data: userDataArray, error: userListError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id);

      if (userListError) {
        console.error("Get user error:", userListError);
        set({ error: userListError.message, loading: false });
        return;
      }

      // Check if we got any user data
      if (!userDataArray || userDataArray.length === 0) {
        console.log("No user record found in users table, creating one");

        // If no user found in users table but exists in auth, create a user record
        // This can happen if auth exists but DB entry doesn't (e.g., after DB reset)
        const { email, user_metadata } = authUser.user;
        const role = user_metadata?.role || "student"; // Default to student if no role set
        const name = user_metadata?.name || email?.split("@")[0] || "User";

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: email || "",
            name: name,
            role: role,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating user record:", createError);
          set({
            error: `Failed to create user record: ${createError.message}`,
            loading: false,
          });
          return;
        }

        set({ user: newUser, loading: false });
      } else {
        // Use the first user from the array
        set({ user: userDataArray[0], loading: false });

        // If student, get profile
        if (userDataArray[0].role === "student") {
          // Use maybeSingle() pattern for profile too
          const { data: profileDataArray, error: profileListError } =
            await supabase
              .from("student_profiles")
              .select("*")
              .eq("user_id", session.user.id);

          if (profileListError) {
            console.error("Get profile error:", profileListError);
            set({ error: `Profile error: ${profileListError.message}` });
            return;
          }

          // We're fine with no profile found, it's optional
          set({
            studentProfile:
              profileDataArray && profileDataArray.length > 0
                ? profileDataArray[0]
                : null,
          });
        }
      }
    } catch (err: any) {
      console.error("Get profile error:", err);
      set({
        error:
          err.message ||
          "An unexpected error occurred while retrieving profile",
        loading: false,
      });
    }
  },
}));
