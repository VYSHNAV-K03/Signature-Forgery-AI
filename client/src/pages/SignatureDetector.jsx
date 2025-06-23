import { useState } from "react";
import "animate.css";

const SignatureVerification = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResult("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error("Error:", error);
      setResult("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="vh-100 d-flex flex-column flex-md-row"
      style={{
        background: "linear-gradient(to bottom right, #f0f8ff, #f3e8ff)",
        overflow: "hidden",
      }}
    >
      {/* Left Side: Illustration */}
      <div className="d-none d-md-flex flex-column justify-content-center align-items-center bg-light w-50 p-5 position-relative">
        <img
          src="/images/top_left_circle.svg"
          alt="Circle"
          className="position-absolute animate__animated animate__zoomIn"
          style={{ top: "20px", left: "20px", width: "60px" }}
        />
        <img
          src="/images/bottom_right_circle.svg"
          alt="Circle"
          className="position-absolute animate__animated animate__zoomIn"
          style={{ bottom: "20px", right: "20px", width: "60px" }}
        />
        <img
          src="/images/signature_example.svg"
          alt="Signature Example"
          className="img-fluid w-75 animate__animated animate__fadeIn"
        />
        <h2 className="mt-4 fw-bold text-primary">
          AI-Powered Signature Check
        </h2>
      </div>

      {/* Right Side: Form */}
      <div className="d-flex flex-column justify-content-center align-items-center w-100 w-md-50 p-4">
        <div
          className="bg-white shadow rounded-4 p-4 p-md-5 w-100"
          style={{ maxWidth: "450px" }}
        >
          <h2 className="text-center mb-4 fw-bold text-primary">
            Signature Verification
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="form-control mb-4"
          />

          <button
            onClick={handleUpload}
            className={`btn btn-lg w-100 text-white fw-semibold ${
              loading ? "disabled" : ""
            }`}
            style={{
              background: loading
                ? "#6ea8fe"
                : "linear-gradient(to right, #0d6efd, #6f42c1)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload & Verify"}
          </button>

          {result && (
            <div className="mt-4 fs-5 fw-semibold text-center animate__animated animate__fadeIn">
              Result:
              <span
                className={`ms-2 px-3 py-1 rounded-pill text-white ${
                  result === "Genuine" ? "bg-success" : "bg-danger"
                }`}
              >
                {result}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureVerification;
