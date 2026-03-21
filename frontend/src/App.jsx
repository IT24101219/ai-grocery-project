import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {ShoppingCart,LayoutDashboard,Users,Package,Truck,MessageSquare,Bot,BarChart2,
  Settings,Search,Bell,Send,Filter,ChevronDown,Check,
  ShieldAlert,ThumbsUp,ThumbsDown,CornerUpLeft,Edit2,
  Trash2 } from "lucide-react";
import "./App.css";

export default function App() {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API = useMemo(() => axios.create({ baseURL: API_BASE }), [API_BASE]);

  // role: "user" or "admin"
  const [role, setRole] = useState("admin");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(null);

  const [productName, setProductName] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");

  const [feedbacks, setFeedbacks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // admin reply states
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [activeTab, setActiveTab] = useState("All Feedback");
  const [sentimentFilter, setSentimentFilter] = useState("All Sentiments");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchFeedbacks = async () => {
    try {
      const res = await API.get(`/feedback?product=${encodeURIComponent(filterProduct === "all" ? "" : filterProduct)}`);
      setFeedbacks(res.data || []);
    } catch (e) {
      console.error(e);
      // Fallback
      if (feedbacks.length === 0) {
        setFeedbacks([
          { id: 1, product_name: "Organic Tomatoes", product_id: "P001", user_name: "John Doe", message: "Great quality! Fresh and delicious.", rating: 5, offensive: false, created_at: "2026-03-04T10:00:00Z" },
          { id: 2, product_name: "Fresh Apples", product_id: "P002", user_name: "Jane Smith", message: "Very disappointed. The apples were bruised.", rating: 2, offensive: false, created_at: "2026-03-03T10:00:00Z" },
          { id: 3, product_name: "Whole Milk", product_id: "P003", user_name: "Mike Johnson", message: "This is a terrible product and I hate it.", rating: 1, offensive: true, created_at: "2026-03-02T10:00:00Z" },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterProduct]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setMessage("");
    setRating(0);
    setProductName("");
    setEditingId(null);
    setReplyingId(null);
    setReplyText("");
  };

  const submit = async () => {
    if (!userName.trim()) return alert("Please enter your name");
    if (role === "admin") return alert("Admin cannot create feedback");
    if (!message.trim()) return alert("Please write feedback");
    if (rating === 0) return alert("Please select a rating");

    const payload = {
      user_name: userName.trim(),
      product_name: productName.trim() || "All Products",
      message: message.trim(),
      rating: Number(rating),
    };

    try {
      if (editingId) {
        await API.put(`/feedback/${editingId}?role=user`, payload);
      } else {
        await API.post(`/feedback?role=user`, payload);
      }
      resetForm();
      fetchFeedbacks();
    } catch (err) {
      alert("Error submitting feedback. Is the backend running?");
    }
  };

  const startEdit = (fb) => {
    setEditingId(fb.id);
    setMessage(fb.message);
    setRating(fb.rating);
    setProductName(fb.product_name || "");
    setReplyingId(null);
    setReplyText("");
    document.querySelector('.page-body').scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => resetForm();

  const deleteAsUser = async (fbId) => {
    if (!userName.trim()) return alert("Enter your name first in the form");
    try {
      await API.delete(`/feedback/${fbId}?role=user&user_name=${encodeURIComponent(userName.trim())}`);
      fetchFeedbacks();
    } catch (e) {
      alert("Error deleting feedback or permission denied.");
    }
  };

  const deleteAsAdmin = async (fbId) => {
    try {
      await API.delete(`/feedback/${fbId}?role=admin`);
      fetchFeedbacks();
    } catch (e) {
      alert("Error deleting feedback.");
    }
  };

  const replyAsAdmin = async (fbId) => {
    if (role !== "admin") return;
    if (!replyText.trim()) return alert("Please type a reply");

    try {
      await API.put(`/feedback/${fbId}/reply?role=admin`, {
        reply: replyText.trim(),
      });
      setReplyingId(null);
      setReplyText("");
      fetchFeedbacks();
    } catch (e) {
      alert("Error sending reply.");
    }
  };

  const canUserEdit = (fb) => role === "user" && (fb.user_name || "").trim().toLowerCase() === userName.trim().toLowerCase();
  const canAdminDelete = (fb) => false;

  const displayedFeedbacks = feedbacks.filter(fb => {
    if (activeTab === "Offensive Content" && !fb.offensive) return false;
    const isPositive = fb.rating >= 3;
    if (sentimentFilter === "Positive" && !isPositive) return false;
    if (sentimentFilter === "Negative" && isPositive) return false;
    return true;
  });

  const offensiveCount = feedbacks.filter(f => f.offensive).length;
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const criticalCount = feedbacks.filter(f => f.rating <= 2 || f.offensive).length;

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Users" },
    { icon: Package, label: "Products & Inventory" },
    { icon: Truck, label: "Suppliers" },
    { icon: ShoppingCart, label: "Orders" },
    { icon: MessageSquare, label: "Feedback", active: true },
    { icon: Bot, label: "Chatbot Support" },
    { icon: BarChart2, label: "Reports & Analytics" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Ransara_Logo" style={{height: "30px"}} /></div>
          <h2>Ransara Supermarket</h2>
        </div>
        <nav className="nav-menu">
          {sidebarItems.map((item, idx) => (
            <div key={idx} className={`nav-item ${item.active ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by product..."
              value={filterProduct === "all" ? "" : filterProduct}
              onChange={(e) => {
                const val = e.target.value;
                setFilterProduct(val.trim() === "" ? "all" : val);
              }}
            />
          </div>
          <div className="header-actions">
            <div className="role-switch">
              <span className="role-label">Role:</span>
              <select className="role-select" value={role} onChange={(e) => { setRole(e.target.value); resetForm(); }}>
                <option value="user">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="notification">
              <Bell size={20} />
              <span className="badge">3</span>
            </div>
            <div className="profile">
              <div className="profile-avatar">{role === 'admin' ? 'AD' : 'CS'}</div>
              <span className="profile-name">{role === 'admin' ? 'Admin' : 'Customer'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-body">

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-title">Total Feedbacks</div>
              <span className="stat-value">{feedbacks.length}</span>
            </div>
            <div className="stat-card">
              <div className="stat-title">Positive Feedbacks</div>
              <span className="stat-value text-green">{positiveCount}</span>
            </div>
            <div className="stat-card">
              <div className="stat-title">Critical Feedbacks</div>
              <span className="stat-value text-red">{criticalCount}</span>
            </div>
            <div className="stat-card">
              <div className="stat-title">Offensive Content</div>
              <span className="stat-value text-orange">{offensiveCount}</span>
            </div>
          </div>

          {/* Feedback Form for User Role */}
          {role === "user" && (
            <div className="form-card">
              <h2 className="form-title">
                {editingId ? "Update your feedback" : "Submit Feedback"}
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Your Name</label>
                  <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="form-group">
                  <label>Product Name/ID</label>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Milk or P003" />
                </div>
                <div className="form-group">
                  <label>Rating</label>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} onClick={() => setRating(star)} className={`star ${star <= rating ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your feedback..."></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={submit}>
                  <Send size={16} /> {editingId ? "Update Feedback" : "Submit Feedback"}
                </button>
                {editingId && <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>}
              </div>
            </div>
          )}

          {/* Controls Row */}
          <div className="controls-row">
            <div className="tabs">
              <div
                className={`tab ${activeTab === 'All Feedback' ? 'active' : ''}`}
                onClick={() => setActiveTab('All Feedback')}
              >
                All Feedback
              </div>
              <div
                className={`tab ${activeTab === 'Offensive Content' ? 'active' : ''}`}
                onClick={() => setActiveTab('Offensive Content')}
              >
                Offensive Content <span className="tab-badge">{offensiveCount}</span>
              </div>
            </div>

            <div className="filter-dropdown" ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Filter size={16} color="#6B7280" />
              <span>{sentimentFilter}</span>
              <ChevronDown size={16} color="#6B7280" />
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => setSentimentFilter("All Sentiments")}>All Sentiments {sentimentFilter === "All Sentiments" && <Check size={14} />}</div>
                  <div className="dropdown-item" onClick={() => setSentimentFilter("Positive")}>Positive {sentimentFilter === "Positive" && <Check size={14} />}</div>
                  <div className="dropdown-item" onClick={() => setSentimentFilter("Negative")}>Negative {sentimentFilter === "Negative" && <Check size={14} />}</div>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="table-card">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Feedback ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Message</th>
                  <th>Rating Type</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayedFeedbacks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">No feedback found.</td>
                  </tr>
                )}
                {displayedFeedbacks.map((fb, idx) => {
                  const isPositive = fb.rating >= 3;
                  const displayId = fb.id ? `F${String(fb.id).padStart(3, '0')}` : `F${String(idx + 1).padStart(3, '0')}`;
                  const displayDate = fb.created_at ? new Date(fb.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                  const blurForUser = role === "user" && fb.offensive;
                  const canEdit = canUserEdit(fb);
                  const canAdminDel = canAdminDelete(fb);

                  return (
                    <tr key={fb.id || idx}>
                      <td className="ft-id">{displayId}</td>
                      <td>
                        <div className="fw-500">{fb.product_name || "Unknown Product"}</div>
                      </td>
                      <td className="user-cell">
                        <div className="fw-500">{fb.user_name || "Unknown"}</div>
                      </td>
                      <td className="message-cell">
                        <div className={`message-text ${blurForUser ? 'blur-text' : ''}`}>
                          {fb.message || "No message provided."}
                        </div>
                        {fb.offensive && (
                          <div className="ai-flagged">
                            <ShieldAlert size={14} /> Offensive
                          </div>
                        )}
                        {fb.reply && (
                          <div className="admin-reply-display">
                            <strong>Admin Reply: </strong> {fb.reply}
                          </div>
                        )}
                        {role === "admin" && replyingId === fb.id && (
                          <div className="reply-box mt-2">
                            <textarea
                              className="reply-input"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type reply..."
                            />
                            <div className="reply-actions mt-2">
                              <button className="btn-sm btn-primary" onClick={() => replyAsAdmin(fb.id)}>Send</button>
                              <button className="btn-sm btn-ghost" onClick={() => { setReplyingId(null); setReplyText(""); }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {isPositive ? (
                          <span className="badge-positive">
                            <ThumbsUp size={12} strokeWidth={2.5} /> Positive
                          </span>
                        ) : (
                          <span className="badge-negative">
                            <ThumbsDown size={12} strokeWidth={2.5} /> Negative
                          </span>
                        )}
                      </td>
                      <td>{displayDate}</td>
                      <td className="actions-cell">
                        {role === "admin" && (
                          <>
                            <button className="icon-btn" title="Reply" onClick={() => { setReplyingId(fb.id); setReplyText(fb.reply || ""); }}>
                              <CornerUpLeft size={16} />
                            </button>
                            
                          </>
                        )}
                        {role === "user" && canEdit && (
                          <>
                            <button className="icon-btn" title="Edit" onClick={() => startEdit(fb)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-btn hover-bg-red" title="Delete" onClick={() => deleteAsUser(fb.id)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}