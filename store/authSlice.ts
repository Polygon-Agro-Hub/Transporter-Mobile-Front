import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Profile data interface
export interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala?: string;
  lastNameSinhala?: string;
  firstNameTamil?: string;
  lastNameTamil?: string;
  empId: string;
}

// Auth state interface
interface AuthState {
  token: string | null;
  empId: string | null;
  userProfile: ProfileData | null;
}

// Initial state
const initialState: AuthState = {
  token: null,
  empId: null,
  userProfile: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Save token and empId
    setUser: (
      state,
      action: PayloadAction<{ token: string; empId: string }>
    ) => {
      const { token, empId } = action.payload;
      state.token = token;
      state.empId = empId;
    },

    // Save user profile
    setUserProfile: (state, action: PayloadAction<ProfileData>) => {
      state.userProfile = action.payload;
    },

    // Clear auth data
    logoutUser: (state) => {
      state.token = null;
      state.empId = null;
      state.userProfile = null;
    },

    // NEW: Set full user data in one action
    setUserAndProfile: (
      state,
      action: PayloadAction<{
        token: string;
        empId: string;
        profile: ProfileData;
      }>
    ) => {
      const { token, empId, profile } = action.payload;
      state.token = token;
      state.empId = empId;
      state.userProfile = profile;
    },
  },
});

// Export actions
export const { setUser, setUserProfile, logoutUser, setUserAndProfile } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selector to get user profile from state
export const selectUserProfile = (state: { auth: AuthState }) =>
  state.auth.userProfile;

// Selector to get token
export const selectAuthToken = (state: { auth: AuthState }) =>
  state.auth.token;

// Selector to get empId
export const selectEmpId = (state: { auth: AuthState }) => state.auth.empId;