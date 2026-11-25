# Feature Definition: Metro Network Administration
# Purpose: Test administrative controls for station and network management in MetroGo
Feature: Admin Operations

  # Scenario 1: Admin expands network by adding a new station to an existing metro line
  Scenario: Admin adds a new station to the network
    # Pre-condition: Admin is authenticated with administrative privileges
    Given the admin is logged into the admin dashboard
    # Action: Admin provides station details (name, id, coordinates) and target line
    When the admin adds a new station "Central Square" with id "st-10" at coordinates x 250 and y 300 to "Red Line"
    # Verify that the target metro line includes the new station
    Then the "Red Line" should contain the station "Central Square"
    # Verify that the total station count on this line increased by 1
    And the station count of "Red Line" should increase by 1

  # Scenario 2: Admin efficiently populates metro stations by uploading CSV data
  Scenario: Admin imports stations via CSV bulk upload
    # Pre-condition: Admin is authenticated on the dashboard
    Given the admin is logged into the admin dashboard
    # Action: Admin submits a CSV table containing station coordinates and line mapping
    When the admin uploads a CSV file with stations:
      | line_id | line_name | line_color | station_id | station_name | x   | y   |
      | blue    | Blue Line | #0000FF    | bl-01      | City Center  | 100 | 150 |
      | blue    | Blue Line | #0000FF    | bl-02      | Tech Park    | 200 | 250 |
    # Verify that the bulk import parser completes with zero errors
    Then the CSV import should be successful with 0 errors
    # Verify that the uploaded stations now exist in the network
    And the network should contain the station "City Center" and "Tech Park"

  # Scenario 3: Admin inspects all configured metro lines across the transit system
  Scenario: Admin views all metro lines
    # Pre-condition: The metro network contains multiple configured lines
    Given the metro network has configured lines:
      | line_id | line_name   | color   |
      | red     | Red Line    | #FF0000 |
      | blue    | Blue Line   | #0000FF |
      | green   | Green Line  | #008000 |
    # Action: Admin requests the list of all lines
    When the admin views all metro lines
    # Verify the line count matches the configured lines
    Then the admin should see 3 metro lines
    # Verify each specific line name appears in the admin display
    And the lines list should include "Red Line", "Blue Line", and "Green Line"
