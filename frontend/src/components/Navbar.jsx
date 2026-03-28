import { Link, useNavigate } from "react-router-dom";

function Navbar() {

  const navigate = useNavigate();

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");

  };

  const username = localStorage.getItem("username");

  return (

    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      background: "#eee"
    }}>

      <h3>SmartSplit</h3>

      <div>

        <span style={{marginRight:"15px"}}>
          Hello {username}
        </span>

        <Link to="/dashboard" style={{marginRight:"15px"}}>
          Dashboard
        </Link>

        <button onClick={logout}>
          Logout
        </button>

      </div>

    </div>

  );

}

export default Navbar;