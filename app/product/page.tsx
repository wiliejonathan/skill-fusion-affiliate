"use client";
import {useEffect,useState} from "react";
import DynamicProductPage from "@/components/DynamicProductPage";
export default function Page(){
 const [id,setId]=useState("");
 useEffect(()=>{setId(new URLSearchParams(window.location.search).get("id")||"")},[]);
 return <DynamicProductPage id={id}/>;
}
