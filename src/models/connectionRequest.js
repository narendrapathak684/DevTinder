const mongoose = require("mongoose");
const connectionRequestSchema = new mongoose.Schema({
    fromuserid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    touserid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["ignored", "intrested", "accepted", "rejected"],
        message: "Status must be ignored, intrested, accepted, or rejected",
        default: "pending",
    },
    
},{timestamps: true});

connectionRequestSchema.index({ fromuserid: 1, touserid: 1 });


const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);

module.exports = ConnectionRequest;




