import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, AuthState, LoginCredentials } from '../../types/auth';
import { UserRole } from '../../types/navigation';
import StorageService from '../../services/storage';

const initialState: AuthState = {
  user: {
    id: '1',
    email: 'demo@tiqly.app',
    name: 'Tahiel Mocha',
    roles: ['attendee', 'organizer'],
    activeRole: 'attendee',
    token: 'mock-token'
  },
  isLoading: false,
  error: null,
  isAuthenticated: true,
};

// Acciones asíncronas
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Call a la API de autenticación
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: 'Tahiel Mocha',
        roles: ['attendee'],
        activeRole: 'attendee',
        token: 'mock-token-123'
      };

      await StorageService.saveAuthData(mockUser);
      return mockUser;
    } catch (error) {
      return rejectWithValue('Error al iniciar sesión');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const user = await StorageService.getAuthData();
      return user;
    } catch (error) {
      return rejectWithValue('Error al verificar autenticación');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await StorageService.removeAuthData();
      return true;
    } catch (error) {
      return rejectWithValue('Error al cerrar sesión');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.activeRole = action.payload;
        // Actualizar también en el almacenamiento
        StorageService.saveAuthData(state.user);
      }
    },
    updateUserProfile: (state, action: PayloadAction<{ name?: string; phone?: string; avatar?: string }>) => {
      if (state.user) {
        const { name, phone, avatar } = action.payload;
        if (name) state.user.name = name;
        if (phone !== undefined) state.user.phone = phone;
        if (avatar !== undefined) state.user.avatar = avatar;
        // Persist changes
        StorageService.saveAuthData(state.user);
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
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
  },
});

export const { setActiveRole, updateUserProfile, clearError } = authSlice.actions;

export default authSlice.reducer;
