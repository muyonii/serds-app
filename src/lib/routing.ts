export interface Node {
  id: string;
  lat: number;
  lng: number;
}

export interface Edge {
  from: string;
  to: string;
  weight: number; // distance, time, or custom cost
}

export class Graph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge[]> = new Map();

  addNode(node: Node) {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  addEdge(edge: Edge) {
    this.edges.get(edge.from)?.push(edge);
    // Assuming directed by default, add reverse for undirected if needed
    // this.edges.get(edge.to)?.push({ from: edge.to, to: edge.from, weight: edge.weight });
  }
  
  addUndirectedEdge(edge: Edge) {
    this.edges.get(edge.from)?.push(edge);
    this.edges.get(edge.to)?.push({ from: edge.to, to: edge.from, weight: edge.weight });
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Dijkstra's Algorithm implementation for shortest path
   */
  findShortestPath(startId: string, targetId: string): { path: string[], distance: number } | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Initialization
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      // Find the unvisited node with the smallest distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = nodeId;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break; // No reachable unvisited nodes left
      }

      if (currentId === targetId) {
        break; // Found target
      }

      unvisited.delete(currentId);

      const neighbors = this.edges.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;

        const alt = distances.get(currentId)! + edge.weight;
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, currentId);
        }
      }
    }

    // Path reconstruction
    if (distances.get(targetId) === Infinity) {
      return null; // No path found
    }

    const path: string[] = [];
    let current: string | null = targetId;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current)!;
    }

    return { path, distance: distances.get(targetId)! };
  }
}

// Utility function to calculate straight-line distance (Haversine formula)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const deltaP = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
