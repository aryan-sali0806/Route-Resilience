"""
Route Resilience — FastAPI application entry point.

Exposes three core endpoints:
  POST /api/extract   — satellite image → road GeoJSON + criticality
  POST /api/simulate  — node ablation → resilience index
  POST /api/evaluate  — segmentation & graph quality metrics
"""

from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# App & middleware
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Route Resilience API",
    description="Occlusion-robust road extraction and network resilience analysis.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to the React dev-server origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class SimulateRequest(BaseModel):
    """Payload for the node-ablation simulation endpoint."""
    node_id: str


class SimulateResponse(BaseModel):
    """Result of a single node-ablation simulation."""
    node_id: str
    resilience_index: float
    baseline_path_length: float
    perturbed_path_length: float
    severed_edges: list[str]


class EvaluateResponse(BaseModel):
    """Segmentation and graph quality metrics for judge evaluation."""
    relaxed_iou: float
    connectivity_ratio: float
    topological_accuracy: float


# ---------------------------------------------------------------------------
# Hardcoded stub data
# ---------------------------------------------------------------------------

_STUB_GEOJSON: dict[str, Any] = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [77.2090, 28.6139],
                    [77.2100, 28.6150],
                    [77.2115, 28.6162],
                ],
            },
            "properties": {
                "type": "road_segment",
                "criticality": 0.45,
            },
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [77.2100, 28.6150],
            },
            "properties": {
                "type": "intersection_node",
                "node_id": "node_001",
                "criticality": 0.9,
            },
        },
    ],
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/extract", response_model=dict[str, Any])
async def extract_roads(image: UploadFile = File(...)) -> dict[str, Any]:
    """
    Accept a satellite image upload and return a GeoJSON FeatureCollection
    of extracted road segments and intersection nodes, each annotated with
    a betweenness-centrality criticality score in [0, 1].

    Currently returns a hardcoded stub; will be wired to the ML + graph
    pipeline in a subsequent iteration.

    Args:
        image: The uploaded satellite image file (TIFF, PNG, or JPG).

    Returns:
        A GeoJSON FeatureCollection with road LineStrings and node Points.
    """
    return _STUB_GEOJSON


@app.post("/api/simulate", response_model=SimulateResponse)
async def simulate_failure(payload: SimulateRequest) -> SimulateResponse:
    """
    Simulate the removal of a single node from the road network and return
    the resulting Resilience Index R = L_baseline / L_perturbed.

    Args:
        payload: JSON body containing the target ``node_id`` to ablate.

    Returns:
        A SimulateResponse with the resilience index, path-length statistics,
        and the list of edge IDs severed by the node's removal.
    """
    return SimulateResponse(
        node_id=payload.node_id,
        resilience_index=0.0,
        baseline_path_length=0.0,
        perturbed_path_length=0.0,
        severed_edges=[],
    )


@app.post("/api/evaluate", response_model=EvaluateResponse)
async def evaluate_pipeline() -> EvaluateResponse:
    """
    Run the full evaluation suite against ground-truth OSM data and return
    judge-facing metrics: Relaxed IoU, Connectivity Ratio, and Topological
    Accuracy (average path-length error over 50 random node pairs).

    Returns:
        An EvaluateResponse containing the three evaluation metric scores.
    """
    return EvaluateResponse(
        relaxed_iou=0.0,
        connectivity_ratio=0.0,
        topological_accuracy=0.0,
    )
