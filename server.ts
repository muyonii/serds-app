import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io WebRTC signaling and call queue
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Citizen initiates a call request
    socket.on("request-call", (data) => {
      console.log("Call requested by citizen:", data.citizenId);
      // Broadcast to all connected dispatchers
      socket.broadcast.emit("incoming-call", {
        citizenId: data.citizenId,
        callerName: data.callerName || "Unknown Citizen",
        location: data.location || "Unknown Location",
      });
    });

    // Dispatcher accepts the call
    socket.on("accept-call", (data) => {
      console.log(`Dispatcher ${data.dispatcherId} accepted call from ${data.citizenId}`);
      // Notify the specific citizen that their call was accepted and provide dispatcher's Peer ID
      io.emit("call-accepted", {
        citizenId: data.citizenId,
        dispatcherPeerId: data.dispatcherPeerId,
      });
      // Also notify other dispatchers that the call was handled
      socket.broadcast.emit("call-handled", { citizenId: data.citizenId });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Middlewares
  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // In-memory data store for incidents, telemetry, and profile
  const incidents = [
    {
      id: "CAD-1042",
      code: "10-79",
      type: "Medical Emergency (Cardiac/Dyspnea)",
      priority: "critical",
      location: "142 Rizal St, Poblacion, Balanga",
      reportedTime: "11:58 PM",
      patientName: "Barry Allen (34M)",
      recommendedUnit: "Ambulance Unit 04",
      distanceKm: 0.48,
      etaMins: 2.0,
      routeAlgorithm: "Dijkstra (Optimal Node Path)",
      status: "dispatched",
      coords: [14.6780, 120.5390],
      createdAt: new Date().toISOString()
    },
    {
      id: "CAD-1041",
      code: "10-70",
      type: "Structure Fire Alert",
      priority: "critical",
      location: "Capitol Compound, San Jose, Balanga",
      reportedTime: "11:42 PM",
      patientName: "Caller Reported Smoke",
      recommendedUnit: "Engine 02 (Bataan Central)",
      distanceKm: 1.8,
      etaMins: 4.2,
      routeAlgorithm: "A* Shortest Urban Path",
      status: "en_route",
      coords: [14.6730, 120.5310],
      createdAt: new Date().toISOString()
    },
    {
      id: "CAD-1040",
      code: "10-50",
      type: "Vehicular Collision (2-Car)",
      priority: "urgent",
      location: "Roman Superhighway Cor. Tenejero",
      reportedTime: "11:15 PM",
      patientName: "2 Injured (Conscious)",
      recommendedUnit: "Rescue Unit 01",
      distanceKm: 2.4,
      etaMins: 5.8,
      routeAlgorithm: "Contraction Hierarchies",
      status: "on_scene",
      coords: [14.6850, 120.5450],
      createdAt: new Date().toISOString()
    }
  ];

  let userProfile = {
    fullName: "Barry Allen",
    displayName: "Barry",
    email: "barry.allen@balanga911.gov.ph",
    phone: "+63 917 555 0199",
    birthdate: "1992-04-12",
    bloodType: "O+",
    heightCm: 180,
    weightKg: 75,
    address: "142 Rizal St, Poblacion, Balanga City, Bataan",
    city: "Balanga City",
    allergies: [
      { id: "a_1", allergen: "Penicillin", reaction: "Anaphylaxis / Rash", severity: "Severe" },
      { id: "a_2", allergen: "Sulfa Drugs", reaction: "Mild Hives", severity: "Moderate" }
    ],
    emergencyContact: {
      name: "Iris West-Allen",
      relation: "Spouse",
      phone: "+63 918 555 0144"
    },
    profileCompletionPct: 100
  };

  // 1. Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      backend: "express",
      platform: "Node.js Express / Vite",
      timestamp: new Date().toISOString(),
      activeIncidents: incidents.length,
      serverUptimeSec: Math.floor(process.uptime()),
      cadStatus: "ONLINE"
    });
  });

  // 2. Incident Management Endpoints
  app.get("/api/incidents", (req, res) => {
    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  });

  app.post("/api/incidents", (req, res) => {
    const { type, location, priority, patientName, coords, details } = req.body;
    const newId = `CAD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newIncident = {
      id: newId,
      code: "10-79",
      type: type || "General Emergency SOS",
      priority: priority || "critical",
      location: location || "Balanga City Center, Plaza Mayor",
      reportedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientName: patientName || userProfile.fullName || "Citizen Caller",
      recommendedUnit: "Ambulance Unit 04",
      distanceKm: 0.48,
      etaMins: 2.0,
      routeAlgorithm: "Dijkstra (Optimal Node Path)",
      status: "dispatched",
      coords: coords || [14.6760, 120.5375],
      details: details || "",
      createdAt: new Date().toISOString()
    };

    incidents.unshift(newIncident);

    // Broadcast to dispatchers via WebSockets
    io.emit("incoming-call", {
      citizenId: newId,
      callerName: newIncident.patientName,
      location: newIncident.location,
      type: newIncident.type
    });

    res.status(201).json({
      success: true,
      message: "Emergency incident dispatched successfully",
      data: newIncident
    });
  });

  app.get("/api/incidents/:id", (req, res) => {
    const item = incidents.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: "Incident not found" });
      return;
    }
    res.json({ success: true, data: item });
  });

  app.patch("/api/incidents/:id/status", (req, res) => {
    const { status } = req.body;
    const item = incidents.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: "Incident not found" });
      return;
    }
    if (status) {
      item.status = status;
      io.emit("incident-updated", item);
    }
    res.json({ success: true, data: item });
  });

  // 3. Safety Check-In Broadcast
  app.post("/api/contacts/broadcast-safe", (req, res) => {
    const { callerName, contactsCount } = req.body;
    const broadcastRecord = {
      broadcastId: `BC-${Date.now()}`,
      status: "Delivered",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      callerName: callerName || userProfile.displayName,
      recipientsNotified: contactsCount || 4,
      meshNetworkLatencyMs: 84
    };
    res.json({
      success: true,
      message: "Safety status successfully broadcasted to emergency circle",
      data: broadcastRecord
    });
  });

  // 4. User Profile & Medical CAD Pass
  app.get("/api/profile", (req, res) => {
    res.json({ success: true, data: userProfile });
  });

  app.post("/api/profile", (req, res) => {
    userProfile = { ...userProfile, ...req.body };
    res.json({ success: true, message: "Profile synchronized with CAD backend", data: userProfile });
  });

  // 5. Real-time Emergency Units Telemetry
  app.get("/api/telemetry/units", (req, res) => {
    res.json({
      success: true,
      units: [
        { id: "MED-04", name: "Ambulance Unit 04", type: "Paramedic ALS", status: "en_route", coords: [14.6795, 120.5360], speedKmh: 42, batteryPct: 94 },
        { id: "ENG-02", name: "Bataan Engine 02", type: "Fire Apparatus", status: "station_ready", coords: [14.6730, 120.5310], speedKmh: 0, batteryPct: 99 },
        { id: "POL-07", name: "Balanga Patrol 07", type: "Police Cruiser", status: "patrolling", coords: [14.6820, 120.5400], speedKmh: 28, batteryPct: 88 }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
