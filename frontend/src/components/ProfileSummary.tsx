import { BadgeCheck, Mail, Phone, MapPin, CalendarDays, Star, Award, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  verified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  rating?: number;
  totalRatings?: number;
  successfulDeals?: number;
  trustBadge?: string;
  createdAt?: string;
  socials?: Partial<Record<"facebook" | "twitter" | "linkedin" | "instagram" | "youtube", string>>;
};

export type UserStats = {
  propertiesListed: number;
  activeDeals: number;
  completedDeals: number;
  rating: number;
  totalRatings: number;
  successfulDeals: number;
  trustBadge: string;
};

const BADGES: Record<string, { label: string; icon: typeof Award; tone: string }> = {
  NEW_SELLER: { label: "New member", icon: Sparkles, tone: "status-neutral" },
  VERIFIED_OWNER: { label: "Verified owner", icon: ShieldCheck, tone: "status-ok" },
  TRUSTED_SELLER: { label: "Trusted owner", icon: Award, tone: "status-warn" },
  TOP_SELLER: { label: "Top owner", icon: Trophy, tone: "status-info" }
};

const SOCIAL_BASE: Record<string, string> = {
  facebook: "https://facebook.com/",
  twitter: "https://x.com/",
  linkedin: "https://linkedin.com/in/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@"
};
const SOCIAL_LABEL: Record<string, string> = {
  facebook: "Facebook",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube"
};

const socialUrl = (key: string, value: string) => {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return SOCIAL_BASE[key] + v.replace(/^@/, "");
};

export const Stars = ({ value, size = 15 }: { value: number; size?: number }) => (
  <span className="stars" aria-label={`${value.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} aria-hidden="true" className={n <= Math.round(value) ? "on" : ""} />
    ))}
  </span>
);

/** Sidebar card summarising a user's identity, trust signals and contact details. */
const ProfileSummary = ({
  user,
  stats,
  showPrivate = false,
  children
}: {
  user: PublicUser;
  stats: UserStats | null;
  showPrivate?: boolean;
  children?: ReactNode;
}) => {
  const badge = BADGES[stats?.trustBadge || user.trustBadge || "NEW_SELLER"] || BADGES.NEW_SELLER;
  const BadgeIcon = badge.icon;
  const rating = stats?.rating ?? user.rating ?? 0;
  const totalRatings = stats?.totalRatings ?? user.totalRatings ?? 0;
  const socials = Object.entries(user.socials || {}).filter(([, v]) => v && v.trim());

  return (
    <aside className="paper-card profile-summary">
      <div className="profile-avatar" aria-hidden="true">
        {(user.name || user.email).charAt(0).toUpperCase()}
      </div>
      <h1 className="profile-name">
        {user.name || user.email.split("@")[0]}
        {user.verified && <BadgeCheck size={20} className="verified-icon" aria-label="Identity verified" />}
      </h1>
      <span className={`status-pill ${badge.tone}`}>
        <BadgeIcon size={13} aria-hidden="true" /> {badge.label}
      </span>

      <div className="profile-rating">
        {totalRatings > 0 ? (
          <>
            <Stars value={rating} />
            <span className="muted">
              {rating.toFixed(1)} · {totalRatings} review{totalRatings === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span className="muted">No reviews yet</span>
        )}
      </div>

      <dl className="profile-stats">
        <div><dt>Listings</dt><dd className="mono">{stats?.propertiesListed ?? 0}</dd></div>
        <div><dt>Deals closed</dt><dd className="mono">{stats?.successfulDeals ?? user.successfulDeals ?? 0}</dd></div>
      </dl>

      <ul className="profile-facts">
        {showPrivate && (
          <li><Mail size={15} aria-hidden="true" /> <span>{user.email}</span></li>
        )}
        {showPrivate && user.phone && (
          <li>
            <Phone size={15} aria-hidden="true" /> <span>{user.phone}</span>
            {user.phoneVerified && <span className="status-pill status-ok mini">Verified</span>}
          </li>
        )}
        {user.location && <li><MapPin size={15} aria-hidden="true" /> <span>{user.location}</span></li>}
        {user.createdAt && (
          <li>
            <CalendarDays size={15} aria-hidden="true" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
          </li>
        )}
      </ul>

      {socials.length > 0 && (
        <div className="profile-socials">
          {socials.map(([key, value]) => (
            <a key={key} href={socialUrl(key, value as string)} target="_blank" rel="noopener noreferrer" className="chip">
              {SOCIAL_LABEL[key] || key}
            </a>
          ))}
        </div>
      )}

      {children}
    </aside>
  );
};

export default ProfileSummary;
