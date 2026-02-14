package anal

type Events string

const (
	// Auth events
	USER_LOGIN           Events = "login"
	USER_SIGNUP          Events = "signup"
	USER_ONBOARDED       Events = "onboarded"
	USER_PROFILE_UPDATED Events = "profile_updated"

	// Errors
	SERVER_ERROR     Events = "$exception"
	BAD_REQUEST_400  Events = "bad_request_400"
	UNAUTHORIZED_401 Events = "unauthorized_401"
	SERVER_ERROR_500 Events = "server_error_500"

	// User interaction events
	USER_POKED        Events = "user_poked"
	CHAT_MESSAGE_SENT Events = "chat_message_sent"
	SWIPE_ACTION      Events = "swipe_action"
	MATCH_CREATED     Events = "match_created"
	POST_CREATED      Events = "post_created"
	COMMENT_CREATED   Events = "comment_created"
	USER_ONLINE       Events = "user_online"
	USER_OFFLINE      Events = "user_offline"

	// DB issues
	DB_CONNECTION_ISSUE Events = "db_connection_issue"
)

type Properties string

const (
	// User specific
	USER_ID      Properties = "uid"
	USER_PHONE   Properties = "phone"
	USER_EMAIL   Properties = "email"
	USER_GENDER  Properties = "gender"
	USER_NAME    Properties = "name"
	USER_PFP     Properties = "pfp"
	USER_PLAN    Properties = "user_plan"
	USER_IP      Properties = "user_ip"
	USER_COUNTRY Properties = "user_country"
	USER_CITY    Properties = "user_city"

	// Action specific
	TARGET_USER_ID Properties = "target_uid"
	MESSAGE_TYPE   Properties = "message_type"
	SWIPE_TYPE     Properties = "swipe_type"
	MATCH_ID       Properties = "match_id"
	POST_ID        Properties = "post_id"
	COMMENT_ID     Properties = "comment_id"

	// Errors
	ERROR_LIST        Properties = "$exception_list"
	ERROR_FINGERPRINT Properties = "$exception_fingerprint"
	ERROR_TYPE        Properties = "fail_type"
)
