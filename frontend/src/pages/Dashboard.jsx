import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import API from "../services/api";

function Dashboard() {

  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [groups,setGroups] = useState([]);
  const [showModal,setShowModal] = useState(false);
  const [groupName,setGroupName] = useState("");
  const [loading,setLoading] = useState(false);
  const [deleteGroupId,setDeleteGroupId] = useState(null);
  const [deleteGroupName,setDeleteGroupName] = useState("");
  const [error,setError] = useState("");
  const [deleteError,setDeleteError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const logout = ()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const fetchGroups = async()=>{
  try{

    const res = await API.get("/groups/my-groups");
    setGroups(res.data);

    }catch{
      console.log("Error loading groups");
    }
  };

  useEffect(()=>{
    fetchGroups();
  },[]);

  // DELETE GROUP
  const deleteGroup = async()=>{
    try{
      await API.delete(`/groups/delete/${deleteGroupId}`);
      setDeleteGroupId(null);
      fetchGroups();
    }catch(err){
      setDeleteError(err.response?.data?.message || "Delete failed");
    }
  };


// CREATE GROUP
  const createGroup = async()=>{
    setError("");

    if(!groupName.trim()){
      setError("Group name is required");
      return;
    }

    try{
      setLoading(true);

      const res = await API.post("/groups/create-group",{ groupName });

      setShowModal(false);
      setGroupName("");

      fetchGroups();
      navigate(`/group/${res.data._id}`);

    }catch(err){
      setError(err.response?.data?.message || "Error creating group");
    }

    setLoading(false);
  };

  const joinGroup = async () => {
    setJoinError("");

    if (!joinCode.trim()) {
      setJoinError("Enter join code");
      return;
    }

    try {
      setJoinLoading(true);

      await API.post("/groups/join-code", {
        code: joinCode
      });

      setJoinCode("");
      fetchGroups();

    } catch (err) {
      setJoinError(
        err.response?.data?.message || "Unable to join group"
      );
    }

    setJoinLoading(false);
  };

  return(

    <div className="dashboard-container">

    {/* HEADER */}
    <div className="dashboard-header">

      <div className="brand-top">
        <img src="/logo.png" alt="logo" className="logo-img" />
        <h1 className="logo">SmartSplit</h1>
      </div>

      <div className="header-right">

      <div className="user-box">
        <span className="avatar">
          {username?.charAt(0).toUpperCase()}
        </span>
        <span>{username}</span>
      </div>

      <button className="logout-btn" onClick={logout}>
        <i className="fa fa-sign-out"></i>
      </button>

      </div>

    </div>

    {/* GROUP HEADER */}
    <div className="groups-header">

      <div className="join-box">
        <input
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />

        <button onClick={joinGroup}>
          {joinLoading ? "Joining..." : "Join"}
        </button>

        {joinError && (
          <p className="error">{joinError}</p>
        )}
      </div>

      <div>
        <h2>Your Groups</h2>
        <p className="sub-text">
          Manage your shared expenses
        </p>
      </div>

      <button
        className="create-btn"
        onClick={()=>{
          setShowModal(true);
          setError("");
        }}>
        + New Group
      </button>

    </div>

    {/* GROUP LIST */}
    <div className="groups-box">

      {groups.length === 0 ?(
        <p className="no-groups">No groups yet</p>
      ):(
        groups.map((group)=>(
        <div
          key={group._id}
          className="group-card"
          onClick={()=>navigate(`/group/${group._id}`)}
        >
        <p className="created-by">
          Created by {group.createdBy?.name || "Unknown"}
        </p>

        {group.createdBy?._id === JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id && (
        <div
          className="delete-icon"
          onClick={(e)=>{
          e.stopPropagation();
          setDeleteGroupId(group._id);
          setDeleteGroupName(group.groupName);
        }}>
          🗑
        </div>
        )}

        <div className="group-icon-box">👥</div>

        <h3 className="group-name">{group.groupName}</h3>

        <p className="group-amount">
          ₹ {Number(group.totalAmount ?? group.total ?? 0).toLocaleString("en-IN")}
        </p>

        <div className="members-badge">
          {group.members?.length || 0} MEMBERS
        </div>
      </div>
    )))}

    </div>

    {/* DELETE MODAL */}
    {deleteGroupId && (
      <div className="modal-overlay">
        <div className="modal-box">
          <h3>Delete Group</h3>
          <p>Delete <b>{deleteGroupName}</b>?</p>

          <button className="delete-btn" onClick={deleteGroup}>
            Yes, Delete
          </button>

          <button className="close-btn" onClick={()=>setDeleteGroupId(null)}>
            Cancel
          </button>
          {deleteError && <p className="error">{deleteError}</p>}
        </div>
      </div>
    )}

    {/* CREATE GROUP MODAL */}
    {showModal && (
      <div className="modal-overlay">

        <div className="create-modal">

          <h2>Create Group</h2>
          <p>Create groups, add your friends and start splitting</p>

          <input
            placeholder="Group Name"
            value={groupName}
            onChange={(e)=>setGroupName(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <p className="info">
            You will be automatically added
          </p>

          <div className="btn-row">

          <button className="create-btn" onClick={createGroup}>
          {loading ? "Creating..." : "Create"}
          </button>

          <button
          className="close-btn"
            onClick={()=>{
              setShowModal(false);
              setError(""); 
              setGroupName("");   
            }}>
          Cancel
          </button>

        </div>

      </div>

    </div>
    )}

    </div>
  );
}

export default Dashboard;