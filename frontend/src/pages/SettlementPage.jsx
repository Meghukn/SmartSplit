import { useEffect, useState } from "react";
import API from "../services/api";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/settlement.css";

function SettlementPage() {

 const { groupId } = useParams();
 const navigate = useNavigate();
 const location = useLocation();

 const username = localStorage.getItem("username");

 const logout = () => {
  localStorage.clear();
  navigate("/");
 };

 const [activeTab, setActiveTab] = useState("payments");
 const [settlements, setSettlements] = useState([]);
 const [summary, setSummary] = useState([]);
 const [group, setGroup] = useState(null);

 // ✅ NEW TOGGLE STATE
 const [roundedMode, setRoundedMode] = useState(false);

 useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
   navigate("/");
  } else {
   fetchData();
  }
 }, []);

useEffect(() => {
 if (location.pathname.includes("summary")) {
  setActiveTab("summary");
 } else {
  setActiveTab("payments");
 }
}, [location.pathname]);

 const fetchData = async () => {
  try {

   const res = await API.get(`/expenses/settle/${groupId}`);

   setSettlements(res.data.settlements || []);
   setSummary(res.data.summary || []);

   const groupRes = await API.get(`/groups/${groupId}`);

   setGroup(groupRes.data);

  } catch (err) {
   alert("Error loading settlement");
  }
 };

 const getUser = (id) => {
  return group?.members?.find((m) => m._id === id);
 };

 const formatINR = (value) => {
  return Number(value).toLocaleString("en-IN", {
   minimumFractionDigits: 2,
   maximumFractionDigits: 2
  });
 };

 const downloadPDF = () => {

  if (!group) return;

  const doc = new jsPDF();

  const today = new Date();
  const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  doc.setFontSize(18);
  doc.text("SmartSplit - Settlement Report", 14, 20);

  doc.setFontSize(11);
  doc.text(`Group: ${group.groupName}`, 14, 30);
  doc.text(`Members: ${group.members.length}`, 14, 37);
  doc.text(`Date: ${formattedDate}`, 14, 44);

  const summaryData = summary.map((s) => {
   const user = getUser(s.user);

   return [
    user?.name,
    user?.email,
    `INR ${formatINR(s.paid)}`,
    `INR ${formatINR(s.shouldPay)}`,
    s.balance > 0
     ? `+INR ${formatINR(s.balance)}`
     : `-INR ${formatINR(Math.abs(s.balance))}`
   ];
  });

  autoTable(doc, {
   startY: 52,
   head: [["Name", "Email", "Paid", "Share", "Balance"]],
   body: summaryData
  });

  const settlementData = settlements.map((s) => {
   const from = getUser(s.from);
   const to = getUser(s.to);

   return [
    from?.name,
    to?.name,
    `INR ${formatINR(s.amount)}`
   ];
  });

  autoTable(doc, {
   startY: doc.lastAutoTable.finalY + 10,
   head: [["From", "To", "Amount"]],
   body: settlementData
  });

  doc.save(`${group.groupName}_Settlement.pdf`);
 };

const generateShareText = () => {
 if (!settlements.length) return "All settled 🎉";

 const lines = settlements.map((s) => {
  const from = getUser(s.from);
  const to = getUser(s.to);

  const amount = roundedMode
   ? Math.round(Number(s.amount))
   : Number(s.amount).toFixed(2);

  return `${from?.name} → ${to?.name} (₹${amount})`;
 });

 const baseUrl = window.location.origin; // works in localhost + production

 const link = `${baseUrl}/group/${groupId}/summary`;

 return `${lines.join("\n")}

Details:
${link}`;
};

// COPY
const handleCopy = async () => {
 try {
  const text = generateShareText();
  await navigator.clipboard.writeText(text);
  alert("Settlement copied!");
 } catch (err) {
  alert("Failed to copy");
 }
};

