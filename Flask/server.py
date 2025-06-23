import torch
from flask import Flask, request, send_file, jsonify
import fitz  # PyMuPDF
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
from PIL import Image
import torchvision.transforms as transforms
from model import HybridModel  # Import your trained model class

app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing)
CORS(app)



UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "extracted_images"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "pdf" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files["pdf"]
    if pdf_file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(pdf_file.filename)
    pdf_path = os.path.join(UPLOAD_FOLDER, filename)
    pdf_file.save(pdf_path)

    # Extract images
    extracted_images = extract_images_from_pdf(pdf_path)

    return jsonify({"images": extracted_images})


def extract_images_from_pdf(pdf_path):
    """Extract all images from a PDF and save them as separate files."""
    doc = fitz.open(pdf_path)
    image_urls = []

    for page_number in range(len(doc)):
        for img_index, img in enumerate(doc[page_number].get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            image_filename = f"page_{page_number+1}_img_{img_index+1}.{image_ext}"
            image_path = os.path.join(OUTPUT_FOLDER, image_filename)

            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)

            image_urls.append(f"/download/{image_filename}")

    return image_urls

@app.route("/download/<filename>", methods=["GET"])
def download_image(filename):
    image_path = os.path.join(OUTPUT_FOLDER, filename)
    return send_file(image_path, as_attachment=True)


# Load the trained model
model = HybridModel(feature_extractor="resnet")  # Ensure same architecture as training
model.load_state_dict(torch.load("hybrid_signature_model.pth", map_location=torch.device("cpu")))
model.eval()

# Define Image Transformations (must match training transformations)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    
    try:
        image = Image.open(file).convert("RGB")
        image = transform(image).unsqueeze(0)  # Add batch dimension

        with torch.no_grad():
            output = model(image)
            _, predicted = output.max(1)

        result = "Genuine" if predicted.item() == 0 else "Forged"
        return jsonify({"result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


IMAGE_FOLDER = "extracted_images"  # Folder where images are stored

@app.route("/predict_from_url", methods=["POST"])
def predict_from_url():
    data = request.get_json()
    if not data or "image_name" not in data:
        return jsonify({"error": "No image name provided"}), 400

    image_name = data["image_name"]
    image_path = os.path.join(IMAGE_FOLDER, image_name)
    
    if not os.path.exists(image_path):
        return jsonify({"error": "Image not found"}), 404
    
    try:
        image = Image.open(image_path).convert("RGB")
        image = transform(image).unsqueeze(0)  # Add batch dimension

        with torch.no_grad():
            output = model(image)
            _, predicted = output.max(1)

        result = "Genuine" if predicted.item() == 0 else "Forged"
        return jsonify({"result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
