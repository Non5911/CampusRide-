const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupLocation: {
      name: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    dropLocation: {
      name: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'inprogress', 'completed', 'cancelled'],
      default: 'requested',
    },
    fare: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi'],
      default: 'cash',
    },
    startTime: Date,
    endTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);