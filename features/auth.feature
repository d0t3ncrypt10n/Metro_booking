# Feature Definition: Phone Number OTP Authentication
# Purpose: Test mobile OTP verification and session authentication in MetroGo
Feature: OTP Authentication

  # Scenario 1: User requests an OTP by entering a valid mobile number
  Scenario: User requests OTP with valid phone number
    # Specify a valid 10-digit mobile phone number
    Given the user enters a valid phone number "9876543210"
    # Action: User submits request to receive an OTP code
    When the user requests an OTP
    # Verify that the OTP generation service dispatches the OTP
    Then an OTP should be sent successfully to "9876543210"
    # Verify that the response specifies a 5-minute validity window
    And the response should indicate the OTP is valid for 5 minutes

  # Scenario 2: User successfully authenticates by entering the valid matching OTP
  Scenario: User logs in with correct OTP
    # Pre-condition: An active OTP code 123456 exists for the user's phone number
    Given an OTP "123456" was sent to phone number "9876543210"
    # Action: User submits the correct OTP code
    When the user enters the OTP "123456"
    # Verify that authentication is accepted
    Then the login should be successful
    # Verify that a secure authentication session token is generated
    And an auth token should be issued to the user

  # Scenario 3: System rejects authentication when user inputs an incorrect OTP
  Scenario: User is rejected with wrong OTP
    # Pre-condition: Valid OTP 123456 was generated for phone number
    Given an OTP "123456" was sent to phone number "9876543210"
    # Action: User submits an incorrect OTP code
    When the user enters the OTP "999999"
    # Verify that authentication is denied
    Then the login should fail
    # Verify that an informative error message is returned
    And an error message "Invalid OTP" should be returned

  # Scenario 4: System invalidates and rejects OTP after the 5-minute expiry threshold
  Scenario: OTP expires after 5 minutes
    # Pre-condition: OTP was generated 6 minutes in the past (exceeding 5 min limit)
    Given an OTP "123456" was sent to phone number "9876543210" 6 minutes ago
    # Action: User submits the code after expiration
    When the user enters the OTP "123456"
    # Verify that authentication is denied due to expiration
    Then the login should fail
    # Verify that the user is informed that the OTP has expired
    And an error message "OTP has expired" should be returned
