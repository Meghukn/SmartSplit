import { useState, useEffect } from "react";
import API from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/group.css";

function GroupPage() {

 const { groupId } = useParams();
 const navigate = useNavigate();

 const [group, setGroup] = useState(null);
 const [email, setEmail] = useState("");
 const [expenses, setExpenses] = useState([]);

 const [selectedExpense, setSelectedExpense] = useState(null);

 const [showExpenseModal, setShowExpenseModal] = useState(false);
 const [description, setDescription] = useState("");
 const [amount, setAmount] = useState("");
 const [paidBy, setPaidBy] = useState("");
 const [splitBetween, setSplitBetween] = useState([]);

 const [isEdit, setIsEdit] = useState(false);
 const [deleteId, setDeleteId] = useState(null);

 const [modalError, setModalError] = useState("");
 const [memberError, setMemberError] = useState("");
 const [viewExpense, setViewExpense] = useState(null);

 // 🔐 Protect page
 useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
   navigate("/");
  } else {
   fetchGroup();
   fetchExpenses();
  }
 }, []);

 // FETCH GROUP
 const fetchGroup = async () => {
  try {
   const res = await API.get(`/groups/${groupId}`);
   setGroup(res.data);
  } catch (err) {
   alert("Error loading group");
  }
 };

 // FETCH EXPENSES
 const fetchExpenses = async () => {
  try {
   const res = await API.get(`/expenses/group/${groupId}`);
   setExpenses(res.data);
  } catch (err) {
   alert("Error loading expenses");
  }
 };

 // ADD MEMBER
 const addMember = async () => {
  if (!email.trim()) {
   setMemberError("Enter email");
   return;
  }

  try {
   await API.post("/groups/add-member", { groupId, email });

   setEmail("");
   setMemberError(""); // ✅ CLEAR ERROR
   fetchGroup();
  } catch (err) {
   setMemberError(err.response?.data?.message || "User not registered");
  }
 };

 // ADD / EDIT EXPENSE
 const addExpense = async () => {
  if (!description.trim() || !amount || (!isEdit && (!paidBy || splitBetween.length === 0))) {
   setModalError("Fill all fields");
   return;
  }

  try {

   if (isEdit) {
    await API.put(`/expenses/${selectedExpense._id}`, {
      description,
      amount: Number(amount),
      paidBy,
      splitBetween
    });
   } else {
    await API.post("/expenses/add-expense", {
     description,
     amount: Number(amount),
     paidBy,
     splitBetween,
     groupId
    });
   }

   setShowExpenseModal(false);
   setIsEdit(false);
   setModalError(""); // ✅ CLEAR ERROR
   setDescription("");
   setAmount("");
   setPaidBy("");
   setSplitBetween([]);
   setSelectedExpense(null);

   fetchExpenses();

  } catch (err) {
   alert(err.response?.data?.message || "Error saving expense");
  }
 };

 // DELETE
 const handleDelete = async (id) => {
  try {
   await API.delete(`/expenses/${id}`);
   fetchExpenses();
  } catch {
   alert("Error deleting expense"); // ✅ FIXED
  }
 };

 // EDIT
 const handleEdit = (exp) => {
  setIsEdit(true);
  setSelectedExpense(exp);

  setDescription(exp.description);
  setAmount(exp.amount);
  setPaidBy(exp.paidBy._id);
  setSplitBetween(exp.splitBetween.map(m => m._id));

  setModalError(""); // ✅ RESET ERROR
  setShowExpenseModal(true);
 };

 const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

 if (!group) return <p>Loading...</p>;

 return (
  <div className="group-container">

   {/* HEADER */}
   <div className="main-header">
    <div className="brand-top">
     <img src="/logo.png" className="logo-img" />
     <h1 className="logo">SmartSplit</h1>
    </div>

    <div className="header-right">
     <div className="user-box">
      <span className="avatar">
       {localStorage.getItem("username")?.charAt(0).toUpperCase()}
      </span>
      <span>{localStorage.getItem("username")}</span>
     </div>

     <button className="logout-btn" onClick={() => {
      localStorage.clear();
      navigate("/");
     }}>
      <i className="fa fa-sign-out"></i>
     </button>
    </div>
   </div>

   {/* TITLE */}
   <div className="group-head">

    <p className="back-link" onClick={() => navigate("/dashboard")}>
     ← Back to Dashboard
    </p>

    <div className="group-title-row">

     <div className="title-left">
      <div className="group-icon">👥</div>
      <h2>{group.groupName}</h2>
     </div>

     <div className="title-actions">
      <button
       className="secondary-btn small-btn"
       onClick={() => navigate(`/settlement/${groupId}`)}
      >
       Settlement
      </button>

      <button
       className="primary-btn small-btn"
       onClick={() => {
        setIsEdit(false);
        setModalError(""); // ✅ IMPORTANT
        setShowExpenseModal(true);
       }}
      >
       + Add Expense
      </button>
     </div>

    </div>

   </div>

   {/* MAIN */}
   <div className="group-layout">

    {/* EXPENSES */}
    <div className="expenses-section">

     <div className="expense-header">
      <h3>Expenses</h3>
      <span className="total-text">TOTAL: ₹{Number(totalAmount).toLocaleString("en-IN")}</span>
     </div>

     {expenses.map(exp => (
      <div
       key={exp._id}
       className="expense-card"
       onClick={() => setViewExpense(exp)}
      >

       <div className="expense-left">
        <h4>{exp.description}</h4>
        <p>
         Paid by {exp.paidBy?.name || "Unknown"} • {exp.splitBetween.length} people
        </p>
       </div>

       <div className="expense-right">

        <div className="amount">
         ₹{Number(exp.amount).toLocaleString("en-IN")}
        </div>

        <div className="date">
         📅 {new Date(exp.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short"
         })}
        </div>

        <div className="expense-actions-hover">

         <button
          className="edit-btn"
          onClick={(e)=>{
           e.stopPropagation();
           handleEdit(exp);
          }}
         >
          <i className="fi fi-sr-pencil"></i>
         </button>

         <button
          className="delete-btn"
          onClick={(e)=>{
           e.stopPropagation();
           setDeleteId(exp._id);
          }}
         >
          <i className="fi fi-sr-trash"></i>
         </button>

        </div>

       </div>

      </div>
     ))}

    </div>

    {/* MEMBERS */}
    <div className="members-section">

     <h3>Members</h3>

     <div className="members-list">
      {group.members.map(m => (
       <div key={m._id} className="member-card">

        <div className="member-avatar">
         {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>

        <div>
         <p className="member-name">{m.name}</p>
         <span className="member-email">{m.email}</span>
        </div>

       </div>
      ))}
     </div>

     <div className="add-member-box">
      <div className="input-error-group">
      <input
       value={email}
       onChange={(e) => {
        setEmail(e.target.value);
        setMemberError("");
       }}
       placeholder="Enter email"
      />

      {memberError && (
        <p className="error-text">{memberError}</p>
      )}
      </div>

      <button onClick={addMember}>+</button>
     </div>

    </div>

   </div>

   {/* DELETE MODAL */}
   {deleteId && (
    <div className="modal-overlay">
     <div className="modal-box">

      <h3>Delete Expense</h3>
      <p>Are you sure you want to delete this expense?</p>

      <button
       className="delete-btn"
       onClick={async () => {
        try {
         await API.delete(`/expenses/${deleteId}`);
         setDeleteId(null);
         fetchExpenses();
        } catch {
         alert("Error deleting expense");
        }
       }}
      >
       Yes, Delete
      </button>

      <button
       className="secondary-btn"
       onClick={() => setDeleteId(null)}
      >
       Cancel
      </button>

     </div>
    </div>
   )}
   {viewExpense && (
  <div className="modal-overlay">
    <div className="expense-modal">

      <div className="modal-header">
        <h2>{viewExpense.description}</h2>

        <span
          className="close-x"
          onClick={() => setViewExpense(null)}
        >
          ✖
        </span>
      </div>

      <div className="amount-box">
        <p>Total</p>
        <h2>₹{Number(viewExpense.amount).toLocaleString("en-IN")}</h2>

        {/* ✅ FIXED PAID BY */}
        <span>
          Paid by {viewExpense.paidBy?.name || "Unknown"}
        </span>
      </div>

      {viewExpense.splitBetween.map((m, i) => (
        <div key={i} className="split-row">
          <span>{m.name}</span>
          <span>
            ₹{Number(
              viewExpense.amount / viewExpense.splitBetween.length
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
      ))}


    </div>
  </div>
)}

   {showExpenseModal && (
  <div className="modal-overlay">
    <div className="modal-box">

      <h3>{isEdit ? "Edit Expense" : "Add Expense"}</h3>

      <label>Description</label>
      <input
        placeholder="e.g. Dinner"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setModalError("");
        }}
      />

      <label>Amount</label>
      <input
        type="number"
        placeholder="e.g. 1200"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          setModalError("");
        }}
      />

      <label>Paid By</label>
      <select
        value={paidBy}
        onChange={(e) => {
          setPaidBy(e.target.value);
          setModalError("");
        }}
      >
        <option value="">Select member</option>
        {group.members.map(m => (
          <option key={m._id} value={m._id}>{m.name}</option>
        ))}
      </select>

      <label>Split Between</label>

      {group.members.map(m => (
        <label key={m._id} className="checkbox-row">
          <input
            type="checkbox"
            checked={splitBetween.includes(m._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSplitBetween([...new Set([...splitBetween, m._id])]);
              } else {
                setSplitBetween(splitBetween.filter(id => id !== m._id));
              }
              setModalError("");
            }}
          />
          {m.name}
        </label>
      ))}

      {modalError && (
        <p className="error-text">{modalError}</p>
      )}

      <button className="primary-btn" onClick={addExpense}>
        {isEdit ? "Update Expense" : "Add Expense"}
      </button>

      <button
        className="secondary-btn"
        onClick={() => {
          setShowExpenseModal(false);
          setIsEdit(false);
          setModalError("");
          setDescription("");
          setAmount("");
          setPaidBy("");
          setSplitBetween([]);
        }}
      >
        Cancel
      </button>

    </div>
  </div>
)}

  </div>
 );
}

export default GroupPage;