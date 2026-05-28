const fs = require('fs');
const csv = require('csv-parser');
const xml2js = require('xml2js');

// Step 1: Read the CSV file and parse its contents into an array of objects
const csvData = [];
const duplicates = [];
const uniqueValues = new Set();
fs.createReadStream('data_list_ds.csv')
    .pipe(csv({ separator: '|' }))
    .on('data', (row) => {
        csvData.push(row);
    })
    .on('end', () => {
        // Step 2: Read the XML file template and store its contents as a string
        const xmlTemplate = fs.readFileSync('xml_node_template.xml', 'utf-8');

        // Step 3: Generate XML strings based on the XML file template
        const xmlData = csvData.map((row) => {
            let xmlString = xmlTemplate;
            const value = row['${name}']; // Replace 'column_name' with the actual column name containing the values to check for duplicates
                if (uniqueValues.has(value)) {
                    duplicates.push(row);
                } else {
                    uniqueValues.add(value);
                }
            Object.keys(row).forEach((key) => {
                
                //console.log(key); // Display the key for each row
                //console.log(row[key]); // Display the value for each row
                const value = row[key].replace(/&/g, '&amp;')
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')
                                      .replace(/"/g, '&quot;');
                                    xmlString = xmlString.split(key).join(value);

                
            });
            return xmlString;
        });

        // Step 4: Write the generated XML strings to a new file
        fs.writeFileSync('new_nodes.xml', xmlData.join('\n'));
        console.log(duplicates);
    });