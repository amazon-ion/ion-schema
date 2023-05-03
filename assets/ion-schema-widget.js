import init, {validate} from "./wasm_ion_schema.js";
const validateButton = document.getElementById("validate");
const shareButton = document.getElementById("share");
const dropDownSelection = document.getElementById("examples");

function loadPage(schemaInputValue, valueInputValue, schemaTypeInputValue) {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    // If there are any query params in the URL, then use those and skip all the default values
    if (params.schema || params.value || params.type) {
        schemaInputValue = params.schema ?? "";
        valueInputValue = params.value ?? "";
        schemaTypeInputValue = params.type ?? "";
    }

    ace.edit("schema").setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: schemaInputValue,
    });
    ace.edit("value").setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: valueInputValue,
    });
    document.getElementById("schema_type").value = schemaTypeInputValue;


    // clear any previous validation results
    const pre = document.getElementById('result');
    const resultDiv = document.getElementById('resultdiv');
    const violation = document.getElementById('violation');
    pre.textContent = "";
    violation.textContent = "";
    _set_output_style(resultDiv, "primary")
}

loadPage("type::{\n" +
    "  name: short_string,\n" +
    "  type: string,\n" +
    "  codepoint_length: range::[1, 10],\n" +
    "}",
    "\"Hello World!\"",
    "short_string");

function _set_output_style(resultDiv, styleName) {
    var toRemove = [];
    resultDiv.classList.forEach(value => {
        if (value.startsWith("bs-callout-")) toRemove += value;
    })
    resultDiv.classList.remove(toRemove)
    resultDiv.classList.add(`bs-callout-${styleName}`)
}

function _generate_violations_table(data, container) {
    // Create the table element
    let table = document.createElement("table");

    // Get the keys (column names) of the first object in the given data
    let cols = Object.keys(data[0]);

    // Create the header element
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");

    // Loop through the column names and create header cells
    cols.forEach((item) => {
        let th = document.createElement("th");
        th.innerText = item; // Set the column name as the text of the header cell
        tr.appendChild(th); // Append the header cell to the header row
    });
    thead.appendChild(tr); // Append the header row to the header
    table.append(tr) // Append the header to the table

    // Loop through the given data and create table rows
    data.forEach((item) => {
        let tr = document.createElement("tr");

        // Get the values of the current object in the given data
        let vals = Object.values(item);

        // Loop through the values and create table cells
        vals.forEach((elem) => {
            let td = document.createElement("td");
            td.innerText = elem; // Set the value as the text of the table cell
            tr.appendChild(td); // Append the table cell to the table row
        });
        table.appendChild(tr); // Append the table row to the table
    });
    container.appendChild(table) // Append the table to the container element
}

const show = () => {
    const schemaContent = ace.edit("schema").getValue();
    const valueContent = ace.edit("value").getValue();

    init()
        .then(() => {
            const is_document = document.getElementById("document").checked;
            const result = validate(valueContent, schemaContent, document.getElementById('schema_type').value, is_document);
            const pre = document.getElementById('result');
            const resultDiv = document.getElementById('resultdiv');
            const container = document.getElementById('violation');

            container.textContent = "";
            // check if there is any error while validation and alert with the error
            if (result.has_error()) {
                _set_output_style(resultDiv, "danger")
                pre.textContent = result.error();
            } else {
                if (result.result()) {
                    _set_output_style(resultDiv, "success")
                    pre.textContent = `${result.value()} is valid!`;
                } else {
                    _set_output_style(resultDiv, "warning")
                    pre.textContent = `${result.value()} is invalid!`;
                    _generate_violations_table(result.violations(), container)
                }
            }

            console.log(result);
        });
};

validateButton.addEventListener("click", show);

const copyUrl = () => {
    let url = window.location.href.split('?')[0]
        + `?schema=${encodeURIComponent(ace.edit("schema").getValue())}`
        + `&value=${encodeURIComponent(ace.edit("value").getValue())}`
        + `&type=${encodeURIComponent(document.getElementById('schema_type').value)}`;
    let x = document.getElementById("snackbar");
    x.innerText = "Copied to clipboard"
    x.classList.add("show");
    // CSS fadeout is set with a delay of 2.5 seconds and an animation time of 0.5 seconds. Timeout here
    // is slightly shorter than 3s to avoid a race condition and have the box flash before vanishing again.
    setTimeout(function(){ x.classList.remove("show"); }, 2995);
    return navigator.clipboard.writeText(url);
};
shareButton.addEventListener("click", copyUrl);

dropDownSelection.onchange = function() {
    var e = document.getElementById("examples");
    var value = e.value;
    if (value === "simpleTypeDefinition") {
        // Default values for populating the input fields
        let schemaInputValue = "type::{\n" +
            "  name: short_string,\n" +
            "  type: string,\n" +
            "  codepoint_length: range::[1, 10],\n" +
            "}";
        let valueInputValue = "\"Hello World!\"";
        let schemaTypeInputValue = "short_string"

        loadPage(schemaInputValue, valueInputValue, schemaTypeInputValue)
    } else if (value === "typeDefinitionWithFields") {
        // Default values for populating the input fields
        let schemaInputValue = "type::{\n" +
            "  name: customer,\n" +
            "  type: struct,\n" +
            "  fields: {\n" +
            "    firstName: { type: string, occurs: required },\n" +
            "    middleName: string,\n" +
            "    lastName: { type: string, codepoint_length: range::[min, 7], occurs: required },\n" +
            "    age: { type: int, valid_values: range::[1, max] },\n" +
            "  }\n" +
            "}";
        let valueInputValue = "{\n" +
            "  firstName: \"John\",\n" +
            "  lastName: \"Doe\",\n" +
            "  age: -5,\n" +
            " }";
        let schemaTypeInputValue = "customer"

        loadPage(schemaInputValue, valueInputValue, schemaTypeInputValue)
    } else if (value === "typeDefinitionWithLogicConstraints") {
        // Default values for populating the input fields
        let schemaInputValue = "type::{\n" +
            "  name: any_of_core_types,\n" +
            "  any_of: [\n" +
            "    bool,\n" +
            "    int,\n" +
            "    string,\n" +
            "  ],\n" +
            "}";
        let valueInputValue = "hi";
        let schemaTypeInputValue = "any_of_core_types"

        loadPage(schemaInputValue, valueInputValue, schemaTypeInputValue)
    }
};
