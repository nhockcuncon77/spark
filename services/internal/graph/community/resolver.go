package community

import (
	"spark/internal/anal"
	"spark/internal/graph/directives"
	"spark/internal/graph/model"
	"spark/internal/helpers/community"
	"spark/internal/models"
	"context"
	"encoding/base64"
	"fmt"
	"strconv"
	"time"

	"github.com/MelloB1989/karma/utils"
)

type Resolver struct{}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreatePost(ctx context.Context, input model.CreatePostInput) (*models.Post, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	media := []models.Media{}
	if input.Media != nil {
		for _, m := range input.Media {
			t, err := time.Parse(time.RFC3339, m.CreatedAt)
			if err != nil {
				return nil, fmt.Errorf("invalid media created at: %w", err)
			}
			media = append(media, models.Media{
				Id:        m.ID,
				Url:       m.URL,
				Type:      string(m.Type),
				CreatedAt: t,
			})
		}
	}

	post := &models.Post{
		Id:        utils.GenerateID(10),
		UserId:    claims.UserID,
		CreatedAt: time.Now(),
		Content:   input.Content,
		Media:     media,
		Likes:     0,
		Comments:  0,
		Views:     0,
	}

	if err := community.CreatePost(post); err != nil {
		return nil, err
	}

	go func() {
		ae.SetProperty(anal.POST_ID, post.Id)
		ae.SendEvent(anal.POST_CREATED)
	}()

	return post, nil
}

func (r *Resolver) UpdatePost(ctx context.Context, input model.UpdatePostInput) (*models.Post, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	post, err := community.GetPostById(input.PostID)
	if err != nil {
		return nil, err
	}

	if post.UserId != claims.UserID {
		return nil, fmt.Errorf("unauthorized: not post owner")
	}

	if input.Content != nil {
		post.Content = *input.Content
	}

	if input.Media != nil {
		media := []models.Media{}
		for _, m := range input.Media {
			t, err := time.Parse(time.RFC3339, m.CreatedAt)
			if err != nil {
				return nil, fmt.Errorf("invalid media created at: %w", err)
			}
			media = append(media, models.Media{
				Id:        m.ID,
				Url:       m.URL,
				Type:      string(m.Type),
				CreatedAt: t,
			})
		}
		post.Media = media
	}

	if err := community.UpdatePost(post); err != nil {
		return nil, err
	}

	return post, nil
}

func (r *Resolver) DeletePost(ctx context.Context, postID string) (bool, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return false, fmt.Errorf("unauthorized: %w", err)
	}

	post, err := community.GetPostById(postID)
	if err != nil {
		return false, err
	}

	if post.UserId != claims.UserID {
		return false, fmt.Errorf("unauthorized: not post owner")
	}

	if err := community.DeletePost(postID); err != nil {
		return false, err
	}

	return true, nil
}

func (r *Resolver) CreateComment(ctx context.Context, input model.CreateCommentInput) (*models.Comment, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	replyToId := ""
	if input.ReplyToID != nil {
		replyToId = *input.ReplyToID
	}

	comment := &models.Comment{
		Id:        utils.GenerateID(10),
		PostId:    input.PostID,
		ReplyToId: replyToId,
		UserId:    claims.UserID,
		CreatedAt: time.Now(),
		Content:   input.Content,
		Likes:     0,
	}

	if err := community.CreateComment(comment); err != nil {
		return nil, err
	}

	if err := community.IncrementPostCommentCount(input.PostID); err != nil {
		return nil, err
	}

	go func() {
		ae.SetProperty(anal.COMMENT_ID, comment.Id)
		ae.SetProperty(anal.POST_ID, input.PostID)
		ae.SendEvent(anal.COMMENT_CREATED)
	}()

	return comment, nil
}

func (r *Resolver) UpdateComment(ctx context.Context, input model.UpdateCommentInput) (*models.Comment, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	comment, err := community.GetCommentById(input.CommentID)
	if err != nil {
		return nil, err
	}

	if comment.UserId != claims.UserID {
		return nil, fmt.Errorf("unauthorized: not comment owner")
	}

	comment.Content = input.Content

	if err := community.UpdateComment(comment); err != nil {
		return nil, err
	}

	return comment, nil
}

func (r *Resolver) DeleteComment(ctx context.Context, commentID string) (bool, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return false, fmt.Errorf("unauthorized: %w", err)
	}

	comment, err := community.GetCommentById(commentID)
	if err != nil {
		return false, err
	}

	if comment.UserId != claims.UserID {
		return false, fmt.Errorf("unauthorized: not comment owner")
	}

	if err := community.DeleteComment(commentID); err != nil {
		return false, err
	}

	if err := community.DecrementPostCommentCount(comment.PostId); err != nil {
		return false, err
	}

	return true, nil
}

