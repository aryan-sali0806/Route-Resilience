# Route Resilience

> AI-powered road network extraction and resilience analysis from satellite imagery.

Route Resilience ingests a raw satellite image and runs it through a four-phase pipeline: semantic segmentation with DeepLabV3+, topological graph reconstruction, structural intelligence (centrality analysis), and stress-test simulation (edge-ablation scenarios). The output is an interactive GeoJSON road graph overlaid on a live map, along with quantitative resilience scores per simulated disaster event.

---

## Demo

| Screen | Description |
|---|---|
| **Landing** | Mission-control aesthetic landing page with project overview |
| **Portal Console** | Drag-and-drop satellite image upload |
| **Processing** | Animated checklist modal showing the live algorithm pipeline |
| **Results** | Interactive Leaflet map with extracted road graph overlay |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  React 19 + Vite + Tailwind CSS + React-Leaflet          │
│  Landing (Home / About) → Console (Upload → Results)     │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP  (FormData / JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     FastAPI Backend                      │
│                                                          │
│  POST /api/extract   →  DeepLabV3+ inference             │
│  POST /api/simulate  →  Node-ablation resilience test    │
│  POST /api/evaluate  →  OSM ground-truth evaluation      │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             ▼                           ▼
  ┌──────────────────┐       ┌──────────────────────────┐
  │   ML Engine      │       │    Graph Engine          │
  │  DeepLabV3+      │       │  Skeletonize (Zhang-Suen)│
  │  ResNet50 enc.   │──────▶│  Build NetworkX graph    │
  │  BCE + Dice loss │       │  Project to GeoJSON      │
  └──────────────────┘       └──────────────────────────┘
```

---

## Pipeline

### Phase I — Occlusion-Robust Segmentation
A **DeepLabV3+** model with a ResNet-50 encoder and Atrous Spatial Pyramid Pooling (ASPP) head classifies every pixel as road or background. Trained on the [DeepGlobe Road Extraction Dataset](http://deepglobe.org/) using a combined **BCE + Dice loss** with mixed-precision training (AMP). Tolerates shadows, vegetation occlusion, and low-contrast surfaces.

### Phase II — Topological Reconstruction
The binary road mask is thinned to a 1-pixel centreline using the **Zhang-Suen skeletonization** algorithm. Pixels are classified by their 8-connected neighbourhood count: endpoints (1 neighbour) and junctions (≥3 neighbours) become **nodes**; interior pixels (2 neighbours) become **edges**. Node coordinates are projected from pixel-space to geodesic (lon, lat) using the image bounding box. Output: a **GeoJSON FeatureCollection** of Point nodes and LineString edges.

### Phase III — Structural Intelligence
NetworkX computes graph-theoretic metrics across the extracted network:
- **Betweenness centrality** — identifies arterial roads that disproportionately carry flow
- **Degree analysis** — flags low-degree nodes as isolated or dead-end segments
- **Community detection** — reveals neighbourhood clusters and natural partitions

### Phase IV — Stress-Test Simulation
Targeted node- and edge-removal experiments model disaster scenarios (flooding, infrastructure failure, blockades). Each run recomputes **global network efficiency** and **average shortest-path length**, producing a per-scenario resilience index:

```
R = baseline_path_length / perturbed_path_length
```

`R < 1` indicates degraded connectivity; `R → 0` indicates network fragmentation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Segmentation** | PyTorch, torchvision, segmentation-models-pytorch, DeepLabV3+, ResNet-50 |
| **Geospatial** | Rasterio, GDAL, Shapely, GeoPandas, OpenCV |
| **Graph Engine** | NetworkX, scikit-image, SciPy, NumPy |
| **Backend API** | FastAPI, Uvicorn, python-multipart |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React-Leaflet, Lucide-React |
| **Map tiles** | CartoDB Dark Matter (via Leaflet) |
| **Training data** | DeepGlobe Road Extraction Dataset |

---

## Project Structure

```
route-resilience/
├── backend/
│   ├── main.py                  # FastAPI app, endpoints, CORS config
│   ├── requirements.txt
│   └── ml_engine/
│       ├── dataset.py           # DeepGlobeDataset (PyTorch Dataset)
│       ├── inference.py         # RoadExtractor — loads weights, runs predict()
│       ├── train.py             # Training script (CLI, AMP, checkpoints)
│       ├── graph_builder.py     # GraphExtractor — skeleton → GeoJSON pipeline
│       └── weights/
│           └── deeplabv3_best.pth   # Fine-tuned model weights (~306 MB)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # State router (home/about/UPLOAD/PROCESSING/RESULTS/ERROR)
│       ├── index.css            # Tailwind v4 + space-grid theme
│       ├── pages/
│       │   ├── HomePage.jsx     # Hero landing with CTA buttons
│       │   └── AboutPage.jsx    # Pipeline cards + tech stack grid
│       └── components/
│           ├── Navbar.jsx       # Fixed nav: logo, links, Portal Console button
│           ├── Sidebar.jsx      # Left panel wrapper for console screens
│           ├── UploadScreen.jsx # Drag-and-drop image upload form
│           ├── ProcessingScreen.jsx  # Animated checklist modal
│           ├── ResultsPanel.jsx # Graph stats + reset control
│           └── ErrorScreen.jsx  # Error card with common issues
│
└── data/
    └── deepgloab_road_extraction/
        ├── class_dict.csv       # road: (255,255,255), background: (0,0,0)
        ├── metadata.csv
        └── test/                # DeepGlobe satellite test images (*_sat.jpg)
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- CUDA-capable GPU (optional but strongly recommended for inference)

---

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

> **Note:** The server loads model weights from `ml_engine/weights/deeplabv3_best.pth` on startup. Ensure the weights file is present before running. If training from scratch, see the [Training](#training) section below.

---

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

The Vite dev server proxies `/api/*` requests to the backend automatically. For production builds:

```bash
npm run build       # outputs to frontend/dist/
npm run preview     # preview the production build locally
```

---

## API Reference

### `POST /api/extract`

Accepts a satellite image and returns a binary road mask.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | Satellite image (`.tif`, `.tiff`, or `.png`) |

**Response:** `image/png` — binary mask where `255 = road`, `0 = background`

---

### `POST /api/simulate`

Runs a node-ablation stress-test on the extracted graph.

**Request:** `application/json`

```json
{ "node_id": 42 }
```

**Response:**

```json
{
  "resilience_index": 0.87,
  "baseline_path_length": 120.4,
  "perturbed_path_length": 103.9,
  "severed_edges": [41, 43, 107]
}
```

---

### `POST /api/evaluate`

Evaluates segmentation output against OSM ground truth.

**Response:**

```json
{
  "relaxed_iou": 0.74,
  "connectivity_ratio": 0.91,
  "topological_accuracy": 0.83
}
```

---

## Training

```bash
cd backend

python ml_engine/train.py \
  --train-dir  data/deepgloab_road_extraction/train \
  --val-dir    data/deepgloab_road_extraction/valid \
  --epochs     50 \
  --batch-size 8 \
  --lr         1e-4
```

Key training details:
- **Model:** DeepLabV3Plus (ResNet-50 encoder, ImageNet pretrained)
- **Loss:** 0.5 × BCE + 0.5 × Dice
- **Augmentation (train):** RandomCrop 512×512, HorizontalFlip, VerticalFlip, ImageNet normalize
- **Augmentation (val):** CenterCrop 512×512, ImageNet normalize
- **Precision:** AMP (automatic mixed precision) on CUDA
- **Checkpoints:** Saved after each epoch; best model saved to `ml_engine/weights/best_model.pth`
- Supports resume: pass `--checkpoint <path>` to continue from a saved checkpoint

---

## Dataset

The model is trained on the **[DeepGlobe Road Extraction Challenge](http://deepglobe.org/)** dataset:

- 6,226 satellite images (2448×2448 px, 50 cm/pixel resolution)
- Binary road masks (white = road, black = background)
- Paired files: `{id}_sat.jpg` / `{id}_mask.png`

The dataset is not included in this repository. Download it from the DeepGlobe challenge page and place it under `data/deepgloab_road_extraction/`.

---

## Acknowledgements

- [DeepGlobe Challenge](http://deepglobe.org/) — road extraction dataset
- [segmentation-models-pytorch](https://github.com/qubvel/segmentation_models.pytorch) — DeepLabV3+ implementation
- [scikit-image](https://scikit-image.org/) — Zhang-Suen skeletonization
- [NetworkX](https://networkx.org/) — graph construction and analysis
- [React-Leaflet](https://react-leaflet.js.org/) — interactive map rendering
- [CartoDB](https://carto.com/) — dark-mode map tiles