// WHATSAPP SHARE
const handleWhatsAppShare = () => {
 const text = generateShareText();
 const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
 window.open(url, "_blank");
};

 return (

  <div className="settlement-container">

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

   {/* PAGE HEADER */}
   <div className="settlement-head">

    <p className="back-link" onClick={() => navigate(`/group/${groupId}`)}>
     ← Back to Group
    </p>

    <div className="settlement-title-row">

     <div className="title-left">
      <div className="group-icon">✔</div>
      <h2>Settlement Center</h2>
     </div>

     <div className="tabs">

      <button
       className={activeTab === "payments" ? "active-tab" : ""}
       onClick={() => setActiveTab("payments")}
      >
       Payments
      </button>

      <button
       className={activeTab === "summary" ? "active-tab" : ""}
       onClick={() => setActiveTab("summary")}
      >
       Summary
      </button>



     </div>
     </div>
     <div className="toggle-row">

  <span className="toggle-label-text">
    Round Off Mode
  </span>

  <i
    className={`fi ${roundedMode ? "fi-sr-toggle-on" : "fi-sr-toggle-off"} toggle-icon`}
    onClick={() => setRoundedMode(!roundedMode)}
  ></i>

</div>

    

   </div>

   {/* MAIN */}
   <div className="settlement-layout">

    {/* LEFT */}
    <div className="settlement-left">

     {/* PAYMENTS */}
     {activeTab === "payments" &&
      (settlements.length === 0 ? (
       <p>All settled 🎉</p>
      ) : (
       settlements.map((s, i) => {

        const from = getUser(s.from);
        const to = getUser(s.to);

        const amount = Number(s.amount);
        const rounded = Math.round(amount);

        const displayAmount = roundedMode ? rounded : amount;
        

        return (
         <div key={i} className="settle-card">

          <div className="settle-user">
           <div className="avatar">
            {from?.name?.charAt(0)}
           </div>
           <span>{from?.name}</span>
          </div>

          <div className="settle-center">
           <span className={`amount-top ${roundedMode ? "green-text" : ""}`}>
            ₹{roundedMode
              ? rounded.toLocaleString("en-IN")
              : formatINR(amount)}
           </span>
           <div className="arrow-line"></div>
          </div>

          <div className="settle-user">
           <span>{to?.name}</span>
           <div className="avatar green">
            {to?.name?.charAt(0)}
           </div>
          </div>

         </div>
        );
       })
      ))}

     {/* SUMMARY */}
     {activeTab === "summary" &&
      summary.map((s, i) => {

       const user = getUser(s.user);

       const bal = Number(s.balance);
       const rounded = Math.round(bal);

       const displayBal = roundedMode ? rounded : bal;
       return (
        <div key={i} className="summary-card">

         <div className="avatar green">
          {user?.name?.charAt(0) || "?"}
         </div>

         <div className="summary-info">
          <h4>{user?.name}</h4>
          <p>{user?.email}</p>
         </div>

         <div className="summary-stats">
          <span>Paid ₹{formatINR(s.paid)}</span>
          <span>Share ₹{formatINR(s.shouldPay)}</span>

          <span className={`${displayBal > 0 ? "green-text" : "red-text"} ${roundedMode ? "bold" : ""}`}>
  {displayBal > 0
    ? `+₹${roundedMode
        ? rounded.toLocaleString("en-IN")
        : formatINR(bal)}`
    : `-₹${roundedMode
        ? Math.abs(rounded).toLocaleString("en-IN")
        : formatINR(Math.abs(bal))}`}
</span>
         </div>

        </div>
       );
      })}

    </div>

    {/* RIGHT */}
    <div className="settlement-right">

     <div className="info-box">
      <h4>How it works</h4>
      <ul>
       <li>Calculates balances</li>
       <li>Matches debtors & creditors</li>
       <li>Minimizes transactions</li>
      </ul>
     </div>

     <div className="summary-box">
      <h4>Group Summary</h4>
 <p>Total Members: {group?.members?.length || 0}</p>

 <button className="primary-btn download-btn" onClick={downloadPDF}>
  Download PDF
 </button>

 {/* ✅ NEW SHARE BUTTONS */}
 <button className="primary-btn download-btn" onClick={handleCopy}>
  Copy to Share
 </button>

 <button className="secondary-btn download-btn" onClick={handleWhatsAppShare}>
  Share via WhatsApp
 </button>
</div>

    </div>

   </div>

  </div>
 );
}

export default SettlementPage;