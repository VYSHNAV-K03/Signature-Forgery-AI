import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFilePdf, FaDownload } from "react-icons/fa";

const PdfSign = () => {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    setLoading(true);
    if (!file) return alert("Please select a PDF file.");
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData);
      setImages(response.data.images);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file.");
    }
    setLoading(false);
  };

  const handlePredict = async () => {
    setResult(null);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:5000/predict_from_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_name: images[0]?.replace(/^\/download\//, "") })
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to the server");
    }
  };

  useEffect(() => {
    setImages
  }, [images]);

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 animate__animated animate__fadeIn">
        <h2 className="text-center text-primary mb-4">
          <FaFilePdf className="me-2" /> PDF Signature Extractor
        </h2>
        <input type="file" className="form-control mb-3" accept="application/pdf" onChange={handleFileChange} />
        <button className="btn btn-primary w-100 shadow-sm" onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Extract Signatures"}
        </button>

        {images.length > 0 && (
          <div className="mt-4 text-center animate__animated animate__fadeInUp">
            <h5 className="text-success">Extracted Signatures</h5>
            <div className="d-flex flex-wrap justify-content-center">
              {images.map((img, index) => (
                <div key={index} className="m-2">
                  <img
                    src={`http://127.0.0.1:5000${img}`}
                    alt={`Extracted ${index}`}
                    className="img-thumbnail shadow-sm rounded border border-primary"
                    style={{ width: "200px", transition: "transform 0.3s" }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                  <br />
                  <a href={`http://127.0.0.1:5000${img}`} className="btn btn-outline-primary btn-sm mt-2">
                    <FaDownload className="me-1" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <button className="btn btn-success w-100 mt-3 shadow-sm" onClick={handlePredict} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Signature"}
          </button>
        )}

        {result && <p className="mt-3 text-center text-info">Prediction: {result}</p>}
        {error && <p className="mt-3 text-center text-danger">{error}</p>}
      </div>
    </div>
  );
};

export default PdfSign;
