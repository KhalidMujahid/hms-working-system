function isAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/auth/login");
  }
  next();
}

function ensureDoctor(req, res, next) {
  if (!req.session.userId || req.session.role !== "doctor") {
    return res.redirect("/auth/login");
  }
  next();
}

function isNurse(req, res, next) {
  if (!req.session.userId || req.session.role !== "nurse") {
    return res.redirect("/auth/login");
  } else {
    next();
  }
}

function isLab(req, res, next) {
  if (!req.session.userId || req.session.role !== "lab") {
    return res.redirect("/auth/login");
  } else {
    next();
  }
}

function isFronDesk(req, res, next) {
  if (!req.session.userId || req.session.role !== "frontdesk") {
    return res.redirect("/auth/login");
  } else {
    next();
  }
}

function isPharmacist(req, res, next) {
  if (!req.session.userId || req.session.role !== "pharmacy") {
    return res.redirect("/auth/login");
  } else {
    next();
  }
}

function isHmo(req, res, next) {
  if (!req.session.userId || req.session.role !== "hmo") {
    return res.redirect("/auth/login");
  } else {
    next();
  }
}

module.exports = {
  isAdmin,
  ensureDoctor,
  isFronDesk,
  isNurse,
  isLab,
  isPharmacist,
  isHmo,
};
