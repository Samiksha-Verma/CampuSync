import api from "./api";

export const registerStudent = (data:any) => {
 return api.post("/auth/register", data);
};

export const verifyOTP = (data:any) => {
 return api.post("/auth/verify-otp", data);
};

export const login = (data:any) => {
 return api.post("/auth/login", data);
};