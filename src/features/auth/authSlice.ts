import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, AuthState, LoginCredentials } from '../../types/auth';
import { UserRole } from '../../types/navigation';
import StorageService from '../../services/storage';
import * as authService from '../../services/authService';

// Initial state - NOT authenticated by default
const initialState: AuthState = {
  user: null,
  isLoading: true, // Start loading to check session
  error: null,
  isAuthenticated: false,
};

// 🔐 REGISTER - Real Supabase
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }: { email: string; password: string; name: string }, { rejectWithValue }) => {
    const result = await authService.signUp(email, password, name);
    if (!result.success) {
      return rejectWithValue(result.error || 'Error al registrar');
    }
    await StorageService.saveAuthData(result.user!);
    return result.user!;
  }
);

// 🔐 LOGIN - Real Supabase
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    const result = await authService.signIn(credentials.email, credentials.password);
    if (!result.success) {
      return rejectWithValue(result.error || 'Error al iniciar sesión');
    }
    await StorageService.saveAuthData(result.user!);
    return result.user!;
  }
);

// 🔄 CHECK AUTH STATUS - On app startup
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // First check Supabase session
      const user = await authService.getCurrentUser();
      if (user) {
        await StorageService.saveAuthData(user);
        return user;
      }

      // Fallback to local storage
      const storedUser = await StorageService.getAuthData();
      return storedUser;
    } catch (error) {
      return rejectWithValue('Error al verificar autenticación');
    }
  }
);

// 🚪 LOGOUT - Real Supabase
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut();
      await StorageService.removeAuthData();
      return true;
    } catch (error) {
      return rejectWithValue('Error al cerrar sesión');
    }
  }
);

// 📧 RESET PASSWORD
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    const result = await authService.resetPassword(email);
    if (!result.success) {
      return rejectWithValue(result.error || 'Error al enviar email');
    }
    return true;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.activeRole = action.payload;
        StorageService.saveAuthData(state.user);
      }
    },
    updateUserProfile: (state, action: PayloadAction<{ name?: string; phone?: string; avatar?: string }>) => {
      if (state.user) {
        const { name, phone, avatar } = action.payload;
        if (name) state.user.name = name;
        if (phone !== undefined) state.user.phone = phone;
        if (avatar !== undefined) state.user.avatar = avatar;
        StorageService.saveAuthData(state.user);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    }
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Check auth status
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = false;
      }
    });
    builder.addCase(checkAuthStatus.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Reset Password
    builder.addCase(resetPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setActiveRole, updateUserProfile, clearError, setUser } = authSlice.actions;

export default authSlice.reducer;
