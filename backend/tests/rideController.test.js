const test = require('node:test');
const assert = require('node:assert/strict');
const Ride = require('../models/Ride');
const rideController = require('../controllers/rideController');

test('getPendingRideRequests returns requested rides for drivers', async () => {
  const originalFind = Ride.find;
  let capturedQuery;
  const fakeRides = [{ _id: 'ride-1', status: 'requested', passenger: { name: 'Ava' } }];

  Ride.find = (query) => {
    capturedQuery = query;
    return {
      populate: () => ({
        sort: () => Promise.resolve(fakeRides),
      }),
    };
  };

  const req = { user: { id: 'driver-1', role: 'driver' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
    },
  };

  try {
    await rideController.getPendingRideRequests(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedQuery, { status: 'requested' });
    assert.deepEqual(res.body.rides, fakeRides);
  } finally {
    Ride.find = originalFind;
  }
});

test('acceptRide uses an atomic update so only one driver can claim a ride', async () => {
  const originalFindById = Ride.findById;
  const originalFindOne = Ride.findOne;
  const originalFindOneAndUpdate = Ride.findOneAndUpdate;

  const updatedRide = {
    _id: 'ride-1',
    passenger: { name: 'Ava' },
    driver: { name: 'Driver 1' },
    status: 'accepted',
    populate: async function () {
      return this;
    },
  };

  Ride.findById = async () => ({
    status: 'requested',
    save: async () => {
      throw new Error('save should not be used for atomic assignment');
    },
  });
  Ride.findOne = async () => null;
  Ride.findOneAndUpdate = () => ({
    populate: async () => updatedRide,
  });

  const req = {
    params: { id: 'ride-1' },
    user: { id: 'driver-1' },
    io: {
      emit: () => {},
      to: () => ({ emit: () => {} }),
    },
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
    },
  };

  try {
    await rideController.acceptRide(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.ride.status, 'accepted');
  } finally {
    Ride.findById = originalFindById;
    Ride.findOne = originalFindOne;
    Ride.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
