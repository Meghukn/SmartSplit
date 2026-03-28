import { useState } from "react";
import API from "../services/api"; // ✅ FIX
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Register(){

 const navigate = useNavigate();

 const [name,setName] = useState("");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [error,setError] = useState("");
 const [success,setSuccess] = useState("");
 const [showPassword,setShowPassword] = useState(false);

 const register = async (e)=>{

  e.preventDefault();

  setError("");
  setSuccess("");

  if(!name || !email || !password){
  setError("All fields are required");
  return;
 }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if(!emailRegex.test(email)){
   setError("Invalid email format");
   return;
  }

  if(password.length < 8){
   setError("Password must be at least 8 characters");
   return;
  }

  try{

   await API.post("/auth/register", {name,email,password});

   setSuccess("Registered successfully. Please login.");

   setTimeout(()=>{
   navigate("/");
  },1500);

  }catch(err){

   setError(err.response?.data?.message || "Registration failed");

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

   {/* Register Card */}

   <div className="auth-card">

    <h2>Create Account</h2>
<p className="sub-text">Start managing your expenses</p>

    <form onSubmit={register}>

     <input
      placeholder="Name"
      value={name}
      onChange={(e)=>setName(e.target.value)}
     />

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
      Register
     </button>

    </form>

    {error && <p className="error">{error}</p>}
    {success && <p className="success">{success}</p>}

    <p
     className="auth-link"
     onClick={()=>navigate("/")}
    >
     Already have an account? Login
    </p>

   </div>

  </div>

 </div>

 );

}

export default Register;