func (r *Resolver) TogglePostLike(ctx context.Context, postID string) (*models.Post, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	isLiked, err := community.IsPostLikedByUser(postID, claims.UserID)
	if err != nil {
		return nil, err
	}

	if isLiked {
		if err := community.UnlikePost(postID, claims.UserID); err != nil {
			return nil, err
		}
		if err := community.DecrementPostLikeCount(postID); err != nil {
			return nil, err
		}
	} else {
		if err := community.LikePost(postID, claims.UserID); err != nil {
			return nil, err
		}
		if err := community.IncrementPostLikeCount(postID); err != nil {
			return nil, err
		}
	}

	post, err := community.GetPostById(postID)
	if err != nil {
		return nil, err
	}

	return post, nil
}

func (r *Resolver) ToggleCommentLike(ctx context.Context, commentID string) (*models.Comment, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	isLiked, err := community.IsCommentLikedByUser(commentID, claims.UserID)
	if err != nil {
		return nil, err
	}

	if isLiked {
		if err := community.UnlikeComment(commentID, claims.UserID); err != nil {
			return nil, err
		}
		if err := community.DecrementCommentLikeCount(commentID); err != nil {
			return nil, err
		}
	} else {
		if err := community.LikeComment(commentID, claims.UserID); err != nil {
			return nil, err
		}
		if err := community.IncrementCommentLikeCount(commentID); err != nil {
			return nil, err
		}
	}

	comment, err := community.GetCommentById(commentID)
	if err != nil {
		return nil, err
	}

	return comment, nil
}

func (r *Resolver) IncrementPostView(ctx context.Context, postID string) (*models.Post, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	viewed, err := community.HasUserViewedPost(postID, claims.UserID)
	if err != nil {
		return nil, err
	}

	if !viewed {
		if err := community.MarkPostAsViewed(postID, claims.UserID); err != nil {
			return nil, err
		}
		if err := community.IncrementPostViewCount(postID); err != nil {
			return nil, err
		}
	}

	post, err := community.GetPostById(postID)
	if err != nil {
		return nil, err
	}

	return post, nil
}

func (r *Resolver) GetPosts(ctx context.Context, filter *model.PostFilterInput, sort *model.SortInput, limit *int32, cursor *string) (*model.PostsConnection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	pageLimit := 20
	if limit != nil {
		pageLimit = int(*limit)
	}

	offset := 0
	if cursor != nil && *cursor != "" {
		decodedCursor, err := decodeCursor(*cursor)
		if err != nil {
			return nil, err
		}
		offset = decodedCursor
	}

	posts, total, err := community.GetPosts(filter, sort, pageLimit, offset)
	if err != nil {
		return nil, err
	}

	hasNext := offset+pageLimit < total
	var nextCursor *string
	if hasNext {
		nc := encodeCursor(offset + pageLimit)
		nextCursor = &nc
	}

	hasPrev := offset > 0
	var prevCursor *string
	if hasPrev {
		pc := encodeCursor(max(0, offset-pageLimit))
		prevCursor = &pc
	}

	for i, post := range posts {
		isLiked, _ := community.IsPostLikedByUser(post.Id, claims.UserID)
		posts[i].IsLiked = isLiked
	}

	return &model.PostsConnection{
		Posts:      posts,
		TotalCount: int32(total),
		PageInfo: &model.PageInfo{
			HasNextPage:     hasNext,
			NextCursor:      nextCursor,
			HasPreviousPage: hasPrev,
			PreviousCursor:  prevCursor,
		},
	}, nil
}

func (r *Resolver) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	post, err := community.GetPostById(postID)
	if err != nil {
		return nil, err
	}

	isLiked, _ := community.IsPostLikedByUser(postID, claims.UserID)
	post.IsLiked = isLiked

	return post, nil
}

