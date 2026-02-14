package community

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"context"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/database"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

func GetCommentReplies(commentId string) ([]*models.Comment, error) {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey(fmt.Sprintf("spark:comment:replies:%s", commentId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	var comments []*models.Comment
	err := commentORM.GetByFieldEquals("ReplyToId", commentId).Scan(&comments)
	if err != nil {
		return nil, err
	}
	return comments, nil
}

func CreatePost(post *models.Post) error {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey("spark:posts"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	return postORM.Insert(post)
}

func UpdatePost(post *models.Post) error {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey("spark:posts"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	if err := postORM.Update(post, post.Id); err != nil {
		return err
	}

	return postORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:posts:%s", post.Id))
}

func DeletePost(postID string) error {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey("spark:posts"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	if _, err := postORM.DeleteByPrimaryKey(postID); err != nil {
		return err
	}

	return postORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:posts:%s", postID))
}

func GetPostById(postID string) (*models.Post, error) {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey(fmt.Sprintf("spark:posts:%s", postID)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	var p []models.Post
	err := postORM.GetByPrimaryKey(postID).Scan(&p)
	if err != nil {
		return nil, err
	}
	if len(p) == 0 {
		return nil, fmt.Errorf("post not found")
	}
	post := p[0]
	return &post, nil
}

func GetPosts(filter *model.PostFilterInput, sort *model.SortInput, limit int, offset int) ([]*models.Post, int, error) {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey("spark:posts:list"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(2*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	query := "SELECT * FROM posts WHERE 1=1"
	args := []any{}
	argIndex := 1

	if filter != nil {
		if filter.UserID != nil {
			query += fmt.Sprintf(" AND user_id = $%d", argIndex)
			args = append(args, *filter.UserID)
			argIndex++
		}
		if filter.SearchContent != nil {
			query += fmt.Sprintf(" AND content ILIKE $%d", argIndex)
			args = append(args, "%"+*filter.SearchContent+"%")
			argIndex++
		}
		if filter.CreatedAfter != nil {
			query += fmt.Sprintf(" AND created_at >= $%d", argIndex)
			args = append(args, *filter.CreatedAfter)
			argIndex++
		}
		if filter.CreatedBefore != nil {
			query += fmt.Sprintf(" AND created_at <= $%d", argIndex)
			args = append(args, *filter.CreatedBefore)
			argIndex++
		}
		if filter.MinLikes != nil {
			query += fmt.Sprintf(" AND likes >= $%d", argIndex)
			args = append(args, *filter.MinLikes)
			argIndex++
		}
		if filter.MinComments != nil {
			query += fmt.Sprintf(" AND comments >= $%d", argIndex)
			args = append(args, *filter.MinComments)
			argIndex++
		}
		if filter.MinViews != nil {
			query += fmt.Sprintf(" AND views >= $%d", argIndex)
			args = append(args, *filter.MinViews)
			argIndex++
		}
		if filter.HasMedia != nil && *filter.HasMedia {
			query += " AND media IS NOT NULL AND jsonb_array_length(media::jsonb) > 0"
		}
	}

	countQuery := "SELECT COUNT(*) FROM posts WHERE 1=1"
	countArgs := []any{}
	countArgIndex := 1

	if filter != nil {
		if filter.UserID != nil {
			countQuery += fmt.Sprintf(" AND user_id = $%d", countArgIndex)
			countArgs = append(countArgs, *filter.UserID)
			countArgIndex++
		}
		if filter.SearchContent != nil {
			countQuery += fmt.Sprintf(" AND content ILIKE $%d", countArgIndex)
			countArgs = append(countArgs, "%"+*filter.SearchContent+"%")
			countArgIndex++
		}
		if filter.CreatedAfter != nil {
			countQuery += fmt.Sprintf(" AND created_at >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.CreatedAfter)
			countArgIndex++
		}
		if filter.CreatedBefore != nil {
			countQuery += fmt.Sprintf(" AND created_at <= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.CreatedBefore)
			countArgIndex++
		}
		if filter.MinLikes != nil {
			countQuery += fmt.Sprintf(" AND likes >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.MinLikes)
			countArgIndex++
		}
		if filter.MinComments != nil {
			countQuery += fmt.Sprintf(" AND comments >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.MinComments)
			countArgIndex++
		}
		if filter.MinViews != nil {
			countQuery += fmt.Sprintf(" AND views >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.MinViews)
			countArgIndex++
		}
		if filter.HasMedia != nil && *filter.HasMedia {
			countQuery += " AND media IS NOT NULL AND jsonb_array_length(media::jsonb) > 0"
		}
	}

	total := 0
	db, dbErr := database.PostgresConn()
	if dbErr == nil {
		defer db.Close()
		_ = db.QueryRow(countQuery, countArgs...).Scan(&total)
	}

	if sort != nil {
		orderDir := "DESC"
		if sort.Order == model.SortOrderAsc {
			orderDir = "ASC"
		}

		switch sort.Field {
		case string(model.PostSortFieldCreatedAt):
			query += " ORDER BY created_at " + orderDir
		case string(model.PostSortFieldLikes):
			query += " ORDER BY likes " + orderDir
		case string(model.PostSortFieldComments):
			query += " ORDER BY comments " + orderDir
		case string(model.PostSortFieldViews):
			query += " ORDER BY views " + orderDir
		default:
			query += " ORDER BY created_at DESC"
		}
	} else {
		query += " ORDER BY created_at DESC"
	}

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	var postsRaw []models.Post
	err := postORM.QueryRaw(query, args...).Scan(&postsRaw)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]*models.Post, len(postsRaw))
	for i := range postsRaw {
		posts[i] = &postsRaw[i]
	}

	return posts, total, nil
}

func GetFeedPosts(userID string, limit int, offset int) ([]*models.Post, int, error) {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey(fmt.Sprintf("spark:feed:%s", userID)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(1*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	query := `
		SELECT p.* FROM posts p
		LEFT JOIN matches m ON (
			(m.she_id = $1 AND p.user_id = m.he_id AND m.is_unlocked = true) OR
			(m.he_id = $1 AND p.user_id = m.she_id AND m.is_unlocked = true)
		)
		ORDER BY
			CASE
				WHEN p.user_id = $1 THEN 3
				WHEN m.id IS NOT NULL THEN 2
				ELSE 1
			END DESC,
			p.created_at DESC
		LIMIT $2 OFFSET $3
	`

	countQuery := `SELECT COUNT(*) FROM posts`

	total := 0
	db, dbErr := database.PostgresConn()
	if dbErr == nil {
		defer db.Close()
		_ = db.QueryRow(countQuery).Scan(&total)
	}
	defer db.Close()

	var postsRaw []models.Post
	err := postORM.QueryRaw(query, userID, limit, offset).Scan(&postsRaw)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]*models.Post, len(postsRaw))
	for i := range postsRaw {
		posts[i] = &postsRaw[i]
	}

	return posts, total, nil
}

func GetTrendingPosts(timeWindow int, limit int, offset int) ([]*models.Post, int, error) {
	postORM := orm.Load(&models.Post{},
		orm.WithCacheKey("spark:trending"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer postORM.Close()

	since := time.Now().Add(-time.Duration(timeWindow) * time.Hour)

	query := `
		SELECT * FROM posts
		WHERE created_at >= $1
		ORDER BY (likes * 2 + comments * 3 + views) DESC
		LIMIT $2 OFFSET $3
	`

	countQuery := `
		SELECT COUNT(*) FROM posts
		WHERE created_at >= $1
	`

	total := 0
	db, dbErr := database.PostgresConn()
	if dbErr == nil {
		defer db.Close()
		_ = db.QueryRow(countQuery, since).Scan(&total)
	}

	var postsRaw []models.Post
	err := postORM.QueryRaw(query, since, limit, offset).Scan(&postsRaw)
	if err != nil {
		return nil, 0, err
	}

	posts := make([]*models.Post, len(postsRaw))
	for i := range postsRaw {
		posts[i] = &postsRaw[i]
	}

	return posts, total, nil
}

func CreateComment(comment *models.Comment) error {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey("spark:comments"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	return commentORM.Insert(comment)
}

func UpdateComment(comment *models.Comment) error {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey("spark:comments"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	if err := commentORM.Update(comment, comment.Id); err != nil {
		return err
	}

	return commentORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:comments:%s", comment.Id))
}

func DeleteComment(commentID string) error {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey("spark:comments"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	if _, err := commentORM.DeleteByPrimaryKey(commentID); err != nil {
		return err
	}

	return commentORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:comments:%s", commentID))
}

func GetCommentById(commentID string) (*models.Comment, error) {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey(fmt.Sprintf("spark:comments:%s", commentID)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	var c []models.Comment
	err := commentORM.GetByPrimaryKey(commentID).Scan(&c)
	if err != nil {
		return nil, err
	}
	if len(c) == 0 {
		return nil, fmt.Errorf("comment not found")
	}
	comment := c[0]
	return &comment, nil
}

func GetComments(filter *model.CommentFilterInput, sort *model.SortInput, limit int, offset int) ([]*models.Comment, int, error) {
	commentORM := orm.Load(&models.Comment{},
		orm.WithCacheKey("spark:comments:list"),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(2*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer commentORM.Close()

	query := "SELECT * FROM comments WHERE 1=1"
	args := []any{}
	argIndex := 1

	if filter != nil {
		if filter.PostID != nil {
			query += fmt.Sprintf(" AND post_id = $%d", argIndex)
			args = append(args, *filter.PostID)
			argIndex++
		}
		if filter.UserID != nil {
			query += fmt.Sprintf(" AND user_id = $%d", argIndex)
			args = append(args, *filter.UserID)
			argIndex++
		}
		if filter.ReplyToID != nil {
			query += fmt.Sprintf(" AND reply_to_id = $%d", argIndex)
			args = append(args, *filter.ReplyToID)
			argIndex++
		}
		if filter.ParentOnly != nil && *filter.ParentOnly {
			query += " AND (reply_to_id = '' OR reply_to_id IS NULL)"
		}
		if filter.SearchContent != nil {
			query += fmt.Sprintf(" AND content ILIKE $%d", argIndex)
			args = append(args, "%"+*filter.SearchContent+"%")
			argIndex++
		}
		if filter.CreatedAfter != nil {
			query += fmt.Sprintf(" AND created_at >= $%d", argIndex)
			args = append(args, *filter.CreatedAfter)
			argIndex++
		}
		if filter.CreatedBefore != nil {
			query += fmt.Sprintf(" AND created_at <= $%d", argIndex)
			args = append(args, *filter.CreatedBefore)
			argIndex++
		}
		if filter.MinLikes != nil {
			query += fmt.Sprintf(" AND likes >= $%d", argIndex)
			args = append(args, *filter.MinLikes)
			argIndex++
		}
	}

	countQuery := "SELECT COUNT(*) FROM comments WHERE 1=1"
	countArgs := []any{}
	countArgIndex := 1

	if filter != nil {
		if filter.PostID != nil {
			countQuery += fmt.Sprintf(" AND post_id = $%d", countArgIndex)
			countArgs = append(countArgs, *filter.PostID)
			countArgIndex++
		}
		if filter.UserID != nil {
			countQuery += fmt.Sprintf(" AND user_id = $%d", countArgIndex)
			countArgs = append(countArgs, *filter.UserID)
			countArgIndex++
		}
		if filter.ReplyToID != nil {
			countQuery += fmt.Sprintf(" AND reply_to_id = $%d", countArgIndex)
			countArgs = append(countArgs, *filter.ReplyToID)
			countArgIndex++
		}
		if filter.ParentOnly != nil && *filter.ParentOnly {
			countQuery += " AND (reply_to_id = '' OR reply_to_id IS NULL)"
		}
		if filter.SearchContent != nil {
			countQuery += fmt.Sprintf(" AND content ILIKE $%d", countArgIndex)
			countArgs = append(countArgs, "%"+*filter.SearchContent+"%")
			countArgIndex++
		}
		if filter.CreatedAfter != nil {
			countQuery += fmt.Sprintf(" AND created_at >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.CreatedAfter)
			countArgIndex++
		}
		if filter.CreatedBefore != nil {
			countQuery += fmt.Sprintf(" AND created_at <= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.CreatedBefore)
			countArgIndex++
		}
		if filter.MinLikes != nil {
			countQuery += fmt.Sprintf(" AND likes >= $%d", countArgIndex)
			countArgs = append(countArgs, *filter.MinLikes)
			countArgIndex++
		}
	}

	total := 0
	db, dbErr := database.PostgresConn()
	if dbErr == nil {
		defer db.Close()
		_ = db.QueryRow(countQuery, countArgs...).Scan(&total)
	}

	if sort != nil {
		orderDir := "DESC"
		if sort.Order == model.SortOrderAsc {
			orderDir = "ASC"
		}

		switch sort.Field {
		case string(model.CommentSortFieldCreatedAt):
			query += " ORDER BY created_at " + orderDir
		case string(model.CommentSortFieldLikes):
			query += " ORDER BY likes " + orderDir
		default:
			query += " ORDER BY created_at DESC"
		}
	} else {
		query += " ORDER BY created_at DESC"
	}

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	var commentsRaw []models.Comment
	err := commentORM.QueryRaw(query, args...).Scan(&commentsRaw)
	if err != nil {
		return nil, 0, err
	}

	comments := make([]*models.Comment, len(commentsRaw))
	for i := range commentsRaw {
		comments[i] = &commentsRaw[i]
	}

	return comments, total, nil
}

func IncrementPostLikeCount(postID string) error {
	postORM := orm.Load(&models.Post{})
	defer postORM.Close()

	_, err := postORM.ExecuteRaw("UPDATE posts SET likes = likes + 1 WHERE id = $1", postID)
	return err
}

func DecrementPostLikeCount(postID string) error {
	postORM := orm.Load(&models.Post{})
	defer postORM.Close()

	_, err := postORM.ExecuteRaw("UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = $1", postID)
	return err
}

func IncrementPostCommentCount(postID string) error {
	postORM := orm.Load(&models.Post{})
	defer postORM.Close()

	_, err := postORM.ExecuteRaw("UPDATE posts SET comments = comments + 1 WHERE id = $1", postID)
	return err
}

func DecrementPostCommentCount(postID string) error {
	postORM := orm.Load(&models.Post{})
	defer postORM.Close()

	_, err := postORM.ExecuteRaw("UPDATE posts SET comments = GREATEST(comments - 1, 0) WHERE id = $1", postID)
	return err
}

func IncrementPostViewCount(postID string) error {
	postORM := orm.Load(&models.Post{})
	defer postORM.Close()

	_, err := postORM.ExecuteRaw("UPDATE posts SET views = views + 1 WHERE id = $1", postID)
	return err
}

func IncrementCommentLikeCount(commentID string) error {
	commentORM := orm.Load(&models.Comment{})
	defer commentORM.Close()

	_, err := commentORM.ExecuteRaw("UPDATE comments SET likes = likes + 1 WHERE id = $1", commentID)
	return err
}

func DecrementCommentLikeCount(commentID string) error {
	commentORM := orm.Load(&models.Comment{})
	defer commentORM.Close()

	_, err := commentORM.ExecuteRaw("UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = $1", commentID)
	return err
}

func LikePost(postID string, userID string) error {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("post_likes:%s", postID)
	return redis.SAdd(context.Background(), key, userID).Err()
}

func UnlikePost(postID string, userID string) error {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("post_likes:%s", postID)
	return redis.SRem(context.Background(), key, userID).Err()
}

func IsPostLikedByUser(postID string, userID string) (bool, error) {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("post_likes:%s", postID)
	return redis.SIsMember(context.Background(), key, userID).Result()
}

func LikeComment(commentID string, userID string) error {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("comment_likes:%s", commentID)
	return redis.SAdd(context.Background(), key, userID).Err()
}

func UnlikeComment(commentID string, userID string) error {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("comment_likes:%s", commentID)
	return redis.SRem(context.Background(), key, userID).Err()
}

func IsCommentLikedByUser(commentID string, userID string) (bool, error) {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("comment_likes:%s", commentID)
	return redis.SIsMember(context.Background(), key, userID).Result()
}

func MarkPostAsViewed(postID string, userID string) error {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("post_views:%s", postID)
	return redis.SAdd(context.Background(), key, userID).Err()
}

func HasUserViewedPost(postID string, userID string) (bool, error) {
	redis := utils.RedisConnect()
	defer redis.Close()

	key := fmt.Sprintf("post_views:%s", postID)
	return redis.SIsMember(context.Background(), key, userID).Result()
}
