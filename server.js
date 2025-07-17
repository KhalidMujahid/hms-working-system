const express = require("express");
const session = require("express-session");
const os = require("os");
const MongoStore = require("connect-mongo");
const path = require("path");
const morgan = require("morgan");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const connectDB = require("./config/db");
const authRouter = require("./routes/authRouter");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const frontdeskRoutes = require("./routes/frontdeskRoutes");
const nurseRoutes = require("./routes/nurseRoutes");
const labRoutes = require("./routes/labRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const hmoRoutes = require("./routes/hmoRoutes");
const patientRoutes = require("./routes/patientRoutes");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(morgan("dev"));

app.use(
  session({
    secret: "ehrms-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

connectDB();

// Routes

app.use("/", authRouter);
app.use("/admin", adminRoutes);
app.use("/doctor", doctorRoutes);
app.use("/frontdesk", frontdeskRoutes);
app.use("/nurse", nurseRoutes);
app.use("/lab", labRoutes);
app.use("/pharmacy", pharmacyRoutes);
app.use("/hmo", hmoRoutes);
app.use("/patient", patientRoutes);

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const host = getLocalIPAddress();

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
