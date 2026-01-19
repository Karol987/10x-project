SELECT uc.user_id, c.id, c.external_api_id, c.name, c.creator_role 
FROM user_creators uc 
JOIN creators c ON uc.creator_id = c.id 
LIMIT 10;
