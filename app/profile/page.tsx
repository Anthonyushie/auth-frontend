"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

interface ProfileData {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for the AuthProvider to finish its silent-refresh attempt
    // before we hit the protected endpoint.
    if (authLoading) return;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/profile");
        // Backend returns: { success: true, data: { user: { userId, email, role } } }
        const resolved = data.data?.user || data.user || data.data || data;
        setProfile(resolved);
      } catch {
        // Fallback to in-memory user from AuthContext if available
        if (authUser) {
          setProfile(authUser as unknown as ProfileData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, authUser]);

  // -----------------------------------------------------------------------
  // Loading Skeleton
  // -----------------------------------------------------------------------

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-lg animate-pulse space-y-6 py-12">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Profile Card
  // -----------------------------------------------------------------------

  if (!profile) {
    return (
      <div className="py-20 text-center text-gray-500">
        Unable to load profile data.
      </div>
    );
  }

  const email = profile.email || "No email";
  const initials = email.charAt(0).toUpperCase();
  const role = profile.role || "user";
  const userId = (profile.id || profile.userId || "N/A") as string;

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Avatar / initials */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-8 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{email}</p>
            <span className="inline-block mt-1 rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700 capitalize">
              {role}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="divide-y divide-gray-100 px-8">
          <DetailRow label="User ID" value={userId} />
          <DetailRow label="Email" value={email} />
          <DetailRow label="Role" value={role} />
          {profile.createdAt && (
            <DetailRow
              label="Member since"
              value={new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
