import { useState, useEffect } from "react";
import "./FeedbackForm.css";

export default function FeedbackForm() {
  // -----------------------------
  // Simulate logged-in user
  // Change these to test: "user" or "admin"
  const currentUser = "Ayesh";  
  const currentRole = "user";   // "admin" or "user"
  // -----------------------------

  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [editId, setEditId] = useState(null);
  const [adminReply, setAdminReply] = useState("");

  // Fetch all feedbacks
  const fetchFeedbacks = async () => {
    const res = await fetch("http://localhost:8000/feedback/");
    const data = await res.json();
    setFeedbacks(data);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Submit or update feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) return;

    if (editId) {
      // Update feedback (only owner)
      await fetch(`http://localhost:8000/feedback/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: currentUser, message, rating }),
      });
      setEditId(null);
    } else {
      // Create new feedback
      await fetch("http://localhost:8000/feedback/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: currentUser, message, rating }),
      });
    }

    setMessage("");
    setRating(5);
    fetchFeedbacks();
  };

  // Delete feedback
  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/feedback/${id}?user_name=${currentUser}&role=${currentRole}`, {
      method: "DELETE",
    });
    fetchFeedbacks();
  };

  // Admin reply
  const handleReply = async (id) => {
    if (!adminReply) return;

    await fetch(`http://localhost:8000/feedback/reply/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: adminReply, role: currentRole }),
    });

    setAdminReply("");
    fetchFeedbacks();
  };

  return (
    <div className="feedback-container">
      <h2>Leave Your Feedback</h2>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Your Feedback"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <label>
          Rating:
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ⭐
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{editId ? "Update Feedback" : "Submit Feedback"}</button>
      </form>

      <h2>All Feedbacks</h2>
      <div className="feedback-list">
        {feedbacks.map((f) => (
          <div className="feedback-card" key={f.id}>
            <div className="feedback-header">
              <strong>{f.user_name}</strong> - <span>{f.rating}⭐</span>

              {/* Customer can edit/delete only their own feedback */}
              {f.user_name === currentUser && currentRole === "user" && (
                <span className="feedback-actions">
                  <button onClick={() => { setEditId(f.id); setMessage(f.message); setRating(f.rating); }}>Edit</button>
                  <button onClick={() => handleDelete(f.id)}>Delete</button>
                </span>
              )}

              {/* Admin can delete any feedback */}
              {currentRole === "admin" && f.user_name !== currentUser && (
                <button onClick={() => handleDelete(f.id)}>Delete Offensive</button>
              )}
            </div>

            <p>{f.message}</p>

            {/* Admin reply */}
            {f.reply ? (
              <p className="admin-reply">Admin Reply: {f.reply}</p>
            ) : (
              currentRole === "admin" && (
                <div className="admin-reply-form">
                  <input
                    type="text"
                    placeholder="Reply as admin"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                  />
                  <button onClick={() => handleReply(f.id)}>Reply</button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}