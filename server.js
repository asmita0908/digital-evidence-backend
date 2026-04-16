const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// =============================
// Socket.io
// =============================

const io = new Server(server,{
cors:{
origin:"*"
}
});

app.set("io",io);

io.on("connection",(socket)=>{

console.log("⚡ User Connected:",socket.id);

socket.on("disconnect",()=>{
console.log("User Disconnected");
});

});


// =============================
// Middlewares
// =============================

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended:true}));


// =============================
// Static Folder
// =============================



// =============================
// Routes
// =============================

const authRoutes = require("./routes/authRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const logRoutes = require("./routes/logRoutes");
const custodyRoutes = require("./routes/custodyRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

app.use("/api/dashboard",dashboardRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/evidence",evidenceRoutes);
app.use("/api/users",userRoutes);
app.use("/api/cases",require("./routes/caseRoutes"));
app.use("/api/logs",logRoutes);
app.use("/api/custody",custodyRoutes);
app.use("/api/certificate",certificateRoutes);


// =============================
// Test Route
// =============================

app.get("/testlog",async(req,res)=>{

const Log = require("./models/Log");

const log = await Log.create({
action:"Test Log Working"
});

res.json(log);

});


// =============================
// Error Middleware
// =============================

const errorHandler = require("./middleware/errorMiddleware");

app.use(errorHandler);


// =============================
// MongoDB Connection
// =============================

mongoose.connect(process.env.MONGO_URI)
.then(()=>{

console.log("✅ MongoDB Connected");

const PORT = process.env.PORT || 5000;

server.listen(PORT,()=>{
console.log(`🔥 Server running on port ${PORT}`);
});

})
.catch(err=>{

console.log("❌ MongoDB Connection Error:",err);

});