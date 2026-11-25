// Export default Cucumber.js configuration object for ES Module environment
export default {
  // Specify paths to search for feature files containing Gherkin scenarios
  paths: ['features/**/*.feature'],
  // Specify paths to JavaScript step definition files to import
  import: ['features/step_definitions/**/*.js'],
  // Configure test output formatters for console and HTML report generation
  format: [
    // Output one compact progress character per scenario to console
    'progress',
    // Output complete test report as an interactive HTML document in reports directory
    'html:reports/cucumber-report.html'
  ]
};
