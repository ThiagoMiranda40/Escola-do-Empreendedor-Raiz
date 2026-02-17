-- View to help with course publication readiness
CREATE OR REPLACE VIEW course_stats AS
SELECT 
    c.id AS course_id,
    COUNT(DISTINCT m.id) AS module_count,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'published') AS published_lesson_count
FROM 
    course c
LEFT JOIN 
    module m ON c.id = m.course_id
LEFT JOIN 
    lesson l ON c.id = l.course_id
GROUP BY 
    c.id;

-- Grant access to the view
GRANT SELECT ON course_stats TO authenticated;
GRANT SELECT ON course_stats TO service_role;
