import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala?: string;
  lastNameSinhala?: string;
  firstNameTamil?: string;
  lastNameTamil?: string;
  empId: string;
  image?: string;
}

interface AuthState {
  token: string | null;
  empId: string | null;
  userProfile: ProfileData | null;
}

const initialState: AuthState = {
  token: null,
  empId: null,
  userProfile: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ token: string; empId: string }>
    ) => {
      const { token, empId } = action.payload;
      state.token = token;
      state.empId = empId;
    },

    setUserProfile: (state, action: PayloadAction<ProfileData>) => {
      state.userProfile = action.payload;
    },

    // This action updates the profile image in Redux
    updateProfileImage: (state, action: PayloadAction<string>) => {
      if (state.userProfile) {
        state.userProfile.image = action.payload;
        state.userProfile.profileImg = action.payload; // Update both for compatibility
      }
    },

    logoutUser: (state) => {
      state.token = null;
      state.empId = null;
      state.userProfile = null;
    },

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

export const { 
  setUser, 
  setUserProfile, 
  logoutUser, 
  setUserAndProfile,
  updateProfileImage 
} = authSlice.actions;

export default authSlice.reducer;

export const selectUserProfile = (state: { auth: AuthState }) =>
  state.auth.userProfile;

export const selectAuthToken = (state: { auth: AuthState }) =>
  state.auth.token;

export const selectEmpId = (state: { auth: AuthState }) => state.auth.empId;