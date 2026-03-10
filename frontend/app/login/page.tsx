"use client";

import { useState } from "react";
import { login } from "@/services/authService";

export default function LoginPage() {

 const [collegeId,setCollegeId] = useState("");
 const [password,setPassword] = useState("");

 const handleLogin = async () => {

  try{

   const res = await login({
    collegeId,
    password
   });

   console.log(res.data);

   localStorage.setItem(
    "token",
    res.data.token
   );

   alert("Login success");

  }catch(err){
   console.log(err);
  }

 };

 return (

  <div className="flex flex-col items-center mt-20">

   <h1 className="text-2xl font-bold">
    Login
   </h1>

   <input
    className="border p-2 m-2"
    placeholder="College ID"
    onChange={(e)=>setCollegeId(e.target.value)}
   />

   <input
    className="border p-2 m-2"
    type="password"
    placeholder="Password"
    onChange={(e)=>setPassword(e.target.value)}
   />

   <button
    className="bg-blue-500 text-white p-2"
    onClick={handleLogin}
   >
    Login
   </button>

  </div>

 );
}