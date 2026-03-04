import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API = useMemo(() => axios.create({ baseURL: API_BASE }), [API_BASE]);

  // role: "user" or "admin"
  const [role, setRole] = useState("user");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  const [productName, setProductName] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");

  const [feedbacks, setFeedbacks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  //  admin reply states
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchFeedbacks = async () => {
    const res = await API.get(`/feedback?product=${encodeURIComponent(filterProduct)}`);
    setFeedbacks(res.data || []);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterProduct]);

  const resetForm = () => {
    setMessage("");
    setRating(5);
    setProductName("");
    setEditingId(null);

    //  close reply box too
    setReplyingId(null);
    setReplyText("");
  };

  const submit = async () => {
    if (!userName.trim()) return alert("Please enter your name");
    if (role === "user" && !message.trim()) return alert("Please write feedback");
    if (role === "admin") return alert("Admin cannot create feedback");
    if (rating === 0) return alert("Please select a rating");

    const payload = {
      user_name: userName.trim(),
      product_name: productName.trim() || "All Products",
      message: message.trim(),
      rating: Number(rating),
    };

    if (editingId) {
      await API.put(`/feedback/${editingId}?role=user`, payload);
    } else {
      await API.post(`/feedback?role=user`, payload);
    }

    resetForm();
    fetchFeedbacks();
  };

  const startEdit = (fb) => {
    setEditingId(fb.id);
    setMessage(fb.message);
    setRating(fb.rating);
    setProductName(fb.product_name || "");

    // close reply box when editing
    setReplyingId(null);
    setReplyText("");
     window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => resetForm();

  const deleteAsUser = async (fbId) => {
    if (!userName.trim()) return alert("Enter your name first");
    await API.delete(
      `/feedback/${fbId}?role=user&user_name=${encodeURIComponent(userName.trim())}`
    );
    fetchFeedbacks();
  };

  const deleteAsAdmin = async (fbId) => {
    await API.delete(`/feedback/${fbId}?role=admin`);
    fetchFeedbacks();
  };

  // Admin reply function
  const replyAsAdmin = async (fbId) => {
    if (role !== "admin") return;
    if (!replyText.trim()) return alert("Please type a reply");

    await API.put(`/feedback/${fbId}/reply?role=admin`, {
      reply: replyText.trim(),
    });

    setReplyingId(null);
    setReplyText("");
    fetchFeedbacks();
  };

  const canUserEdit = (fb) => role === "user" && (fb.user_name || "").trim().toLowerCase() === userName.trim().toLowerCase();
  const canAdminDelete = (fb) => role === "admin" && fb.offensive;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Ransara Supermarket Feedback Management System</h1>
        </div>

        <div className="roleBox">
          <label className="label">Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              resetForm();
            }}
          >
            <option value="user">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

          {role !== "admin" && (
          <section className="card formCard">
        <h2>
          {role === "admin"
            ? "Admin View"
            : editingId
            ? "Update your feedback"
            : "Please Give Your Valuable Feedback"}
        </h2>

        <div className="grid2">
          <div>
            <label className="label">Your Name</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Name"
            />
            <p className="hint">Use the same name to edit/delete feedback.</p>
          </div>
                <br />
          <div>
            <label className="label">Product ID</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="ex: 101 / 102 / 103"
              disabled={role === "admin"}
            />
            <p className="hint">Write the product ID you are giving feedback about.</p>
          </div>
              
            <br /><br /><br />
            <br />
          
          {/* Star Rating */}
          <div>
            <label className="label">Rating (1 - 5)</label>
            <div className="ratingStars">
              {[1,2,3,4,5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    cursor: "pointer",
                    fontSize: "24px",
                    color: star <= rating ? "gold" : "lightgray",
                    marginRight: "5px"
             }}  >  ★ </span>
            ))}
          </div>
          </div>
        </div>
<br />
        <label className="label">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your feedback..."
          disabled={role === "admin"}
        />

        {role === "user" && (
          <div className="btnRow">
            <button onClick={submit}>{editingId ? "Update" : "Submit"}</button>
            {editingId && (
              <button className="ghost" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        )}
    </section>
          )}

      <div className="roleBox">
        <label className="label">Filter Product</label>
        <input value={filterProduct === "all" ? "" : filterProduct} onChange={(e) => {
            const val = e.target.value;
            setFilterProduct(val.trim() === "" ? "all" : val);
          }}
          placeholder="Type product name or leave empty (All)"
        />
      </div>

      <section className="listHeader">
        <h2>All feedbacks</h2>
        <button className="ghost" onClick={fetchFeedbacks}>Refresh</button></section>

      <section className="list">
        {feedbacks.length === 0 && <div className="empty">No feedback yet</div>}

        {feedbacks.map((fb) => {
          const blurForUser = role === "user" && fb.offensive;

          return (
            <div
              key={fb.id}
              className={`card feedbackCard ${fb.offensive ? "isOffensive" : ""}`} >
              <div className="row">
                <div>
                  <h3>{fb.user_name}</h3>
                  <div className="meta">Product: {fb.product_name}</div>
                  <div className="meta">
                    {new Date(fb.created_at).toLocaleString()}
                  </div>
                  <div className="stars">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <span key={star} 
                     className={star <= Number(fb.rating) ? "star filled" : "star"}
                     >
                       ★ 
                     </span> ))}
                  </div>
                </div>

                {fb.offensive && <span className="badge">Offensive Messages</span>}
              </div>

              <p className={`msg ${blurForUser ? "blur" : ""}`}>{fb.message}</p>

              {blurForUser && (
                <p className="hint">This message is an offensive content.</p>
              )}

              {fb.reply && (
                <div className="reply">
                 <div className="replyTitle">reply message</div>
                  <div>{fb.reply}</div>

                   {/* ✅ Reply Date & Time */}
             {fb.replied_at && (
               <div className="meta" style={{ marginTop: "4px" }}>
                 Replied at: {new Date(fb.replied_at).toLocaleString()}
               </div>
            )}
                  {role === "admin" && (
                    <button className="small danger" style={{ marginTop: "8px" }} onClick={async () => {
                        await API.put(`/feedback/${fb.id}/reply?role=admin`, {
                          reply: "" }); fetchFeedbacks(); }} >Delete Reply</button>
                  )}
             </div>
          )}
              <div className="actions">
                {/* Customer actions */}
                {canUserEdit(fb) && (
                  <>
                    <button type="button" className="small" onClick={() => startEdit(fb)}>Edit</button>
                    <button type="button" className="small danger" onClick={() => deleteAsUser(fb.id)}>Delete</button>
                  </>
                )}

                {/* Admin delete only offensive */}
                {canAdminDelete(fb) && (
                  <button className="small danger" onClick={() => deleteAsAdmin(fb.id)}>Delete</button> 
                )}

                {role === "admin" && !fb.offensive && (
                  <span className="hint"> </span>
                )}

                {/* Admin Reply Feature */}
                {role === "admin" && (
                  <div className="adminReplyBox">
                    {replyingId === fb.id ? (
                      <>
                        <textarea
                          className="replyInput"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write admin reply..."
                        />
                        <div className="btnRow">
                          <button className="small" onClick={() => replyAsAdmin(fb.id)}>Send Reply</button>
                          <button className="small ghost" onClick={() => {setReplyingId(null); setReplyText("");}}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <button className="small" onClick={() => {setReplyingId(fb.id); setReplyText(fb.reply || "");}}>Reply</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="footer">
        Backend: {API_BASE} • Tip: run using docker compose
      </footer>
    </div>
  );
}