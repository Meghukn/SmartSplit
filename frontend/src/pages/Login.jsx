import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Login(){

 const navigate = useNavigate();

 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [error,setError] = useState("");
const [showPassword,setShowPassword] = useState(false);

 const login = async(e)=>{
  e.preventDefault();

  setError("");

  if(!email || !password){
  setError("Please fill all fields");
  return;
 }

  try{

   const res = await API.post("/auth/login",{email, password});

   localStorage.setItem("token",res.data.token);
   localStorage.setItem("username",res.data.user.name);
   localStorage.setItem("userId", res.data.user.id);

   navigate("/dashboard");

  }catch(err){
  setError(err.response?.data?.message || "Login failed");
  }

 };

 return(

  <div className="auth-page">

   <div className="auth-container">

    {/* App Header */}

<div className="brand">

  <img
    src="/logo.png"
    alt="SmartSplit Logo"
    className="logo-img"
  />

  <div className="brand-text">
    <h1 className="app-title">SmartSplit</h1>
    <p className="tagline">Split expenses smarter</p>
  </div>

</div>

    {/* Login Card */}

    <div className="auth-card">

     <h2>Welcome Back</h2>
<p className="sub-text">Sign in to access your dashboard</p>

     <form onSubmit={login}>

      <input
       type="email"
       placeholder="Email"
       value={email}
       onChange={(e)=>setEmail(e.target.value)}
      />

      <div className="password-field">

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <i
          className={
            showPassword
              ? "fi fi-sr-eye eye-icon"
              : "fi fi-sr-eye-crossed eye-icon"
          }
          onClick={() => setShowPassword(!showPassword)}
        ></i>

</div>

      <button type="submit">
       Login
      </button>

      {error && <p className="error">{error}</p>}

     </form>

     <p
      className="auth-link"
      onClick={()=>navigate("/register")}
     >
      New user? Register
     </p>

    </div>

   </div>

  </div>

 );

}
export default Login;