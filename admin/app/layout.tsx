import type {Metadata} from "next";
import "./globals.css";

export const metadata:Metadata={
  title:"Skill Fusion Admin",
  description:"Private catalog management dashboard for Skill Fusion."
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="id"><body>{children}</body></html>;
}
