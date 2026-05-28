const fs = require('fs');
const csv = require('csv-parser');
const csvWriter = require('fast-csv').write;

// Step 1: Read the CSV file and find duplicates
const duplicates = [];
const uniqueValues = new Set();
fs.createReadStream('data_list.csv')
    .pipe(csv({ separator: '|' }))
    .on('data', (row) => {
        const value = row['${name}']; // Replace 'column_name' with the actual column name containing the values to check for duplicates
        if (uniqueValues.has(value)) {
            duplicates.push(row);
        } else {
            uniqueValues.add(value);
        }
    })
    .on('end', () => {
        // Step 2: Write the duplicates to a new CSV file
        const writer = csvWriter().transform((row) => Object.values(row));
        writer.pipe(fs.createWriteStream('duplicate_list.csv'));
        duplicates.forEach((row) => writer.write(row));
        writer.end();
    });