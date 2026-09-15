export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  authorEmail?: string;
  createdAt: string;
  hasAccess: boolean;
}

export interface ArticleFull extends ArticleListItem {
  body: string;
  status?: string;
  updatedAt?: string;
}

export interface SubscriptionStatus {
  hasAccess: boolean;
  status: string;
  currentPeriodEnd: string | null;
  planId?: number;
}
