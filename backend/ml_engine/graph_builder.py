"""
Route Resilience — Graph extraction from binary road masks.

Pipeline
--------
    binary mask (0 / 255)
    → skeletonize_mask     thin roads to 1-pixel-wide centrelines
    → build_graph          trace centrelines → NetworkX pixel-space graph
    → project_to_geo       remap pixel coords to real-world lon/lat
    → to_geojson           serialise as a GeoJSON FeatureCollection
"""

from __future__ import annotations

from typing import Any

import networkx as nx
import numpy as np
from skimage.morphology import skeletonize as _skeletonize


# 8-connected neighbourhood offsets  (delta_row, delta_col)
_8_OFFSETS: list[tuple[int, int]] = [
    (-1, -1), (-1, 0), (-1, 1),
    ( 0, -1),          ( 0, 1),
    ( 1, -1), ( 1, 0), ( 1, 1),
]


def _neighbour_count(skel: np.ndarray, r: int, c: int) -> int:
    """Return the number of True pixels in the 8-neighbourhood of (r, c)."""
    h, w = skel.shape
    return sum(
        1
        for dr, dc in _8_OFFSETS
        if 0 <= r + dr < h and 0 <= c + dc < w and skel[r + dr, c + dc]
    )


class GraphExtractor:
    """
    Convert a binary road mask into a geo-projected NetworkX graph and GeoJSON.

    Each public method is a discrete pipeline stage and can be called
    independently, making it easy to inspect intermediate results.

    Typical usage
    -------------
    >>> ge       = GraphExtractor()
    >>> skeleton = ge.skeletonize_mask(mask_255)
    >>> graph    = ge.build_graph(skeleton)
    >>> graph    = ge.project_to_geo(graph, mask_255.shape, bbox)
    >>> geojson  = ge.to_geojson(graph)
    """

    # ------------------------------------------------------------------
    # Stage 1 — Skeletonisation
    # ------------------------------------------------------------------

    def skeletonize_mask(self, mask: np.ndarray) -> np.ndarray:
        """
        Reduce a binary road mask to a 1-pixel-wide skeleton.

        Parameters
        ----------
        mask : np.ndarray, shape (H, W), dtype uint8
            Road pixels = 255, background = 0.

        Returns
        -------
        np.ndarray, shape (H, W), dtype bool
            True where a skeleton pixel is present.

        Raises
        ------
        ValueError
            If *mask* is not 2-D.
        """
        if mask.ndim != 2:
            raise ValueError(
                f"Expected a 2-D mask; got shape {mask.shape}. "
                "Pass a single-channel image."
            )

        # Normalise to boolean — handles both 0/255 uint8 and 0/1 float masks.
        bool_mask = mask.astype(bool) if mask.dtype == bool else (mask / 255).astype(bool)
        return _skeletonize(bool_mask)

    # ------------------------------------------------------------------
    # Stage 2 — Graph building
    # ------------------------------------------------------------------

    def build_graph(self, skeleton: np.ndarray) -> nx.Graph:
        """
        Trace the skeleton and build an undirected pixel-space graph.

        Pixel classification
        --------------------
        * **Endpoint**  (1 skeleton neighbour)  → graph node, degree 1
        * **Junction**  (≥3 skeleton neighbours) → graph node, intersection
        * **Path pixel** (2 skeleton neighbours) → interior of an edge

        Node attributes
        ---------------
        ``pixel_row``, ``pixel_col`` — integer pixel position.

        Edge attributes
        ---------------
        ``pixel_path`` — ordered ``list[(row, col)]`` for the full centreline,
                         inclusive of the two endpoint nodes.
        ``length``     — pixel count of the path (pixel-space road length).

        Parameters
        ----------
        skeleton : np.ndarray, shape (H, W), dtype bool
            Output of :meth:`skeletonize_mask`.

        Returns
        -------
        nx.Graph
            Undirected graph in pixel-coordinate space.
            Empty graph when the skeleton contains no pixels.
        """
        if not skeleton.any():
            return nx.Graph()

        h, w = skeleton.shape

        # --- Classify every skeleton pixel --------------------------- #
        endpoints: set[tuple[int, int]] = set()
        junctions: set[tuple[int, int]] = set()

        for r, c in zip(*np.where(skeleton)):
            r, c = int(r), int(c)
            n = _neighbour_count(skeleton, r, c)
            if n == 1:
                endpoints.add((r, c))
            elif n >= 3:
                junctions.add((r, c))

        # Pixels that become graph nodes
        node_pixels: set[tuple[int, int]] = endpoints | junctions

        # Guard: if the skeleton is a single closed loop with no junctions
        # or endpoints (all pixels have exactly 2 neighbours), pick an
        # arbitrary starting pixel so the loop is still represented.
        if not node_pixels:
            r0, c0 = int(np.argwhere(skeleton)[0][0]), int(np.argwhere(skeleton)[0][1])
            node_pixels.add((r0, c0))

        # --- Assign stable integer IDs (sorted for reproducibility) -- #
        node_id: dict[tuple[int, int], int] = {
            px: idx for idx, px in enumerate(sorted(node_pixels))
        }

        G = nx.Graph()
        for px, idx in node_id.items():
            G.add_node(idx, pixel_row=px[0], pixel_col=px[1])

        # --- Trace edges between nodes -------------------------------- #
        # visited_starts stores (node_id, first_step_pixel) to guarantee each
        # directed half-edge is processed exactly once, preventing duplicates
        # whether the same road is reached from either end.
        visited_starts: set[tuple[int, tuple[int, int]]] = set()

        for start_px in sorted(node_pixels):
            sid = node_id[start_px]

            for dr, dc in _8_OFFSETS:
                nr, nc = start_px[0] + dr, start_px[1] + dc

                # Skip out-of-bounds or non-skeleton pixels
                if not (0 <= nr < h and 0 <= nc < w) or not skeleton[nr, nc]:
                    continue

                first_step: tuple[int, int] = (nr, nc)
                if (sid, first_step) in visited_starts:
                    continue
                # Claim this direction before walking so concurrent branches
                # from the same node don't duplicate the edge.
                visited_starts.add((sid, first_step))

                # Walk forward along path pixels until we hit another node
                path: list[tuple[int, int]] = [start_px, first_step]
                prev, cur = start_px, first_step

                while cur not in node_pixels:
                    advanced = False
                    for dr2, dc2 in _8_OFFSETS:
                        nxt: tuple[int, int] = (cur[0] + dr2, cur[1] + dc2)
                        if nxt == prev:
                            continue  # never backtrack
                        if (
                            0 <= nxt[0] < h
                            and 0 <= nxt[1] < w
                            and skeleton[nxt[0], nxt[1]]
                        ):
                            prev, cur = cur, nxt
                            path.append(cur)
                            advanced = True
                            break
                    if not advanced:
                        break  # dead-end (rare after skeletonise; skip safely)

                if cur not in node_pixels:
                    continue  # walk ended without reaching a node — discard

                eid = node_id[cur]

                # Block the reverse traversal from the other end
                visited_starts.add((eid, path[-2]))

                # Avoid self-loops that arise when a tiny cycle folds back
                if sid != eid:
                    G.add_edge(sid, eid, pixel_path=path, length=len(path))

        return G

    # ------------------------------------------------------------------
    # Stage 3 — Geospatial projection
    # ------------------------------------------------------------------

    def project_to_geo(
        self,
        graph: nx.Graph,
        image_shape: tuple[int, int],
        bbox: tuple[float, float, float, float],
    ) -> nx.Graph:
        """
        Map pixel coordinates to geographic (longitude, latitude) values.

        Coordinate mapping convention
        ------------------------------
        Images store pixels top-to-bottom, but latitude increases upward:

        * col 0        → ``min_lon``  (west edge)
        * col W        → ``max_lon``  (east edge)
        * row 0 (top)  → ``max_lat``  (north edge)
        * row H (btm)  → ``min_lat``  (south edge)

        So for a pixel at (row, col) in an H×W image:
            lon = min_lon + (col / W) × (max_lon − min_lon)
            lat = max_lat − (row / H) × (max_lat − min_lat)

        Parameters
        ----------
        graph : nx.Graph
            Pixel-space graph from :meth:`build_graph`.
        image_shape : tuple[int, int]
            ``(height, width)`` of the source image in pixels.
        bbox : tuple[float, float, float, float]
            ``(min_lon, min_lat, max_lon, max_lat)`` geographic bounding box.

        Returns
        -------
        nx.Graph
            The same graph object, mutated in-place, with ``lon`` and ``lat``
            added to every node and ``geo_path`` (list of [lon, lat] pairs)
            added to every edge.

        Raises
        ------
        ValueError
            If *bbox* is not a 4-element sequence.
        """
        if len(bbox) != 4:
            raise ValueError(
                f"bbox must have 4 elements (min_lon, min_lat, max_lon, max_lat); "
                f"got {len(bbox)}."
            )

        if graph.number_of_nodes() == 0:
            return graph

        h, w = image_shape
        min_lon, min_lat, max_lon, max_lat = bbox
        lon_span = max_lon - min_lon
        lat_span = max_lat - min_lat

        def _px_to_geo(row: int, col: int) -> tuple[float, float]:
            lon = min_lon + (col / w) * lon_span
            lat = max_lat - (row / h) * lat_span
            return lon, lat

        # Project nodes
        for nid, data in graph.nodes(data=True):
            lon, lat = _px_to_geo(data["pixel_row"], data["pixel_col"])
            graph.nodes[nid]["lon"] = lon
            graph.nodes[nid]["lat"] = lat

        # Project full edge centreline paths
        for u, v, data in graph.edges(data=True):
            graph.edges[u, v]["geo_path"] = [
                list(_px_to_geo(r, c))
                for r, c in data.get("pixel_path", [])
            ]

        return graph

    # ------------------------------------------------------------------
    # Stage 4 — GeoJSON export
    # ------------------------------------------------------------------

    def to_geojson(self, graph: nx.Graph) -> dict[str, Any]:
        """
        Serialise the projected graph as a valid GeoJSON FeatureCollection.

        Output schema
        -------------
        * **Nodes**  → ``Point`` features
          Properties: ``node_id``, ``pixel_row``, ``pixel_col``
        * **Edges**  → ``LineString`` features
          Properties: ``source``, ``target``, ``length``

        Parameters
        ----------
        graph : nx.Graph
            Graph with ``lon``/``lat`` node attributes and ``geo_path`` edge
            attributes — i.e. the output of :meth:`project_to_geo`.

        Returns
        -------
        dict
            A GeoJSON ``FeatureCollection`` ready for JSON serialisation or
            direct consumption by a mapping library such as Leaflet/MapboxGL.

        Raises
        ------
        ValueError
            If any node is missing ``lon`` or ``lat`` attributes (i.e.
            :meth:`project_to_geo` has not been called yet).
        """
        features: list[dict[str, Any]] = []

        # --- Nodes as Point features --------------------------------- #
        for nid, data in graph.nodes(data=True):
            if "lon" not in data or "lat" not in data:
                raise ValueError(
                    f"Node {nid} has no geographic coordinates. "
                    "Call project_to_geo() before to_geojson()."
                )
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [data["lon"], data["lat"]],
                },
                "properties": {
                    "node_id":   nid,
                    "pixel_row": data.get("pixel_row"),
                    "pixel_col": data.get("pixel_col"),
                },
            })

        # --- Edges as LineString features ---------------------------- #
        for u, v, data in graph.edges(data=True):
            geo_path: list[list[float]] = data.get("geo_path") or []

            # Degenerate fallback: straight line between the two nodes
            if len(geo_path) < 2:
                geo_path = [
                    [graph.nodes[u]["lon"], graph.nodes[u]["lat"]],
                    [graph.nodes[v]["lon"], graph.nodes[v]["lat"]],
                ]

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": geo_path,
                },
                "properties": {
                    "source": u,
                    "target": v,
                    "length": data.get("length", len(geo_path)),
                },
            })

        return {"type": "FeatureCollection", "features": features}