func (r *Resolver) GetFeedPosts(ctx context.Context, limit *int32, cursor *string) (*model.PostsConnection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	pageLimit := 20
	if limit != nil {
		pageLimit = int(*limit)
	}

	offset := 0
	if cursor != nil && *cursor != "" {
		decodedCursor, err := decodeCursor(*cursor)
		if err != nil {
			return nil, err
		}
		offset = decodedCursor
	}

	posts, total, err := community.GetFeedPosts(claims.UserID, pageLimit, offset)
	if err != nil {
		return nil, err
	}

	hasNext := offset+pageLimit < total
	var nextCursor *string
	if hasNext {
		nc := encodeCursor(offset + pageLimit)
		nextCursor = &nc
	}

	hasPrev := offset > 0
	var prevCursor *string
	if hasPrev {
		pc := encodeCursor(max(0, offset-pageLimit))
		prevCursor = &pc
	}

	for i, post := range posts {
		isLiked, _ := community.IsPostLikedByUser(post.Id, claims.UserID)
		posts[i].IsLiked = isLiked
	}

	return &model.PostsConnection{
		Posts:      posts,
		TotalCount: int32(total),
		PageInfo: &model.PageInfo{
			HasNextPage:     hasNext,
			NextCursor:      nextCursor,
			HasPreviousPage: hasPrev,
			PreviousCursor:  prevCursor,
		},
	}, nil
}

func (r *Resolver) GetComments(ctx context.Context, filter model.CommentFilterInput, sort *model.SortInput, limit *int32, cursor *string) (*model.CommentsConnection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	pageLimit := 20
	if limit != nil {
		pageLimit = int(*limit)
	}

	offset := 0
	if cursor != nil && *cursor != "" {
		decodedCursor, err := decodeCursor(*cursor)
		if err != nil {
			return nil, err
		}
		offset = decodedCursor
	}

	comments, total, err := community.GetComments(&filter, sort, pageLimit, offset)
	if err != nil {
		return nil, err
	}

	hasNext := offset+pageLimit < total
	var nextCursor *string
	if hasNext {
		nc := encodeCursor(offset + pageLimit)
		nextCursor = &nc
	}

	hasPrev := offset > 0
	var prevCursor *string
	if hasPrev {
		pc := encodeCursor(max(0, offset-pageLimit))
		prevCursor = &pc
	}

	for i, comment := range comments {
		isLiked, _ := community.IsCommentLikedByUser(comment.Id, claims.UserID)
		comments[i].IsLiked = isLiked
	}

	return &model.CommentsConnection{
		Comments:   comments,
		TotalCount: int32(total),
		PageInfo: &model.PageInfo{
			HasNextPage:     hasNext,
			NextCursor:      nextCursor,
			HasPreviousPage: hasPrev,
			PreviousCursor:  prevCursor,
		},
	}, nil
}

func (r *Resolver) GetComment(ctx context.Context, commentID string) (*models.Comment, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	comment, err := community.GetCommentById(commentID)
	if err != nil {
		return nil, err
	}

	isLiked, _ := community.IsCommentLikedByUser(commentID, claims.UserID)
	comment.IsLiked = isLiked

	return comment, nil
}

func (r *Resolver) GetTrendingPosts(ctx context.Context, timeWindow *int32, limit *int32, cursor *string) (*model.PostsConnection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	window := 24
	if timeWindow != nil {
		window = int(*timeWindow)
	}

	pageLimit := 20
	if limit != nil {
		pageLimit = int(*limit)
	}

	offset := 0
	if cursor != nil && *cursor != "" {
		decodedCursor, err := decodeCursor(*cursor)
		if err != nil {
			return nil, err
		}
		offset = decodedCursor
	}

	posts, total, err := community.GetTrendingPosts(window, pageLimit, offset)
	if err != nil {
		return nil, err
	}

	hasNext := offset+pageLimit < total
	var nextCursor *string
	if hasNext {
		nc := encodeCursor(offset + pageLimit)
		nextCursor = &nc
	}

	hasPrev := offset > 0
	var prevCursor *string
	if hasPrev {
		pc := encodeCursor(max(0, offset-pageLimit))
		prevCursor = &pc
	}

	for i, post := range posts {
		isLiked, _ := community.IsPostLikedByUser(post.Id, claims.UserID)
		posts[i].IsLiked = isLiked
	}

	return &model.PostsConnection{
		Posts:      posts,
		TotalCount: int32(total),
		PageInfo: &model.PageInfo{
			HasNextPage:     hasNext,
			NextCursor:      nextCursor,
			HasPreviousPage: hasPrev,
			PreviousCursor:  prevCursor,
		},
	}, nil
}

func encodeCursor(offset int) string {
	return base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(offset)))
}

func decodeCursor(cursor string) (int, error) {
	decoded, err := base64.StdEncoding.DecodeString(cursor)
	if err != nil {
		return 0, err
	}
	offset, err := strconv.Atoi(string(decoded))
	if err != nil {
		return 0, err
	}
	return offset, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
