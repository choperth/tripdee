/**
 * Local Storage Helper for TripDee TripBoard
 * Tracks user-owned posts and Magic Link tokens on the client device
 * allowing seamless access to quotes without requiring PIN re-entry.
 */

export interface SavedUserPost {
  id: string;
  viewToken: string;
  pin?: string;
  title: string;
  createdAt: string;
}

const STORAGE_KEY = 'tripdee_my_board_posts';

export function getMyBoardPosts(): SavedUserPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyBoardPost(
  postOrId: { id: string; viewToken: string; pin?: string; title: string } | string,
  viewToken?: string,
  pin?: string,
  title?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const post = typeof postOrId === 'string'
      ? { id: postOrId, viewToken: viewToken || '', pin, title: title || '' }
      : postOrId;

    const existing = getMyBoardPosts().filter((p) => p.id !== post.id);
    const updated: SavedUserPost[] = [
      {
        id: post.id,
        viewToken: post.viewToken,
        pin: post.pin,
        title: post.title,
        createdAt: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 30); // Keep last 30 posts

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.debug('[BoardStorage] Failed to save post ownership:', err);
  }
}

export function getMyBoardPostToken(postId: string): string | null {
  const posts = getMyBoardPosts();
  const match = posts.find((p) => p.id === postId);
  return match?.viewToken || null;
}

export function isMyBoardPost(postId: string): boolean {
  const posts = getMyBoardPosts();
  return posts.some((p) => p.id === postId);
}

export function buildMagicLink(postId: string, token: string): string {
  if (typeof window === 'undefined') return `https://tripdee.co/?quotePost=${postId}&token=${token}`;
  const origin = window.location.origin;
  return `${origin}/?quotePost=${encodeURIComponent(postId)}&token=${encodeURIComponent(token)}#tripboard`;
}
