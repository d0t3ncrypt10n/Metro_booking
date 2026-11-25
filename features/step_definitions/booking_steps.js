// Import Given, When, Then step decorators from Cucumber library
import { Given, When, Then } from '@cucumber/cucumber';
// Import built-in Node.js assert module for verifying test outcomes
import assert from 'node:assert';
// ============================================================================
// MOCK BOOKING STORE: Simulates state management for MetroGo ticket bookings
// ============================================================================
const mockBookingStore = {
  // Property holding passenger selected source station
  source: null,
  // Property holding passenger selected destination station
  destination: null,
  // Property holding unique booking reference ID generated upon booking
  bookingRef: null,
  // Property holding digital QR code string data
  qrCode: null,
  // Method to record selected stations in the booking store
  setStations(sourceStation, destinationStation) {
    // Save starting station in store state
    this.source = sourceStation;
    // Save destination station in store state
    this.destination = destinationStation;
  },
  // Method to finalize booking and assign a reference code
  confirmBooking() {
    // Generate unique booking reference with timestamp
    this.bookingRef = 'METRO-' + Date.now();
    // Return generated reference string
    return this.bookingRef;
  },
  // Method to generate simulated digital QR code payload for gates
  generateQRCode(ref) {
    // Construct QR code data string containing the reference
    this.qrCode = 'QRCODE_DATA_FOR_' + ref;
    // Return generated QR code representation
    return this.qrCode;
  },
  // Method to reset store state before each scenario execution
  reset() {
    // Clear stored source station
    this.source = null;
    // Clear stored destination station
    this.destination = null;
    // Clear stored booking reference
    this.bookingRef = null;
    // Clear stored QR code payload
    this.qrCode = null;
  }
};
// ============================================================================
// MOCK ROUTE SERVICE: Simulates pricing engine and fare calculation rules
// ============================================================================
const mockRouteService = {
  // Calculate passenger fare based on station count and line transfers
  calculateFare(totalStations, interchanges) {
    // Standard starting base fare in rupees
    const baseFare = 10;
    // Additional fare charged per metro station travelled
    const farePerStation = 5;
    // Additional surcharge per line transfer interchange
    const interchangeFee = 5;
    // Compute total fare using MetroGo formula: base + stations*5 + interchange*5
    return baseFare + (totalStations * farePerStation) + (interchanges * interchangeFee);
  }
};
// Variable to store selected route details for fare calculation test
let currentRoute = null;
// Variable to store computed fare result
let calculatedFare = null;
// ============================================================================
// STEP DEFINITIONS: Metro Ticket Booking Scenarios
// ============================================================================
// Step Definition: Passenger selects source and destination stations
Given('the passenger selects source station {string} and destination station {string}', function (source, destination) {
  // Reset store to ensure clean starting state for the test
  mockBookingStore.reset();
  // Set the selected source and destination in the mock store
  mockBookingStore.setStations(source, destination);
});
// Step Definition: Passenger confirms ticket booking
When('the passenger confirms the ticket booking', function () {
  // Trigger booking confirmation in mock store
  mockBookingStore.confirmBooking();
});
// Step Definition: Verify booking confirmation ID exists and format is valid
Then('the booking should be confirmed with a booking reference ID', function () {
  // Assert that booking reference was assigned and is truthy
  assert.ok(mockBookingStore.bookingRef, 'Booking reference ID should exist');
  // Assert that reference ID begins with expected METRO- prefix
  assert.ok(mockBookingStore.bookingRef.startsWith('METRO-'), 'Reference should start with METRO- prefix');
});
// Step Definition: Verify ticket source and destination stations match input
Then('the ticket source should be {string} and destination should be {string}', function (expectedSource, expectedDestination) {
  // Assert source station in store matches expected station
  assert.strictEqual(mockBookingStore.source, expectedSource, 'Source station should match expected');
  // Assert destination station in store matches expected station
  assert.strictEqual(mockBookingStore.destination, expectedDestination, 'Destination station should match expected');
});
// Step Definition: Passenger chooses a route with station count and interchange count
Given('the passenger selects a route from {string} to {string} with {int} stations and {int} interchange', function (source, destination, stationCount, interchangeCount) {
  // Record route details in helper variable
  currentRoute = { source: source, destination: destination, stations: stationCount, interchanges: interchangeCount };
});
// Step Definition: Passenger triggers fare calculation for route
When('the passenger requests the fare calculation', function () {
  // Compute fare using mock route service and save result
  calculatedFare = mockRouteService.calculateFare(currentRoute.stations, currentRoute.interchanges);
});
// Step Definition: Verify computed fare matches expected rupees
Then('the calculated fare should be {int} rupees', function (expectedFare) {
  // Assert that calculated fare equals the expected numeric value
  assert.strictEqual(calculatedFare, expectedFare, 'Calculated fare should match expected value');
});
// Step Definition: Set up an existing confirmed booking with given reference
Given('the passenger has a confirmed booking with reference {string}', function (bookingRef) {
  // Reset booking store to clean initial state
  mockBookingStore.reset();
  // Assign specified reference ID to the store
  mockBookingStore.bookingRef = bookingRef;
});
// Step Definition: System generates digital ticket QR code
When('the system generates the digital ticket', function () {
  // Trigger mock QR code creation for stored booking reference
  mockBookingStore.generateQRCode(mockBookingStore.bookingRef);
});
// Step Definition: Verify QR code was generated
Then('a valid QR code should be generated for the booking', function () {
  // Assert that QR code property is populated
  assert.ok(mockBookingStore.qrCode, 'QR code must be present');
});
// Step Definition: Verify QR code payload includes the booking reference ID
Then('the QR code should contain the booking reference {string}', function (expectedRef) {
  // Assert that QR code string embeds the booking reference
  assert.ok(mockBookingStore.qrCode.includes(expectedRef), 'QR code data should contain booking reference');
});
