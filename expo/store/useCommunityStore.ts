import { create } from "zustand";
import { graphqlClient } from "../services/graphql-client";
import { gql } from "urql";
import {
  uploadMedia,
  UploadedMedia,
  UploadProgress,
} from "../services/community-service";

const GET_FEED_POSTS = gql`
  query GetFeedPosts($limit: Int, $cursor: String) {
    get_feed_posts(limit: $limit, cursor: $cursor) {
      posts {
        id
        user_id
        created_at
        content
        media {
          id
          url
          type
          created_at
        }
        likes
        comments
        views
        user {
          id
          name
          pfp
          bio
          is_verified
          is_online
        }
        is_liked
      }
      page_info {
        has_next_page
        next_cursor
      }
      total_count
    }
  }
`;

const GET_POST = gql`
  query GetPost($post_id: String!) {
    get_post(post_id: $post_id) {
      id
      user_id
      created_at
      content
      media {
        id
        url
        type
        created_at
      }
      likes
      comments
      views
      user {
        id
        name
        pfp
        bio
        is_verified
        is_online
      }
      is_liked
    }
  }
`;

const GET_COMMENTS = gql`
  query GetComments(
    $filter: CommentFilterInput!
    $limit: Int
    $cursor: String
  ) {
    get_comments(filter: $filter, limit: $limit, cursor: $cursor) {
      comments {
        id
        post_id
        user_id
        reply_to_id
        created_at
        content
        likes
        user {
          id
          name
          pfp
          bio
          is_verified
          is_online
        }
        is_liked
      }
      page_info {
        has_next_page
        next_cursor
      }
      total_count
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    create_post(input: $input) {
      id
      user_id
      created_at
      content
      media {
        id
        url
        type
        created_at
      }
      likes
      comments
      views
      user {
        id
        name
        pfp
        bio
        is_verified
        is_online
      }
      is_liked
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    create_comment(input: $input) {
      id
      post_id
      user_id
      reply_to_id
      created_at
      content
      likes
      user {
        id
        name
        pfp
        bio
        is_verified
        is_online
      }
      is_liked
    }
  }
`;

const TOGGLE_POST_LIKE = gql`
  mutation TogglePostLike($post_id: String!) {
    toggle_post_like(post_id: $post_id) {
      id
      likes
      is_liked
    }
  }
`;

const TOGGLE_COMMENT_LIKE = gql`
  mutation ToggleCommentLike($comment_id: String!) {
    toggle_comment_like(comment_id: $comment_id) {
      id
      likes
      is_liked
    }
  }
`;

const INCREMENT_POST_VIEW = gql`
  mutation IncrementPostView($post_id: String!) {
    increment_post_view(post_id: $post_id) {
      id
      views
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($post_id: String!) {
    delete_post(post_id: $post_id)
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($comment_id: String!) {
    delete_comment(comment_id: $comment_id)
  }
`;

const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      id
      status
    }
  }
`;

const CREATE_POKE = gql`
  mutation CreatePoke($type: ActivityType!, $target_user_id: String!) {
    createProfileActivity(type: $type, target_user_id: $target_user_id) {
      id
      type
    }
  }
