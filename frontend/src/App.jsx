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
  const [rating, setRating] = useState(5);

  const [feedbacks, setFeedbacks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchFeedbacks = async () => {
    const res = await API.get("/feedback");
    setFeedbacks(res.data || []);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const resetForm = () => {
    setMessage("");
    setRating(5);
    setEditingId(null);
  };

  const submit = async () => {
    if (!userName.trim()) return alert("Please enter your name");
    if (role === "user" && !message.trim()) return alert("Please write feedback");
    if (role === "admin") return alert("Admin cannot create feedback");

    const payload = { user_name: userName.trim(), message: message.trim(), rating: Number(rating) };

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
  };

  const cancelEdit = () => resetForm();

  const deleteAsUser = async (fbId) => {
    if (!userName.trim()) return alert("Enter your name first");
    await API.delete(`/feedback/${fbId}?role=user&user_name=${encodeURIComponent(userName.trim())}`);
    fetchFeedbacks();
  };

  const deleteAsAdmin = async (fbId) => {
    await API.delete(`/feedback/${fbId}?role=admin`);
    fetchFeedbacks();
  };

  const canUserEdit = (fb) => role === "user" && fb.user_name === userName.trim();
  const canAdminDelete = (fb) => role === "admin" && fb.offensive;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Ransara Supermarket Feedback Management System</h1>
          <p className="sub">Customer can add / update / delete own feedback. Admin can delete only offensive feedback.</p>
        </div>

        <div className="roleBox">
          <label color = "" className="label">Role</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); resetForm(); }}>
            <option value="user">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

      <section className="card formCard">
        <h2>{role === "admin" ? "Admin View" : (editingId ? "Update your feedback" : "Add a feedback")}</h2>

        <div className="grid2">
          <div>
            <label className="label">Your Name</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Name"
            />
            <p className="hint">Use the same name to edit/delete your own feedback.</p>
          </div>

          <br/>

          <div>
            <label className="label">Rating (1 - 5)</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)} disabled={role === "admin"}>
              <option value={1}>1 ⭐</option>
              <option value={2}>2 ⭐⭐</option>
              <option value={3}>3 ⭐⭐⭐</option>
              <option value={4}>4 ⭐⭐⭐⭐</option>
              <option value={5}>5 ⭐⭐⭐⭐⭐</option>
            </select>
          </div>
        </div>

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
            {editingId && <button className="ghost" onClick={cancelEdit}>Cancel</button>}
          </div>
        )}
      </section>

      <section className="listHeader">
        <h2>All feedbacks</h2>
        <button className="ghost" onClick={fetchFeedbacks}>Refresh</button>
      </section>

      <section className="list">
        {feedbacks.length === 0 && <div className="empty">No feedback yet</div>}

        {feedbacks.map((fb) => {
          const blurForUser = role === "user" && fb.offensive;

          return (
            <div key={fb.id} className={`card feedbackCard ${fb.offensive ? "isOffensive" : ""}`}>
              <div className="row">
                <div>
                  <h3>{fb.user_name}</h3>
                  <div className="meta">Rating: {fb.rating} / 5</div>
                </div>

                {fb.offensive && <span className="badge">Offensive</span>}
              </div>

              <p className={`msg ${blurForUser ? "blur" : ""}`}>
                {fb.message}
              </p>

              {blurForUser && (
                <p className="hint">
                  This message is blurred because AI detected offensive content.
                </p>
              )}

              {fb.reply && (
                <div className="reply">
                  <div className="replyTitle">Admin Reply</div>
                  <div>{fb.reply}</div>
                </div>
              )}

              <div className="actions">
                {canUserEdit(fb) && (
                  <>
                    <button className="small" onClick={() => startEdit(fb)}>Edit</button>
                    <button className="small danger" onClick={() => deleteAsUser(fb.id)}>Delete</button>
                  </>
                )}

                {canAdminDelete(fb) && (
                  <button className="small danger" onClick={() => deleteAsAdmin(fb.id)}>
                    Delete (Admin)
                  </button>
                )}

                {role === "admin" && !fb.offensive && (
                  <span className="hint">Admin can delete only offensive feedback.</span>
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
