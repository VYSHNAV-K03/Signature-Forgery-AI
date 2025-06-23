import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import "animate.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/login", formData);
      setMessage(response.data.message);
      setError("");
      localStorage.setItem("token", response.data.token);

      const role = response.data.user.role;
      navigate(
        role === "admin"
          ? "/admin"
          : role === "doctor"
          ? "/doctor"
          : "/dashboard"
      );
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setMessage("");
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex p-0">
      <div className="row w-100 m-0">
        {/* Left Image Section */}
        <div className="col-md-6 d-none d-md-flex bg-light justify-content-center align-items-center animate__animated animate__fadeInLeft">
          <img
            src="/images/undraw_login.svg"
            alt="Login Illustration"
            className="img-fluid"
            style={{ maxHeight: "450px" }}
          />
        </div>

        {/* Right Form Section */}
        <div className="col-md-6 d-flex justify-content-center align-items-center animate__animated animate__fadeInRight">
          <div className="w-75 p-4 p-md-5 shadow rounded-4 bg-white">
            <h2 className="text-center mb-4 fw-bold text-primary">
              Welcome Back
            </h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
