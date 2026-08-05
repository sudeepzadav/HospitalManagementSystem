const express = require("express");
const router = express.Router();
const { handleChatMessage } = require("../controller/chatbotcontroller ");

router.post("/message", handleChatMessage);

module.exports = router;

// Mount this in your main app file alongside your other routes, e.g.:
//   app.use("/api/chatbot", require("./routes/chatbot"));
// Adjust the "/api/chatbot" prefix to match your existing convention
// (whatever your axios `api` instance's baseURL already expects).