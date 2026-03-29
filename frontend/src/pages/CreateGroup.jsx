import { useState } from "react";
import API from "../services/api"; // ✅ FIX
import { useNavigate } from "react-router-dom";
import "../styles/creategroup.css";

function CreateGroup(){

 const [groupName,setGroupName] = useState("");
 const [email,setEmail] = useState("");
 const [members,setMembers] = useState([]);
 const [loading,setLoading] = useState(false);

 const navigate = useNavigate();

 // ADD MEMBER
 const addMember = ()=>{
  if(!email.trim()){
   alert("Enter email");
   return;
  }

  // ✅ Prevent duplicates
  setMembers([...new Set([...members,email])]);
  setEmail("");
 };

 // REMOVE MEMBER
 const removeMember = (index)=>{
  setMembers(members.filter((_,i)=>i!==index));
 };

 // CREATE GROUP
 const createGroup = async(e)=>{
  e.preventDefault();

  if(!groupName.trim()){
   alert("Enter group name");
   return;
  }

  try{
   setLoading(true);

   const res = await API.post(
    "/groups/create-group",
    { groupName, members }
   );

   navigate(`/group/${res.data._id}`);

  }catch(err){
   alert(err.response?.data?.message || "Error creating group");
  } finally {
   setLoading(false);
  }
 };

 return(

 <div className="create-container">

  {/* HEADER */}
  <div className="create-header">
   <img src="/logo.png" alt="logo" className="logo-img"/>
   <h1>SmartSplit</h1>
  </div>

  {/* CARD */}
  <div className="create-card">

   <h2>Create Group</h2>
   <p className="subtitle">Add your friends and start splitting</p>

   <form onSubmit={createGroup}>

    {/* GROUP NAME */}
    <label>Group Name</label>
    <input
     placeholder="e.g. Goa Trip"
     value={groupName}
     onChange={(e)=>setGroupName(e.target.value)}
    />

    {/* ADD MEMBERS */}
    <label>Add Members</label>

    <div className="member-input">
     <input
      type="email"
      placeholder="Enter email"
      value={email}
      onChange={(e)=>setEmail(e.target.value)}
      onKeyDown={(e)=>{
       if(e.key === "Enter"){
        e.preventDefault();
        addMember();
       }
      }}
     />

     <button type="button" onClick={addMember}>
      ✔
     </button>
    </div>

    {/* MEMBER LIST */}
    <div className="member-list">
     {members.map((m,i)=>(
      <div key={i} className="chip">
       {m}
       <span onClick={()=>removeMember(i)}>×</span>
      </div>
     ))}
    </div>

    {/* INFO */}
    <p className="info">
     You will be automatically added to the group
    </p>

    {/* BUTTONS */}
    <div className="btn-row">

     <button className="create-btn" type="submit">
      {loading ? "Creating..." : "Create Group"}
     </button>

     <button
      type="button"
      className="cancel-btn"
      onClick={()=>navigate(-1)}
     >
      Cancel
     </button>

    </div>

   </form>

  </div>

 </div>

 );
}

export default CreateGroup;