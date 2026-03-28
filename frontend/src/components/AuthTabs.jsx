import { useState } from "react";
import axios from "axios";
import "../styles/auth.css";

function AuthTabs() {

  const [tab,setTab] = useState("login");

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const register = async () => {

    await axios.post(
      "http://localhost:5000/api/auth/register",
      {name,email,password}
    );

    alert("Registration successful");

    setTab("login");
  };

  const login = async () => {

    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      {email,password}
    );

    localStorage.setItem("token",res.data.token);
    localStorage.setItem("username",res.data.user.name);

    window.location.href="/dashboard";
  };

  return (

    <div className="auth-container">

      <div className="auth-card">

        <h2>SmartSplit</h2>

        <div className="tabs">

          <button
            className={tab==="login"?"active":""}
            onClick={()=>setTab("login")}
          >
            Login
          </button>

          <button
            className={tab==="register"?"active":""}
            onClick={()=>setTab("register")}
          >
            Register
          </button>

        </div>

        {tab==="register" && (

          <div className="form">

            <input
            placeholder="Name"
            onChange={(e)=>setName(e.target.value)}
            />

            <input
            placeholder="Email"
            onChange={(e)=>setEmail(e.target.value)}
            />

            <input
            type="password"
            placeholder="Password"
            onChange={(e)=>setPassword(e.target.value)}
            />

            <button onClick={register}>
              Create Account
            </button>

          </div>

        )}

        {tab==="login" && (

          <div className="form">

            <input
            placeholder="Email"
            onChange={(e)=>setEmail(e.target.value)}
            />

            <input
            type="password"
            placeholder="Password"
            onChange={(e)=>setPassword(e.target.value)}
            />

            <button onClick={login}>
              Login
            </button>

          </div>

        )}

      </div>

    </div>

  );
}

export default AuthTabs;