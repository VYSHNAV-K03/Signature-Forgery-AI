import torch
import torch.nn as nn
import torchvision.models as models

# Define Vision Transformer (ViT)
class VisionTransformer(nn.Module):
    def __init__(self, feature_dim=512, num_classes=2):
        super(VisionTransformer, self).__init__()
        self.fc1 = nn.Linear(feature_dim, 256)
        self.fc2 = nn.Linear(256, num_classes)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        x = x.view(x.size(0), -1)  # Flatten feature map
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# Define Hybrid Model (ResNet + ViT)
class HybridModel(nn.Module):
    def __init__(self, feature_extractor="resnet", feature_dim=512):
        super(HybridModel, self).__init__()
        
        if feature_extractor == "resnet":
            self.feature_extractor = models.resnet18(pretrained=False)
            self.feature_extractor = nn.Sequential(*list(self.feature_extractor.children())[:-1])
            feature_dim = 512  # ResNet-18 feature size
        elif feature_extractor == "mobilenet":
            self.feature_extractor = models.mobilenet_v2(pretrained=False)
            self.feature_extractor = nn.Sequential(*list(self.feature_extractor.children())[:-1])
            feature_dim = 1280  # MobileNet feature size

        self.vit = VisionTransformer(feature_dim=feature_dim)

    def forward(self, x):
        x = self.feature_extractor(x)
        x = self.vit(x)
        return x
