// Import Cucumber Given, When, Then decorators
import { Given, When, Then } from '@cucumber/cucumber';
// Import Node.js built-in assert module
import assert from 'node:assert';
// ============================================================================
// MOCK ADMIN NETWORK SERVICE: Simulates metro topology administration
// ============================================================================
const mockAdminNetworkService = {
  // Flag indicating admin authentication status
  isAdminLoggedIn: false,
  // Metro network state holding lines and station data
  network: {
    // Array of configured metro lines
    lines: [
      {
        // Unique line ID
        id: 'red',
        // Line display name
        name: 'Red Line',
        // Line color hex string
        color: '#FF0000',
        // Array of stations on this line
        stations: [
          // Existing station 1
          { id: 'st-01', name: 'North Terminal', x: 100, y: 100 },
          // Existing station 2
          { id: 'st-02', name: 'South Junction', x: 200, y: 200 }
        ]
      }
    ]
  },
  // Method to log admin in
  loginAdmin() {
    // Set admin login flag to true
    this.isAdminLoggedIn = true;
  },
  // Method to append a new station to an existing metro line
  addStation(lineName, stationObj) {
    // Locate the line by name in network lines
    const line = this.network.lines.find(l => l.name === lineName);
    // If line exists, push new station to its stations list
    if (line) {
      // Append station object to line
      line.stations.push(stationObj);
      // Return true indicating success
      return true;
    }
    // Return false if target line does not exist
    return false;
  },
  // Method to parse and bulk-import CSV station rows
  importFromCSV(rows) {
    // Counter for invalid or missing row data
    let errors = 0;
    // Iterate through each row parsed from CSV table
    for (const row of rows) {
      // Validate that required fields are present
      if (!row.line_id || !row.line_name || !row.station_id || !row.station_name) {
        // Increment error counter on invalid row
        errors++;
        // Skip current iteration
        continue;
      }
      // Find line or create new line if not found
      let line = this.network.lines.find(l => l.id === row.line_id);
      // If line not present, add new line
      if (!line) {
        // Construct new line object
        line = {
          // Assign line id
          id: row.line_id,
          // Assign line name
          name: row.line_name,
          // Assign line color
          color: row.line_color || '#000000',
          // Initialize empty stations list
          stations: []
        };
        // Add new line to network
        this.network.lines.push(line);
      }
      // Append new station to target line
      line.stations.push({
        // Set station id
        id: row.station_id,
        // Set station name
        name: row.station_name,
        // Convert X coordinate to number
        x: Number(row.x),
        // Convert Y coordinate to number
        y: Number(row.y)
      });
    }
    // Return result object with error count
    return { success: errors === 0, errorCount: errors };
  },
  // Method to retrieve all lines in network
  getLines() {
    // Return lines array
    return this.network.lines;
  },
  // Reset network to initial state
  reset() {
    // Reset login state
    this.isAdminLoggedIn = false;
    // Reset lines array to default single line
    this.network.lines = [
      {
        id: 'red',
        name: 'Red Line',
        color: '#FF0000',
        stations: [
          { id: 'st-01', name: 'North Terminal', x: 100, y: 100 },
          { id: 'st-02', name: 'South Junction', x: 200, y: 200 }
        ]
      }
    ];
  }
};
// Variable holding station count before adding a new station
let previousStationCount = 0;
// Variable holding result of CSV bulk import
let csvImportResult = null;
// Variable holding lines retrieved during admin view operation
let viewedLines = null;
// ============================================================================
// STEP DEFINITIONS: Metro Admin Management Scenarios
// ============================================================================
// Step Definition: Admin is logged in to dashboard
Given('the admin is logged into the admin dashboard', function () {
  // Reset admin service state
  mockAdminNetworkService.reset();
  // Perform admin login
  mockAdminNetworkService.loginAdmin();
  // Assert admin is logged in
  assert.strictEqual(mockAdminNetworkService.isAdminLoggedIn, true, 'Admin should be logged in');
});
// Step Definition: Admin adds station to a specific line
When('the admin adds a new station {string} with id {string} at coordinates x {int} and y {int} to {string}', function (stationName, stationId, x, y, lineName) {
  // Find target line to record station count before adding
  const line = mockAdminNetworkService.network.lines.find(l => l.name === lineName);
  // Record previous station count
  previousStationCount = line ? line.stations.length : 0;
  // Construct new station data object
  const newStation = { id: stationId, name: stationName, x: x, y: y };
  // Add station using mock admin service
  mockAdminNetworkService.addStation(lineName, newStation);
});
// Step Definition: Verify line contains the new station
Then('the {string} should contain the station {string}', function (lineName, expectedStationName) {
  // Find the target line
  const line = mockAdminNetworkService.network.lines.find(l => l.name === lineName);
  // Assert that line was found
  assert.ok(line, `Line ${lineName} should exist`);
  // Check if any station in the line matches expected name
  const stationFound = line.stations.some(s => s.name === expectedStationName);
  // Assert that station was found
  assert.strictEqual(stationFound, true, `Line ${lineName} should contain ${expectedStationName}`);
});
// Step Definition: Verify station count on line increased by 1
Then('the station count of {string} should increase by 1', function (lineName) {
  // Find the target line
  const line = mockAdminNetworkService.network.lines.find(l => l.name === lineName);
  // Assert that current station count is previous count + 1
  assert.strictEqual(line.stations.length, previousStationCount + 1, 'Station count should increase by 1');
});
// Step Definition: Admin uploads CSV file with stations table
When('the admin uploads a CSV file with stations:', function (dataTable) {
  // Convert Gherkin data table to array of JavaScript objects
  const rows = dataTable.hashes();
  // Process CSV rows through mock import service
  csvImportResult = mockAdminNetworkService.importFromCSV(rows);
});
// Step Definition: Verify CSV import succeeded with 0 errors
Then('the CSV import should be successful with {int} errors', function (expectedErrorCount) {
  // Assert import success is true
  assert.strictEqual(csvImportResult.success, true, 'CSV import should be successful');
  // Assert error count equals expected zero
  assert.strictEqual(csvImportResult.errorCount, expectedErrorCount, 'CSV import error count should match');
});
// Step Definition: Verify network contains both imported stations
Then('the network should contain the station {string} and {string}', function (station1, station2) {
  // Collect all station names across all network lines
  const allStationNames = mockAdminNetworkService.network.lines.flatMap(l => l.stations.map(s => s.name));
  // Assert that first station name exists in network
  assert.ok(allStationNames.includes(station1), `Network should contain station ${station1}`);
  // Assert that second station name exists in network
  assert.ok(allStationNames.includes(station2), `Network should contain station ${station2}`);
});
// Step Definition: Metro network configured with specific lines table
Given('the metro network has configured lines:', function (dataTable) {
  // Reset network service
  mockAdminNetworkService.reset();
  // Clear existing default lines
  mockAdminNetworkService.network.lines = [];
  // Parse Gherkin data table rows
  const lineRows = dataTable.hashes();
  // Iterate through lines from data table
  for (const row of lineRows) {
    // Push new line object into network
    mockAdminNetworkService.network.lines.push({
      // Line identifier
      id: row.line_id,
      // Line display name
      name: row.line_name,
      // Line color code
      color: row.color,
      // Empty stations list for this scenario
      stations: []
    });
  }
});
// Step Definition: Admin views all metro lines
When('the admin views all metro lines', function () {
  // Retrieve lines list from mock admin network service
  viewedLines = mockAdminNetworkService.getLines();
});
// Step Definition: Verify admin sees expected number of lines
Then('the admin should see {int} metro lines', function (expectedCount) {
  // Assert that count of viewed lines matches expected count
  assert.strictEqual(viewedLines.length, expectedCount, `Should see ${expectedCount} lines`);
});
// Step Definition: Verify lines list includes specific line names
Then('the lines list should include {string}, {string}, and {string}', function (line1, line2, line3) {
  // Extract line names from viewed lines
  const lineNames = viewedLines.map(l => l.name);
  // Assert first line is present
  assert.ok(lineNames.includes(line1), `Lines should include ${line1}`);
  // Assert second line is present
  assert.ok(lineNames.includes(line2), `Lines should include ${line2}`);
  // Assert third line is present
  assert.ok(lineNames.includes(line3), `Lines should include ${line3}`);
});
