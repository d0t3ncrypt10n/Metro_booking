# Feature Definition: Metro Ticket Booking System
# Purpose: Test passenger ticketing features in the MetroGo metro booking application
Feature: Metro Ticket Booking

  # Scenario 1: Verify passenger can book a single journey ticket between two stations
  Scenario: Passenger books a ticket from Station A to Station B
    # Set the starting source station and destination station
    Given the passenger selects source station "Station A" and destination station "Station B"
    # Execute the ticket booking action
    When the passenger confirms the ticket booking
    # Verify that a unique booking reference identifier is created
    Then the booking should be confirmed with a booking reference ID
    # Verify that the confirmed ticket preserves the selected source and destination
    And the ticket source should be "Station A" and destination should be "Station B"

  # Scenario 2: Verify system accurately computes route fare based on stations and interchanges
  Scenario: Passenger sees fare calculation based on route
    # Set route parameters with 4 stations and 1 line interchange
    Given the passenger selects a route from "Station A" to "Station B" with 4 stations and 1 interchange
    # Request fare computation from the route pricing service
    When the passenger requests the fare calculation
    # Verify total fare matches MetroGo formula: base fare (10) + (4 * 5) + (1 * 5) = 35
    Then the calculated fare should be 35 rupees

  # Scenario 3: Verify system generates a digital QR code for automated turnstile gate entry
  Scenario: Passenger receives QR code after booking
    # Pre-condition: A confirmed booking exists with reference METRO-12345
    Given the passenger has a confirmed booking with reference "METRO-12345"
    # Action: The system generates a digital ticket pass
    When the system generates the digital ticket
    # Verification: A valid QR code is generated for gate scanning
    Then a valid QR code should be generated for the booking
    # Verification: The QR code payload encodes the correct booking reference
    And the QR code should contain the booking reference "METRO-12345"
