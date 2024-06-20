document.addEventListener("DOMContentLoaded", () => {
    const xmlInput = document.getElementById('xmlInput');
    const regexInput = document.getElementById('regexInput');
    const replaceInput = document.getElementById('replaceInput');
    const processButton = document.getElementById('processButton');
    const xmlOutput = document.getElementById('xmlOutput');

    processButton.addEventListener('click', () => {
        try {
            // Get values from the text area and regex input
            const xmlContent = xmlInput.value;
            const regexPattern = regexInput.value;
            const replaceValue = replaceInput.value;
            // Create a new RegExp object
            const regex = new RegExp(regexPattern,'g');

            // Remove matches from the XML content
            let processedXml = xmlContent.replace(regex,replaceValue);

            const remove_pattern = '(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+';  
            const removal_regex = new RegExp(remove_pattern,'g');         

            //Remove empty lines.
            processedXml = processedXml.replace(removal_regex,'');

            // Set the processed XML to the output textarea
            xmlOutput.value = processedXml;
            processedXml = null;

        } catch (error) {
            xmlOutput.value = `Error: ${error.message}`;
        }
    });
});