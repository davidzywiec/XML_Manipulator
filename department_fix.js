const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();

// Read the XML file
fs.readFile('department_list.xml', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Parse the XML string
  parser.parseString(data, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    // Get the Department nodes
    const departments = result.Departments.Department;

    // Loop through each Department node
    for (let i = 0; i < departments.length; i++) {
      const department = departments[i];
      const description = department.Description[0];
      console.log('Department: ' + department);

      console.log('Old Description: ' + description);

      // Replace all occurrences of &amp; with &
      department.Description[0] = department.Description[0].replace(/&amp;/g, '&');
      console.log('New Description: ' + description);
    }

    // Convert the modified XML back to a string
    const newXml = builder.buildObject(result);

    // Write the modified XML back to the file
    fs.writeFile('fixed_department_list.xml', newXml, err => {
      if (err) {
        console.error(err);
        return;
      }

      console.log('File updated successfully');
    });
  });
});