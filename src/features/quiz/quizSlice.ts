// lib/features/quiz/quizSlice.ts

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null as string | null,
};

export const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // We'll add real actions later
  },
  // We'll add extraReducers for async thunks later
});

export default quizSlice.reducer;
