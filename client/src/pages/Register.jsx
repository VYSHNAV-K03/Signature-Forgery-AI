import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import "animate.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone must be 10 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axiosInstance.post("/register/user", formData);
      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setMessage("");
    }
  };

  return (
    <div className="container-fluid bg-light py-5">
      <div className="row justify-content-center align-items-center">
        <div className="col-lg-5 d-none d-lg-block text-center animate__animated animate__fadeInLeft">
          <img
            src="/images/undraw_signup.svg"
            alt="Register Illustration"
            className="img-fluid"
            style={{ maxHeight: "450px" }}
          />
        </div>

        <div className="col-lg-5 animate__animated animate__fadeInRight">
          <div className="card p-4 p-md-5 shadow-lg border-0 rounded-4">
            <h2 className="text-center mb-4 fw-bold text-primary">
              Create Account
            </h2>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.username && "is-invalid"}`}
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <div className="invalid-feedback">{errors.username}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className={`form-control ${errors.email && "is-invalid"}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.password && "is-invalid"}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="form-label">
                  Phone
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.phone && "is-invalid"}`}
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <div className="invalid-feedback">{errors.phone}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold"
              >
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
