export interface UserSession {
  session_id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}