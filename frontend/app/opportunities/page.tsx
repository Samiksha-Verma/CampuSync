"use client";

import { useEffect,useState } from "react";
import api from "@/services/api";

export default function OpportunitiesPage(){

 const [opportunities,setOpportunities] = useState([]);

 useEffect(()=>{

  const fetchOpportunities = async ()=>{

   const res = await api.get(
    "/student/opportunities"
   );

   setOpportunities(res.data);
  };

  fetchOpportunities();

 },[]);

 return(

  <div className="p-10">

   <h1 className="text-2xl font-bold">
    Opportunities
   </h1>

   {opportunities.map((op:any)=>(
    <div key={op._id} className="border p-4 m-3">

     <h2>{op.company}</h2>

     <p>{op.role}</p>

     <p>{op.description}</p>

    </div>
   ))}

  </div>

 );

}