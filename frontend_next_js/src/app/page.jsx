"use client"
import Dashboard from "./dashboard/page";
import LoginPage from "./authentication/login/page";
import {useGlobalState} from '../js/globaluser'
export default function Home() {
  const { user, setUser } = useGlobalState(); // Access the global state

  if(user){
    return <Dashboard />
  }else{
    return <LoginPage />
  }

}
