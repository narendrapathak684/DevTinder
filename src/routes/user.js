const express = require("express");
const router = express.Router();
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const auth = require("../middleware/auth");

// Get received requests with user details
router.get("/request/received", auth, async (req, res) => {
  try {
    // Get the current user's ID from the authenticated request
    const currentUserId = req.user._id;

    // Find all connection requests where the current user is the receiver
    const receivedRequests = await ConnectionRequest.find({
      touserid: currentUserId,
      status: "intrested",
    }).populate({
      path: "fromuserid",
      select: "firstname lastname age gender photoUrl", // Added photoUrl
    });

    // Format the response
    const formattedRequests = receivedRequests.map((request) => ({
      requestId: request._id,
      status: request.status,
      createdAt: request.createdAt,
      user: {
        userId: request.fromuserid._id,
        firstName: request.fromuserid.firstname,
        lastName: request.fromuserid.lastname,
        age: request.fromuserid.age,
        gender: request.fromuserid.gender,
        photoUrl: request.fromuserid.photoUrl,
      },
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching received requests",
    });
  }
});

// Get all accepted connections
router.get("/connections", auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all connection requests where the current user is either sender or receiver
    // and the status is 'accepted'
    const acceptedConnections = await ConnectionRequest.find({
      $or: [{ fromuserid: currentUserId }, { touserid: currentUserId }],
      status: "accepted",
    }).populate([
      {
        path: "fromuserid",
        select: "firstname lastname age gender photoUrl",
      },
      {
        path: "touserid",
        select: "firstname lastname age gender photoUrl",
      },
    ]);

    // Format the response to include the other user's details
    const formattedConnections = acceptedConnections.map((connection) => {
      // Determine which user is the other user (not the current user)
      const otherUser =
        connection.fromuserid._id.toString() === currentUserId.toString()
          ? connection.touserid
          : connection.fromuserid;

      return {
        connectionId: connection._id,
        status: connection.status,
        createdAt: connection.createdAt,
        user: {
          userId: otherUser._id,
          firstName: otherUser.firstname,
          lastName: otherUser.lastname,
          age: otherUser.age,
          gender: otherUser.gender,
          photoUrl: otherUser.photoUrl,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConnections,
    });
  } catch (error) {
    console.error("Error fetching accepted connections:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching accepted connections",
    });
  }
});

// Get feed of users (excluding connected users and self)
router.get("/feed", auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Find all users that the current user has any type of connection with
    const connections = await ConnectionRequest.find({
      $or: [{ fromuserid: currentUserId }, { touserid: currentUserId }],
    });

    // Create a set of user IDs to exclude (connected users + self)
    const excludedUserIds = new Set([currentUserId.toString()]);
    connections.forEach((connection) => {
      excludedUserIds.add(connection.fromuserid.toString());
      excludedUserIds.add(connection.touserid.toString());
    });

    // Get total count of available users
    const totalUsers = await User.countDocuments({
      _id: { $nin: Array.from(excludedUserIds) },
    });

    // Find users who are not in the excluded list with pagination
    const feedUsers = await User.find({
      _id: { $nin: Array.from(excludedUserIds) },
    })
      .select("firstname lastname age gender photoUrl")
      .skip(skip)
      .limit(limit);

    // Format the response
    const formattedFeed = feedUsers.map((user) => ({
      userId: user._id,
      firstName: user.firstname,
      lastName: user.lastname,
      age: user.age,
      gender: user.gender,
      photoUrl: user.photoUrl,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: formattedFeed,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        usersPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching feed",
    });
  }
});

module.exports = router;
