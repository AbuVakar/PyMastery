import os
import re

# 1. Patch fixedApi.ts
filepath_api = 'frontend/src/services/fixedApi.ts'
with open(filepath_api, 'r', encoding='utf-8') as f:
    api_content = f.read()

api_content = api_content.replace(
    '  access_token?: string;  // Add backend\'s actual field\n}',
    '  access_token?: string;  // Add backend\'s actual field\n  requires_otp?: boolean;\n}'
)

login_target = """        // Convert backend response to frontend format
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in
        };"""

login_replacement = """        // Check if OTP is required
        if (backendData.requires_otp) {
          return {
            success: true,
            requires_otp: true,
            message: backendData.message || 'OTP sent'
          };
        }

        // Convert backend response to frontend format
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in
        };"""
api_content = api_content.replace(login_target, login_replacement)

verify_otp_method = """    verifyOtp: async (email: string, otp: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/verify-login-otp', {
          email,
          otp
        });
        
        const backendData = response.data;
        
        if (backendData.access_token && backendData.refresh_token) {
          tokenUtils.setTokens(backendData.access_token, backendData.refresh_token, backendData.user, backendData.expires_in || 1800);
        }
        
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in
        };
      } catch (error) {
        debugError('Verify OTP error', error);
        throw error;
      }
    },

    register:"""
api_content = api_content.replace("    register:", verify_otp_method)

with open(filepath_api, 'w', encoding='utf-8') as f:
    f.write(api_content)

# 2. Patch AuthProvider.tsx
filepath_auth = 'frontend/src/components/AuthProvider.tsx'
with open(filepath_auth, 'r', encoding='utf-8') as f:
    auth_content = f.read()

auth_content = auth_content.replace(
    '  login: (email: string, password: string) => Promise<void>;',
    '  login: (email: string, password: string) => Promise<{requires_otp?: boolean} | void>;\n  verifyOtp: (email: string, otp: string) => Promise<void>;'
)

login_impl_target = """  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);

      try {
        const response = await fixedApiService.auth.login(email, password);

        if (!response.success || !response.user || !response.token) {
          throw new Error(response.message || 'Login failed');
        }

        applySession(response.user, response.token);
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );"""

login_impl_replacement = """  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);

      try {
        const response = await fixedApiService.auth.login(email, password);
        
        if (response.requires_otp) {
          return { requires_otp: true };
        }

        if (!response.success || !response.user || !response.token) {
          throw new Error(response.message || 'Login failed');
        }

        applySession(response.user, response.token);
        return { requires_otp: false };
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      setLoading(true);
      try {
        const response = await fixedApiService.auth.verifyOtp(email, otp);
        if (!response.success || !response.user || !response.token) {
          throw new Error(response.message || 'OTP Verification failed');
        }
        applySession(response.user, response.token);
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );"""
auth_content = auth_content.replace(login_impl_target, login_impl_replacement)

auth_content = auth_content.replace(
    '      login,\n      register,',
    '      login,\n      verifyOtp,\n      register,'
)
auth_content = auth_content.replace(
    '[loading, login, logout, refreshFromStorage, register, token, updateRole, user]',
    '[loading, login, verifyOtp, logout, refreshFromStorage, register, token, updateRole, user]'
)

with open(filepath_auth, 'w', encoding='utf-8') as f:
    f.write(auth_content)

# 3. Patch LoginPage.tsx
filepath_login = 'frontend/src/pages/LoginPage.tsx'
with open(filepath_login, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace(
    '  const [showPassword, setShowPassword] = useState(false);',
    '  const [showPassword, setShowPassword] = useState(false);\n  const [requiresOtp, setRequiresOtp] = useState(false);\n  const [otp, setOtp] = useState("");'
)

login_content = login_content.replace(
    '  const { login } = useAuth();',
    '  const { login, verifyOtp } = useAuth();'
)

handle_submit_target = """    try {
      await login(formData.email, formData.password);

      addToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Successfully logged in. Redirecting you now...'
      });

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {"""

handle_submit_replacement = """    try {
      if (requiresOtp) {
        await verifyOtp(formData.email, otp);
        addToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Successfully logged in. Redirecting you now...'
        });
        navigate(redirectPath, { replace: true });
      } else {
        const result = await login(formData.email, formData.password);
        if (result && result.requires_otp) {
          setRequiresOtp(true);
          addToast({
            type: 'info',
            title: 'OTP Sent',
            message: 'Please enter the OTP sent to your email.'
          });
          return;
        }
        
        addToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Successfully logged in. Redirecting you now...'
        });
        navigate(redirectPath, { replace: true });
      }
    } catch (error: unknown) {"""
login_content = login_content.replace(handle_submit_target, handle_submit_replacement)

form_render_target = """          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              id="email"
              name="email"
"""

form_render_replacement = """          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {!requiresOtp ? (
              <>
            <Input
              id="email"
              name="email"
"""
login_content = login_content.replace(form_render_target, form_render_replacement)

form_close_target = """            <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>"""

form_close_replacement = """            </>
            ) : (
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <button type="button" onClick={() => setRequiresOtp(false)} className="mt-2 text-sm text-blue-600 hover:underline">Change Email/Password</button>
               </div>
            )}
            <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full">
              {isLoading ? (requiresOtp ? 'Verifying...' : 'Signing in...') : (requiresOtp ? 'Verify OTP' : 'Sign in')}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>"""
login_content = login_content.replace(form_close_target, form_close_replacement)

with open(filepath_login, 'w', encoding='utf-8') as f:
    f.write(login_content)

print("Frontend patch applied successfully.")
