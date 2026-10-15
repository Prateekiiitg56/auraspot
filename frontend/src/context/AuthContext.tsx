import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../services/firebase";
import { apiJson, readError } from "../services/api";

export type AppUser = {
  _id: string;
  name: string;
  email: string;
  verified?: boolean;
  savedProperties?: string[];
};

type AuthContextValue = {
  /** Firebase user (null when signed out) */
  user: User | null;
  /** Matching AuraSpot account record, available after sync */
  profile: AppUser | null;
  /** True until the first auth state (and account sync) has resolved */
  loading: boolean;
  /** Re-sync the account record, e.g. after sign-up sets a display name */
  refreshProfile: (name?: string) => Promise<void>;
  /** IDs of listings the user bookmarked */
  savedIds: Set<string>;
  /** Bookmarks or un-bookmarks a listing; resolves to the new saved state */
  toggleSaved: (propertyId: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (name?: string) => {
    if (!auth.currentUser) return;
    try {
      const res = await apiJson("/users/sync", "POST", {
        name: name || auth.currentUser.displayName || undefined
      });
      if (res.ok) setProfile(await res.json());
    } catch {
      // Network failure: pages fall back to their own error states
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, [refreshProfile]);

  const savedIds = useMemo(() => new Set(profile?.savedProperties || []), [profile]);

  const toggleSaved = useCallback(async (propertyId: string) => {
    const res = await apiJson(`/users/me/saved/${propertyId}`, "POST");
    if (!res.ok) throw new Error(await readError(res, "Could not update saved homes"));
    const { saved } = (await res.json()) as { saved: boolean };
    setProfile((p) =>
      p
        ? {
            ...p,
            savedProperties: saved
              ? [...(p.savedProperties || []), propertyId]
              : (p.savedProperties || []).filter((id) => id !== propertyId)
          }
        : p
    );
    return saved;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, savedIds, toggleSaved }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
