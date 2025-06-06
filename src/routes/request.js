const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const mongoose = require("mongoose");

// Send connection request
router.post("/send/:status/:touserid", auth, async (req, res) => {
  try {
    const { status, touserid } = req.params;
    const fromuserid = req.user._id;

    // Validate ObjectIds for both users
    if (!mongoose.Types.ObjectId.isValid(fromuserid)) {
      return res.status(400).json({ error: "Invalid sender user ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(touserid)) {
      return res.status(400).json({ error: "Invalid target user ID format" });
    }

    // Validate that both users exist in the database
    const [senderUser, targetUser] = await Promise.all([
      User.findById(fromuserid),
      User.findById(touserid),
    ]);

    if (!senderUser) {
      return res.status(404).json({ error: "Sender user not found" });
    }
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Validate status - only allow ignored or intrested for sending requests
    const validStatuses = ["ignored", "intrested"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Only 'ignored' or 'intrested' statuses are allowed for sending requests",
      });
    }

    // Prevent self-connection using equals method
    if (fromuserid.equals(touserid)) {
      return res
        .status(400)
        .json({ error: "Cannot send connection request to yourself" });
    }

    // Check if any connection already exists between these users (in either direction)
    const existingConnection = await ConnectionRequest.findOne({
      $or: [
        { fromuserid, touserid },
        { fromuserid: touserid, touserid: fromuserid },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({
        error: "A connection already exists between these users",
        existingConnection,
      });
    }

    // Create new request
    const newRequest = new ConnectionRequest({
      fromuserid,
      touserid,
      status,
    });

    await newRequest.save();

    res.status(201).json({
      message: "Connection request sent successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("Connection request error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    res.status(500).json({ error: "Error processing connection request" });
  }
});

// Review connection request
router.post("/review/:status/:requestid", auth, async (req, res) => {
  try {
    const { status, requestid } = req.params;
    const currentUserId = req.user._id;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestid)) {
      return res.status(400).json({ error: "Invalid request ID format" });
    }

    // Validate status - only allow accepted or rejected for reviewing requests
    const validStatuses = ["accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Only 'accepted' or 'rejected' statuses are allowed for reviewing requests",
      });
    }

    // Find the connection request
    const connectionRequest = await ConnectionRequest.findById(requestid);
    if (!connectionRequest) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    // Verify that the current user is the recipient (touserid) of the request
    if (!connectionRequest.touserid.equals(currentUserId)) {
      return res.status(403).json({
        error: "Only the recipient of the request can review it",
        message:
          "You are not authorized to review this request as you are not the intended recipient",
      });
    }

    // Check if the current status is 'intrested'
    if (connectionRequest.status !== "intrested") {
      return res.status(400).json({
        error: "Can only review requests that are in 'intrested' status",
        currentStatus: connectionRequest.status,
      });
    }

    // Update the request status
    connectionRequest.status = status;
    await connectionRequest.save();

    res.json({
      message: `Connection request ${status} successfully`,
      request: connectionRequest,
    });
  } catch (error) {
    console.error("Review connection request error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    res
      .status(500)
      .json({ error: "Error processing connection request review" });
  }
});

module.exports = router;
