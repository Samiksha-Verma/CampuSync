const collegeIdRegex = /^AEC\/\d{4}\/\d{3}$/;

export const validateCollegeId = (collegeId) => {
  return collegeIdRegex.test(collegeId);
};