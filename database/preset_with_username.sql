-- Usernames are stored within the profile table. This allows application to easily query the DB and get the username of the creator of each preset.
-- This needs to be a LEFT join. That way, if a user hasn't setup a username yet their presets will still appear in search results.
CREATE VIEW preset_with_username AS
SELECT P.*, U.username
FROM preset P
LEFT JOIN profile U ON P.user_id = U.user_id;