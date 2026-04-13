"""
Train a ResNet18 CNN for brain stroke classification.
Uses transfer learning from ImageNet pretrained weights.
"""
import os
import sys
import glob
import random
import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image

NORMAL_DIR = "/tmp/brain_ct_data/brain_ct_data/Normal"
STROKE_DIR = "/tmp/brain_ct_data/brain_ct_data/Stroke"
MODEL_OUT = "/app/backend/cnn_model.pt"
CLASSES = ['hemorrhagic', 'ischemic', 'normal']
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 12
LR = 0.001

# Add backend to path for feature-based sub-classification
sys.path.insert(0, '/app/backend')


class BrainCTDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples  # list of (path, label_idx)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, label


def prepare_dataset():
    """Load and label all images."""
    from ml_model import StrokeDetectionModel
    model = StrokeDetectionModel()

    print("[1/4] Loading and labeling images...")

    # Normal images
    normal_files = glob.glob(os.path.join(NORMAL_DIR, "*.jpg"))
    random.shuffle(normal_files)
    normal_files = normal_files[:600]

    # Stroke images - sub-classify
    stroke_files = glob.glob(os.path.join(STROKE_DIR, "*.jpg"))
    random.shuffle(stroke_files)
    stroke_files = stroke_files[:600]

    hemorrhagic_files = []
    ischemic_files = []

    # Use feature analysis to split stroke into hemorrhagic/ischemic
    for i, fpath in enumerate(stroke_files):
        try:
            with open(fpath, 'rb') as f:
                img_bytes = f.read()
            enhanced, orig = model.preprocess_image(img_bytes)
            feats = model.extract_features(enhanced, orig)

            asym_mean = feats['asymmetry_mean']
            n_bright = feats['num_bright_regions']
            vhi = feats['very_high_intensity_ratio']

            is_hemorrhagic = (
                (asym_mean > 30 and n_bright > 20) or
                (asym_mean > 45) or
                (n_bright > 60 and vhi > 0.1)
            )
            if is_hemorrhagic:
                hemorrhagic_files.append(fpath)
            else:
                ischemic_files.append(fpath)
        except Exception:
            continue
        if (i + 1) % 200 == 0:
            print(f"  Classified {i+1}/{len(stroke_files)} stroke images...")

    print(f"  Normal: {len(normal_files)}, Hemorrhagic: {len(hemorrhagic_files)}, Ischemic: {len(ischemic_files)}")

    # Balance classes
    min_count = min(len(normal_files), len(hemorrhagic_files), len(ischemic_files))
    min_count = max(min_count, 50)  # at least 50

    samples = []
    for f in normal_files[:min_count]:
        samples.append((f, 2))  # normal=2
    for f in hemorrhagic_files[:min_count]:
        samples.append((f, 0))  # hemorrhagic=0
    for f in ischemic_files[:min_count]:
        samples.append((f, 1))  # ischemic=1

    random.shuffle(samples)
    print(f"  Balanced dataset: {min_count} per class, {len(samples)} total")
    return samples


def train_cnn(samples):
    """Train ResNet18 with transfer learning."""
    print("\n[2/4] Setting up ResNet18 model...")

    # Split train/val
    split = int(0.85 * len(samples))
    train_samples = samples[:split]
    val_samples = samples[split:]

    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_ds = BrainCTDataset(train_samples, train_transform)
    val_ds = BrainCTDataset(val_samples, val_transform)
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # ResNet18 with transfer learning
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    # Freeze early layers
    for param in list(model.parameters())[:-20]:
        param.requires_grad = False
    # Replace final layer for 3 classes
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(model.fc.in_features, 3)
    )

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=LR)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    print(f"\n[3/4] Training for {EPOCHS} epochs ({len(train_samples)} train, {len(val_samples)} val)...")
    best_acc = 0.0
    best_state = None

    for epoch in range(EPOCHS):
        # Train
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for imgs, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * imgs.size(0)
            _, preds = outputs.max(1)
            train_correct += preds.eq(labels).sum().item()
            train_total += imgs.size(0)

        # Validate
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                outputs = model(imgs)
                _, preds = outputs.max(1)
                val_correct += preds.eq(labels).sum().item()
                val_total += imgs.size(0)

        train_acc = train_correct / train_total * 100
        val_acc = val_correct / max(val_total, 1) * 100
        scheduler.step()

        print(f"  Epoch {epoch+1:2d}/{EPOCHS}: loss={train_loss/train_total:.4f} train_acc={train_acc:.1f}% val_acc={val_acc:.1f}%")

        if val_acc > best_acc:
            best_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    if best_state:
        model.load_state_dict(best_state)

    print(f"\n  Best validation accuracy: {best_acc:.1f}%")
    return model, best_acc


def save_model(model, accuracy):
    """Save the trained CNN model."""
    print("\n[4/4] Saving model...")
    torch.save({
        'model_state_dict': model.state_dict(),
        'classes': CLASSES,
        'accuracy': accuracy,
        'img_size': IMG_SIZE,
    }, MODEL_OUT)
    size_mb = os.path.getsize(MODEL_OUT) / (1024 * 1024)
    print(f"  Model saved to {MODEL_OUT} ({size_mb:.1f} MB)")

    # Save metadata
    meta = {
        'model_type': 'resnet18',
        'classes': CLASSES,
        'accuracy': accuracy,
        'img_size': IMG_SIZE,
        'path': MODEL_OUT
    }
    with open(MODEL_OUT.replace('.pt', '_meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)


def verify_model(model):
    """Verify on demo images."""
    print("\n[Verification] Testing CNN on demo images...")
    demo_dir = "/app/backend/demo_data"
    meta_file = os.path.join(demo_dir, "demo_meta.json")
    if not os.path.exists(meta_file):
        print("  No demo images found")
        return

    with open(meta_file) as f:
        demos = json.load(f)

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    model.eval()
    with torch.no_grad():
        for d in demos:
            path = os.path.join(demo_dir, d['filename'])
            if not os.path.exists(path):
                continue
            img = Image.open(path).convert('RGB')
            tensor = transform(img).unsqueeze(0)
            output = model(tensor)
            probs = torch.softmax(output, dim=1)[0]
            pred_idx = probs.argmax().item()
            pred_class = CLASSES[pred_idx]
            conf = probs[pred_idx].item() * 100
            match = "OK" if pred_class == d['expected'] else "MISS"
            print(f"  {d['filename']:25s} -> {pred_class:>13} ({conf:.1f}%) [{match}] expected={d['expected']}")


def main():
    print("=" * 60)
    print("Training ResNet18 CNN for Brain Stroke Detection")
    print("=" * 60)

    random.seed(42)
    torch.manual_seed(42)

    samples = prepare_dataset()
    model, accuracy = train_cnn(samples)
    save_model(model, accuracy)
    verify_model(model)

    print("\nDone!")


if __name__ == '__main__':
    main()
