import React, { useEffect, useState } from 'react';
import { Camera, Mail, MapPin, Phone, Save, User } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../components/AuthProvider';
import { fixedApiService } from '../services/fixedApi';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  joinedDate?: string;
  level?: number;
  points?: number;
  completedCourses?: number;
  studyStreak?: number;
}

const fallbackProfile: UserProfile = {
  name: 'PyMastery Learner',
  email: 'learner@example.com',
  phone: '',
  location: '',
  bio: 'Tell us about your learning goals.',
  avatar: '',
  joinedDate: new Date().toISOString(),
  level: 1,
  points: 0,
  completedCourses: 0,
  studyStreak: 0
};

const ProfilePage: React.FC = () => {
  const { addToast } = useToast();
  const { user: authUser, refreshFromStorage } = useAuth();
  const [user, setUser] = useState<UserProfile>(fallbackProfile);
  const [editForm, setEditForm] = useState<UserProfile>(fallbackProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const mergedUser = { ...fallbackProfile, ...(authUser || {}) };
    setUser(mergedUser);
    setEditForm(mergedUser);
  }, [authUser]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditForm((previousValue) => ({ ...previousValue, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = (await fixedApiService.auth.updateProfile({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        location: editForm.location,
        bio: editForm.bio,
        avatar: editForm.avatar
      })) as Partial<UserProfile>;

      const nextUser = { ...user, ...editForm, ...response };
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
      refreshFromStorage();
      setIsEditing(false);
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Profile Update Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Your profile changes could not be saved right now.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setEditForm((previousValue) => ({ ...previousValue, avatar: loadEvent.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-lg dark:bg-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="mt-2 text-blue-100">Manage your personal details and learning snapshot.</p>
            </div>
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className="inline-flex items-center rounded-xl bg-white px-4 py-2 font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="text-center">
              <div className="relative mx-auto mb-5 h-32 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                {editForm.avatar ? (
                  <img src={editForm.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-14 w-14 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <label className="absolute right-2 bottom-2 cursor-pointer rounded-full bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                )}
              </div>

              {isEditing ? (
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              )}
              <p className="mt-1 text-gray-600 dark:text-slate-400">{user.email}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: 'Level', value: user.level || 0 },
                { label: 'Points', value: user.points || 0 },
                { label: 'Courses', value: user.completedCourses || 0 },
                { label: 'Streak', value: user.studyStreak || 0 }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-slate-700">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 lg:col-span-2">
            <section>
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">About</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editForm.bio || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-700 dark:text-slate-300">{user.bio || 'No bio added yet.'}</p>
              )}
            </section>

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email', icon: Mail, value: editForm.email || '' },
                  { key: 'phone', label: 'Phone', icon: Phone, value: editForm.phone || '' },
                  { key: 'location', label: 'Location', icon: MapPin, value: editForm.location || '' }
                ].map((field) => {
                  const Icon = field.icon;

                  return (
                    <div key={field.key} className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-slate-700">
                      <Icon className="h-5 w-5 text-gray-400" />
                      {isEditing ? (
                        <input
                          name={field.key}
                          value={field.value}
                          onChange={handleInputChange}
                          className="w-full bg-transparent text-gray-900 focus:outline-none dark:text-white"
                          placeholder={field.label}
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-slate-300">{user[field.key as keyof UserProfile] || `No ${field.label.toLowerCase()} provided`}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
