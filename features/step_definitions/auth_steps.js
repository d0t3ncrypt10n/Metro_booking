// Import Given, When, Then step decorators from Cucumber library
import { Given, When, Then } from '@cucumber/cucumber';
// Import built-in Node.js assert module for verifying test outcomes
import assert from 'node:assert';
// ============================================================================
// MOCK AUTH SERVICE: Simulates MetroGo OTP authentication and JWT tokens
// ============================================================================
const mockAuthService = {
  // In-memory key-value dictionary mapping phone numbers to OTP records
  otpDatabase: {},
  // Method to request and generate an OTP for a given phone number
  sendOTP(phoneNumber) {
    // Standard validity duration for MetroGo OTPs is 5 minutes
    const validityMinutes = 5;
    // Generated 6-digit mock OTP code
    const generatedOTP = '123456';
    // Record current system timestamp in milliseconds
    const createdTimestamp = Date.now();
    // Save OTP record mapped to user phone number
    this.otpDatabase[phoneNumber] = {
      // Store the active OTP code
      code: generatedOTP,
      // Store creation timestamp
      createdAt: createdTimestamp,
      // Store validity window duration in minutes
      expiresInMinutes: validityMinutes
    };
    // Return structured service response
    return {
      // Boolean status flag
      success: true,
      // Confirmation message
      message: `OTP sent successfully to ${phoneNumber}`,
      // Return validity window
      expiresInMinutes: validityMinutes
    };
  },
  // Method to verify submitted OTP against recorded OTP in database
  verifyOTP(phoneNumber, enteredOTP, currentCheckTime = Date.now()) {
    // Look up OTP record for given phone number
    const record = this.otpDatabase[phoneNumber];
    // Check if record exists
    if (!record) {
      // Return failure if phone number has no active OTP
      return { success: false, error: 'No OTP requested for this phone number' };
    }
    // Calculate difference between check time and creation time in minutes
    const elapsedMinutes = (currentCheckTime - record.createdAt) / (1000 * 60);
    // Check if elapsed time exceeds allowed validity window
    if (elapsedMinutes > record.expiresInMinutes) {
      // Return failure indicating OTP expiration
      return { success: false, error: 'OTP has expired' };
    }
    // Check if entered OTP matches stored code
    if (record.code !== enteredOTP) {
      // Return failure indicating invalid code
      return { success: false, error: 'Invalid OTP' };
    }
    // Return success object with simulated JWT token
    return {
      // Mark verification as successful
      success: true,
      // Issue session auth token
      token: `metro-jwt-token-${phoneNumber}`
    };
  },
  // Method to clear mock database between test scenarios
  reset() {
    // Reset database to empty object
    this.otpDatabase = {};
  }
};
// Variable holding currently entered phone number during test
let currentPhoneNumber = null;
// Variable holding response of OTP request action
let otpResponse = null;
// Variable holding result of OTP verification action
let loginResponse = null;
// ============================================================================
// STEP DEFINITIONS: OTP Authentication Scenarios
// ============================================================================
// Step Definition: User enters phone number
Given('the user enters a valid phone number {string}', function (phoneNumber) {
  // Clear auth service database
  mockAuthService.reset();
  // Store entered phone number in test variable
  currentPhoneNumber = phoneNumber;
});
// Step Definition: User requests an OTP
When('the user requests an OTP', function () {
  // Call mock auth service to dispatch OTP to phone number
  otpResponse = mockAuthService.sendOTP(currentPhoneNumber);
});
// Step Definition: Verify OTP sent successfully to phone number
Then('an OTP should be sent successfully to {string}', function (expectedPhone) {
  // Assert that OTP request was successful
  assert.strictEqual(otpResponse.success, true, 'OTP dispatch should be successful');
  // Assert that OTP was created for the specified phone number in database
  assert.ok(mockAuthService.otpDatabase[expectedPhone], 'Database should contain record for phone');
});
// Step Definition: Verify OTP response indicates 5 minutes validity
Then('the response should indicate the OTP is valid for 5 minutes', function () {
  // Assert that response expiresInMinutes property equals 5
  assert.strictEqual(otpResponse.expiresInMinutes, 5, 'OTP should be valid for 5 minutes');
});
// Step Definition: Active OTP was generated for phone number
Given('an OTP {string} was sent to phone number {string}', function (otpCode, phoneNumber) {
  // Clear auth database
  mockAuthService.reset();
  // Set current phone number
  currentPhoneNumber = phoneNumber;
  // Store active OTP directly into mock database
  mockAuthService.otpDatabase[phoneNumber] = {
    // Set code value
    code: otpCode,
    // Set creation timestamp to current time
    createdAt: Date.now(),
    // Set 5 minute validity window
    expiresInMinutes: 5
  };
});
// Step Definition: User enters OTP code to log in
When('the user enters the OTP {string}', function (enteredCode) {
  // Attempt verification using mock auth service
  loginResponse = mockAuthService.verifyOTP(currentPhoneNumber, enteredCode);
});
// Step Definition: Verify login was successful
Then('the login should be successful', function () {
  // Assert that verification result success is true
  assert.strictEqual(loginResponse.success, true, 'Login should succeed with valid OTP');
});
// Step Definition: Verify auth token was issued
Then('an auth token should be issued to the user', function () {
  // Assert that an authentication token is present in the response
  assert.ok(loginResponse.token, 'Auth token must be issued on successful login');
});
// Step Definition: Verify login failed
Then('the login should fail', function () {
  // Assert that verification result success is false
  assert.strictEqual(loginResponse.success, false, 'Login should fail with invalid or expired OTP');
});
// Step Definition: Verify specific error message returned
Then('an error message {string} should be returned', function (expectedError) {
  // Assert that error message matches expectation
  assert.strictEqual(loginResponse.error, expectedError, 'Error message should match expectation');
});
// Step Definition: OTP was sent in the past (expired)
Given('an OTP {string} was sent to phone number {string} {int} minutes ago', function (otpCode, phoneNumber, minutesAgo) {
  // Reset database state
  mockAuthService.reset();
  // Save current phone number
  currentPhoneNumber = phoneNumber;
  // Calculate simulated past timestamp in milliseconds
  const pastTimestamp = Date.now() - (minutesAgo * 60 * 1000);
  // Store past OTP record in mock database
  mockAuthService.otpDatabase[phoneNumber] = {
    // Record OTP code
    code: otpCode,
    // Record simulated past creation time
    createdAt: pastTimestamp,
    // Record standard 5 minute expiry
    expiresInMinutes: 5
  };
});
