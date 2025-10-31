// lib/features/auth/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null; // Use a more specific user type if you have one
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  session: null,
  user: null, // Use a more specific user type if you have one
  isAuthenticated: false,
  error: null as string | null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload ? action.payload.user : null;
      state.status = "succeeded";
      state.isAuthenticated = action.payload !== null;
    },
    signOut: () => initialState,
  },
  // We'll add extraReducers for async thunks later
});

export const { setSession, signOut } = authSlice.actions;
export default authSlice.reducer;
