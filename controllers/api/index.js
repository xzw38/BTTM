// our index so we are going to link everything together
// with this file
var router = require("express").Router();

// links our routers to the server.js
router.use(require("./users"));
router.use(require("./sessions"));
<<<<<<< Updated upstream

=======
router.use(require("./trading"));
router.use(require("./chat"));
>>>>>>> Stashed changes

module.exports = router;
