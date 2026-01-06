import React, { useState, useEffect } from "react";
import {
  Users,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  User,
  Bell,
  Cake,
  Heart,
  Calendar,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

export default function FamilyTreeApp() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    relation_type: "parent",
    date_of_birth: "",
    date_of_death: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [filterRelation, setFilterRelation] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const relations = [
    "grand-parent",
    "parent",
    "child",
    "sibling",
    "grand-child",
    "spouse",
    "other",
  ];

  const checkUpcomingEvents = (members) => {
    const today = new Date();
    const upcomingEvents = [];

    members.forEach((member) => {
      if (member.date_of_birth) {
        const dob = new Date(member.date_of_birth);
        const nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate()
        );

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil(
          (nextBirthday - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil <= 7 && daysUntil >= 0) {
          upcomingEvents.push({
            type: "birthday",
            name: member.name,
            date: nextBirthday,
            daysUntil,
            relation: member.relation_type,
          });
        }
      }

      if (member.date_of_death) {
        const dod = new Date(member.date_of_death);
        const nextAnniversary = new Date(
          today.getFullYear(),
          dod.getMonth(),
          dod.getDate()
        );

        if (nextAnniversary < today) {
          nextAnniversary.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil(
          (nextAnniversary - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil <= 7 && daysUntil >= 0) {
          upcomingEvents.push({
            type: "memorial",
            name: member.name,
            date: nextAnniversary,
            daysUntil,
            relation: member.relation_type,
          });
        }
      }
    });

    setNotifications(upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil));
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/family-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFamilyMembers(data);
      checkUpcomingEvents(data);
    } catch (err) {
      setError("Failed to fetch family members");
    }
  };

  useEffect(() => {
    if (token) {
      fetchFamilyMembers();
    }
  }, [token]);

  const handleAuth = async () => {
    setError("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin
        ? { username: formData.username, password: formData.password, email: formData.email }
        : formData;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      if (isLogin) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        setIsLogin(true);
        setError("Registration successful! Please login.");
        setFormData({ username: "", email: "", password: "" });
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  const handleAddMember = async () => {
    try {
      const response = await fetch(`${API_URL}/family-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(memberForm),
      });

      if (response.ok) {
        fetchFamilyMembers();
        setShowAddModal(false);
        setMemberForm({
          name: "",
          relation_type: "parent",
          date_of_birth: "",
          date_of_death: "",
          notes: "",
        });
      }
    } catch (err) {
      setError("Failed to add member");
    }
  };

  const handleUpdateMember = async () => {
    try {
      const response = await fetch(
        `${API_URL}/family-members/${editingMember.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(memberForm),
        }
      );

      if (response.ok) {
        fetchFamilyMembers();
        setEditingMember(null);
        setMemberForm({
          name: "",
          relation_type: "parent",
          date_of_birth: "",
          date_of_death: "",
          notes: "",
        });
      }
    } catch (err) {
      setError("Failed to update member");
    }
  };

  const handleDeleteMember = async (id) => {
    if (!confirm("Are you sure you want to delete this family member?")) return;

    try {
      const response = await fetch(`${API_URL}/family-members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchFamilyMembers();
      }
    } catch (err) {
      setError("Failed to delete member");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      relation_type: member.relation_type,
      date_of_birth: member.date_of_birth || "",
      date_of_death: member.date_of_death || "",
      notes: member.notes || "",
    });
  };

  const filteredMembers =
    filterRelation === "all"
      ? familyMembers
      : familyMembers.filter((m) => m.relation_type === filterRelation);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Join Us"}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {isLogin
              ? "Login to your family tree"
              : "Create your family tree account"}
          </p>

          {error && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                error.includes("successful")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onKeyPress={(e) => e.key === "Enter" && handleAuth()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-105 font-semibold shadow-lg"
            >
              {isLogin ? "Login" : "Create Account"}
            </button>
          </div>

          <p className="text-center mt-6 text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ username: "", email: "", password: "" });
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Family Tree
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-indigo-50 rounded-lg transition"
            >
              <Bell className="w-6 h-6 text-indigo-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-800">
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-indigo-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-indigo-700">
              <Calendar className="w-5 h-5" />
              Upcoming Events
            </h3>
            <div className="space-y-2">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    notif.type === "birthday"
                      ? "bg-green-50 border border-green-200"
                      : "bg-purple-50 border border-purple-200"
                  }`}
                >
                  {notif.type === "birthday" ? (
                    <Cake className="w-5 h-5 text-green-600" />
                  ) : (
                    <Heart className="w-5 h-5 text-purple-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {notif.name}'s{" "}
                      {notif.type === "birthday" ? "Birthday" : "Memorial"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {notif.daysUntil === 0
                        ? "Today"
                        : `In ${notif.daysUntil} day${
                            notif.daysUntil > 1 ? "s" : ""
                          }`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select
              value={filterRelation}
              onChange={(e) => setFilterRelation(e.target.value)}
              className="px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Relations</option>
              {relations.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-105 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Family Member
          </button>
        </div>

        {/* Family Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-1 border border-indigo-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {member.name}
                  </h3>
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm rounded-full font-medium shadow-md">
                    {member.relation_type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {member.date_of_birth && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Cake className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Born:</strong>{" "}
                      {new Date(member.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.date_of_death && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Heart className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">
                      <strong>Passed:</strong>{" "}
                      {new Date(member.date_of_death).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.notes && (
                  <p className="text-gray-600 text-sm mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {member.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-indigo-50 rounded-full mb-4">
              <Users className="w-16 h-16 text-indigo-400" />
            </div>
            <p className="text-xl text-gray-600">No family members found</p>
            <p className="text-gray-500 mt-2">
              Start by adding your first family member!
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingMember) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-indigo-200">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {editingMember ? "Edit Family Member" : "Add Family Member"}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <select
                value={memberForm.relation_type}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    relation_type: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                {relations.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={memberForm.date_of_birth}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      date_of_birth: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Death (optional)
                </label>
                <input
                  type="date"
                  value={memberForm.date_of_death}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      date_of_death: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={memberForm.notes}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, notes: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows="3"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingMember ? handleUpdateMember : handleAddMember}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-105 font-semibold shadow-lg"
                >
                  {editingMember ? "Update" : "Add Member"}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                    setMemberForm({
                      name: "",
                      relation_type: "parent",
                      date_of_birth: "",
                      date_of_death: "",
                      notes: "",
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