`;

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export interface Media {
  id: string;
  url: string;
  type: MediaType;
  created_at: string;
}

export interface UserPublic {
  id: string;
  name: string;
  pfp: string;
  bio: string;
  is_verified: boolean;
  is_online: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  created_at: string;
  content: string;
  media: Media[];
  likes: number;
  comments: number;
  views: number;
  user: UserPublic;
  is_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  reply_to_id: string | null;
  created_at: string;
  content: string;
  likes: number;
  user: UserPublic;
  is_liked: boolean;
}

export interface PendingUpload {
  id: string;
  content: string;
  files: { uri: string }[];
  progress: number;
  status: "uploading" | "creating" | "done" | "error";
  error?: string;
}

interface CommunityState {
  // Feed state
  posts: Post[];
  isLoadingPosts: boolean;
  isLoadingMorePosts: boolean;
  postsCursor: string | null;
  hasMorePosts: boolean;
  postsError: string | null;

  // Post detail state
  currentPost: Post | null;
  comments: Comment[];
  isLoadingPost: boolean;
  isLoadingComments: boolean;
  isLoadingMoreComments: boolean;
  commentsCursor: string | null;
  hasMoreComments: boolean;
  commentsError: string | null;

  // Upload state
  pendingUpload: PendingUpload | null;

  // Actions
  fetchFeedPosts: (refresh?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string, refresh?: boolean) => Promise<void>;
  loadMoreComments: (postId: string) => Promise<void>;
  createPost: (content: string, files?: { uri: string; type?: "image" | "video" | "audio" | "file" }[]) => Promise<void>;
  createComment: (
    postId: string,
    content: string,
    replyToId?: string,
  ) => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;
  incrementPostView: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;
  reportContent: (targetId: string, reason: string, additionalInfo?: string) => Promise<boolean>;
  pokeUser: (userId: string) => Promise<boolean>;
  clearCurrentPost: () => void;
  reset: () => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  // Initial state
  posts: [],
  isLoadingPosts: false,
  isLoadingMorePosts: false,
  postsCursor: null,
  hasMorePosts: true,
  postsError: null,

  currentPost: null,
  comments: [],
  isLoadingPost: false,
  isLoadingComments: false,
  isLoadingMoreComments: false,
  commentsCursor: null,
  hasMoreComments: true,
  commentsError: null,

  pendingUpload: null,

  // Fetch feed posts
  fetchFeedPosts: async (refresh = false) => {
    const { isLoadingPosts, isLoadingMorePosts } = get();
    if (isLoadingPosts || isLoadingMorePosts) return;

    set({
      isLoadingPosts: true,
      postsError: null,
      ...(refresh ? { posts: [], postsCursor: null, hasMorePosts: true } : {}),
    });

    try {
      const result = await graphqlClient
        .query(
          GET_FEED_POSTS,
          { limit: 20 },
          refresh ? { requestPolicy: "network-only" } : {},
        )
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const data = result.data?.get_feed_posts;
      set({
        posts: data?.posts || [],
        postsCursor: data?.page_info?.next_cursor || null,
        hasMorePosts: data?.page_info?.has_next_page ?? false,
        isLoadingPosts: false,
      });
    } catch (error) {
      console.error("Fetch feed posts error:", error);
      set({
        postsError:
          error instanceof Error ? error.message : "Failed to load posts",
        isLoadingPosts: false,
      });
    }
  },

  // Load more posts
  loadMorePosts: async () => {
    const { isLoadingMorePosts, hasMorePosts, postsCursor } = get();
    if (isLoadingMorePosts || !hasMorePosts || !postsCursor) return;

    set({ isLoadingMorePosts: true });

    try {
      const result = await graphqlClient
        .query(GET_FEED_POSTS, { limit: 20, cursor: postsCursor })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const data = result.data?.get_feed_posts;
      set((state) => ({
        posts: [...state.posts, ...(data?.posts || [])],
        postsCursor: data?.page_info?.next_cursor || null,
        hasMorePosts: data?.page_info?.has_next_page ?? false,
        isLoadingMorePosts: false,
      }));
    } catch (error) {
      console.error("Load more posts error:", error);
      set({ isLoadingMorePosts: false });
    }
  },

  // Fetch single post
  fetchPost: async (postId: string) => {
    set({ isLoadingPost: true, currentPost: null });

    try {
      const result = await graphqlClient
        .query(GET_POST, { post_id: postId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      set({
        currentPost: result.data?.get_post || null,
        isLoadingPost: false,
      });
    } catch (error) {
      console.error("Fetch post error:", error);
      set({ isLoadingPost: false });
    }
  },

  // Fetch comments
  fetchComments: async (postId: string, refresh = false) => {
    const { isLoadingComments, isLoadingMoreComments } = get();
    if (isLoadingComments || isLoadingMoreComments) return;

    set({
      isLoadingComments: true,
      commentsError: null,
      ...(refresh
        ? { comments: [], commentsCursor: null, hasMoreComments: true }
        : {}),
    });

    try {
      const result = await graphqlClient
        .query(
          GET_COMMENTS,
          { filter: { post_id: postId, parent_only: true }, limit: 20 },
          refresh ? { requestPolicy: "network-only" } : {},
        )
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const data = result.data?.get_comments;
      set({
        comments: data?.comments || [],
        commentsCursor: data?.page_info?.next_cursor || null,
        hasMoreComments: data?.page_info?.has_next_page ?? false,
        isLoadingComments: false,
      });
    } catch (error) {
      console.error("Fetch comments error:", error);
      set({
        commentsError:
          error instanceof Error ? error.message : "Failed to load comments",
        isLoadingComments: false,
      });
    }
  },

  // Load more comments
  loadMoreComments: async (postId: string) => {
    const { isLoadingMoreComments, hasMoreComments, commentsCursor } = get();
    if (isLoadingMoreComments || !hasMoreComments || !commentsCursor) return;

    set({ isLoadingMoreComments: true });

    try {
      const result = await graphqlClient
        .query(GET_COMMENTS, {
          filter: { post_id: postId, parent_only: true },
          limit: 20,
          cursor: commentsCursor,
        })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const data = result.data?.get_comments;
      set((state) => ({
        comments: [...state.comments, ...(data?.comments || [])],
        commentsCursor: data?.page_info?.next_cursor || null,
        hasMoreComments: data?.page_info?.has_next_page ?? false,
        isLoadingMoreComments: false,
      }));
    } catch (error) {
      console.error("Load more comments error:", error);
      set({ isLoadingMoreComments: false });
    }
  },

  // Create post with optional media
  createPost: async (content: string, files?: { uri: string; type?: "image" | "video" | "audio" | "file" }[]) => {
    const uploadId = `upload-${Date.now()}`;

    // Start pending upload state
    set({
      pendingUpload: {
        id: uploadId,
        content,
        files: files || [],
        progress: 0,
        status: "uploading",
      },
    });

    try {
      let media: UploadedMedia[] = [];

      // Upload files if any
      if (files && files.length > 0) {
        const uploadResult = await uploadMedia(
          files,
          (progress: UploadProgress) => {
            set((state) => ({
              pendingUpload: state.pendingUpload
                ? { ...state.pendingUpload, progress: progress.percentage }
                : null,
            }));
          },
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Upload failed");
        }

        media = uploadResult.media || [];
      }

      // Update status to creating
      set((state) => ({
        pendingUpload: state.pendingUpload
          ? { ...state.pendingUpload, status: "creating", progress: 100 }
          : null,
      }));

      // Create the post
      const mediaInput = media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        created_at: m.created_at,
      }));

      const result = await graphqlClient
        .mutation(CREATE_POST, {
          input: { content, media: mediaInput.length > 0 ? mediaInput : null },
        })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const newPost = result.data?.create_post;

      // Add post to top of feed
      set((state) => ({
        posts: newPost ? [newPost, ...state.posts] : state.posts,
        pendingUpload: {
          ...state.pendingUpload!,
          status: "done",
          progress: 100,
        },
      }));

      // Clear pending upload after a short delay
      setTimeout(() => {
        set({ pendingUpload: null });
      }, 2000);
    } catch (error) {
      console.error("Create post error:", error);
      set((state) => ({
        pendingUpload: state.pendingUpload
          ? {
            ...state.pendingUpload,
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Failed to create post",
          }
          : null,
      }));
    }
  },

  // Create comment
  createComment: async (
    postId: string,
    content: string,
    replyToId?: string,
  ) => {
    try {
      const result = await graphqlClient
        .mutation(CREATE_COMMENT, {
          input: { post_id: postId, content, reply_to_id: replyToId || null },
        })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const newComment = result.data?.create_comment;

      // Add comment to list and update post comment count
      set((state) => ({
        comments: newComment ? [newComment, ...state.comments] : state.comments,
        currentPost: state.currentPost
          ? { ...state.currentPost, comments: state.currentPost.comments + 1 }
          : null,
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p,
        ),
      }));
    } catch (error) {
      console.error("Create comment error:", error);
    }
  },

  // Toggle post like
  togglePostLike: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
            ...p,
            is_liked: !p.is_liked,
            likes: p.is_liked ? p.likes - 1 : p.likes + 1,
          }
          : p,
      ),
      currentPost:
        state.currentPost?.id === postId
          ? {
            ...state.currentPost,
            is_liked: !state.currentPost.is_liked,
            likes: state.currentPost.is_liked
              ? state.currentPost.likes - 1
              : state.currentPost.likes + 1,
          }
          : state.currentPost,
    }));

    try {
      const result = await graphqlClient
        .mutation(TOGGLE_POST_LIKE, { post_id: postId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      // Update with server response
      const updated = result.data?.toggle_post_like;
      if (updated) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, likes: updated.likes, is_liked: updated.is_liked }
              : p,
          ),
          currentPost:
            state.currentPost?.id === postId
              ? {
                ...state.currentPost,
                likes: updated.likes,
                is_liked: updated.is_liked,
              }
              : state.currentPost,
        }));
      }
    } catch (error) {
      console.error("Toggle post like error:", error);
      // Revert optimistic update on error
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
              ...p,
              is_liked: !p.is_liked,
              likes: p.is_liked ? p.likes - 1 : p.likes + 1,
            }
            : p,
        ),
      }));
    }
  },

  // Toggle comment like
  toggleCommentLike: async (commentId: string) => {
    // Optimistic update
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId
          ? {
            ...c,
            is_liked: !c.is_liked,
            likes: c.is_liked ? c.likes - 1 : c.likes + 1,
          }
          : c,
      ),
    }));

    try {
      const result = await graphqlClient
        .mutation(TOGGLE_COMMENT_LIKE, { comment_id: commentId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const updated = result.data?.toggle_comment_like;
      if (updated) {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId
              ? { ...c, likes: updated.likes, is_liked: updated.is_liked }
              : c,
          ),
        }));
      }
    } catch (error) {
      console.error("Toggle comment like error:", error);
      // Revert optimistic update
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId
            ? {
              ...c,
              is_liked: !c.is_liked,
              likes: c.is_liked ? c.likes - 1 : c.likes + 1,
            }
            : c,
        ),
      }));
    }
  },

  // Increment post view
  incrementPostView: async (postId: string) => {
    try {
      const result = await graphqlClient
        .mutation(INCREMENT_POST_VIEW, { post_id: postId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      const updated = result.data?.increment_post_view;
      if (updated) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, views: updated.views } : p
          ),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, views: updated.views }
              : state.currentPost,
        }));
      }
    } catch (error) {
      console.error("Increment post view error:", error);
    }
  },

  // Delete post
  deletePost: async (postId: string) => {
    try {
      const result = await graphqlClient
        .mutation(DELETE_POST, { post_id: postId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      if (result.data?.delete_post) {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          currentPost: state.currentPost?.id === postId ? null : state.currentPost,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete post error:", error);
      return false;
    }
  },

  // Delete comment
  deleteComment: async (commentId: string, postId: string) => {
    try {
      const result = await graphqlClient
        .mutation(DELETE_COMMENT, { comment_id: commentId })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      if (result.data?.delete_comment) {
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
          currentPost: state.currentPost
            ? { ...state.currentPost, comments: state.currentPost.comments - 1 }
            : null,
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, comments: p.comments - 1 } : p
          ),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete comment error:", error);
      return false;
    }
  },

  // Report content
  reportContent: async (targetId: string, reason: string, additionalInfo?: string) => {
    try {
      const result = await graphqlClient
        .mutation(CREATE_REPORT, {
          input: {
            target_id: targetId,
            reason,
            additional_info: additionalInfo || "",
            media: [],
          },
        })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      return !!result.data?.createReport;
    } catch (error) {
      console.error("Report content error:", error);
      return false;
    }
  },

  // Poke user
  pokeUser: async (userId: string) => {
    try {
      const result = await graphqlClient
        .mutation(CREATE_POKE, {
          type: "POKE",
          target_user_id: userId,
        })
        .toPromise();

      if (result.error) throw new Error(result.error.message);

      return !!result.data?.createProfileActivity;
    } catch (error) {
      console.error("Poke user error:", error);
      return false;
    }
  },

  // Clear current post
  clearCurrentPost: () => {
    set({
      currentPost: null,
      comments: [],
      commentsCursor: null,
      hasMoreComments: true,
    });
  },

  // Reset store
  reset: () => {
    set({
      posts: [],
      isLoadingPosts: false,
      isLoadingMorePosts: false,
      postsCursor: null,
      hasMorePosts: true,
      postsError: null,
      currentPost: null,
      comments: [],
      isLoadingPost: false,
      isLoadingComments: false,
      isLoadingMoreComments: false,
      commentsCursor: null,
      hasMoreComments: true,
      commentsError: null,
      pendingUpload: null,
    });
  },
}));

export default useCommunityStore;
