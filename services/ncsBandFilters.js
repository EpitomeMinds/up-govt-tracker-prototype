const SALARY_BAND_EXPR = `CASE
  WHEN hide_salary_range = 1 OR (min_salary IS NULL AND max_salary IS NULL) THEN 'Not disclosed'
  WHEN COALESCE(max_salary, min_salary) < 300000 THEN 'Below 3 LPA'
  WHEN COALESCE(max_salary, min_salary) < 500000 THEN '3–5 LPA'
  WHEN COALESCE(max_salary, min_salary) < 800000 THEN '5–8 LPA'
  WHEN COALESCE(max_salary, min_salary) < 1200000 THEN '8–12 LPA'
  ELSE '12+ LPA'
END`;

const EXPERIENCE_BAND_EXPR = `CASE
  WHEN max_experience IS NULL OR max_experience <= 1 THEN 'Fresher (0–1 yr)'
  WHEN max_experience <= 3 THEN '1–3 yrs'
  WHEN max_experience <= 5 THEN '3–5 yrs'
  WHEN max_experience <= 10 THEN '5–10 yrs'
  ELSE '10+ yrs'
END`;

module.exports = {
  SALARY_BAND_EXPR,
  EXPERIENCE_BAND_EXPR,
};
