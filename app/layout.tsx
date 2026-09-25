import type {Metadata} from "next";
import "./globals.css";

export const metadata:Metadata={
  title:"Skill Fusion — Smart Tech Worth Buying",
  description:"Skill Fusion technology discovery and affiliate marketplace by @wilie_jonathan. Brand: @skill.fusion.id.",
  openGraph:{
    title:"Skill Fusion — Smart Tech Worth Buying",
    description:"Curated technology, gadgets and smart gear for Indonesia."
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id"><body>{children}</body></html>;
}
