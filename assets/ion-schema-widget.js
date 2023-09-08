import init, {validate} from "./wasm_ion_schema.js";
const validateButton = document.getElementById("validate");
const shareButton = document.getElementById("share");
const dropDownSelection = document.getElementById("examples");

function initPage() {
    let sampleIds = Object.keys(SAMPLES);

    // Check for data in the URL and add it to "SAMPLES"
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    const SHARED_ID = "shared_in_url"
    if (params.schema || params.value || params.type) {
        sampleIds.unshift(SHARED_ID) // Add the "Shared in URL" to the top of the list
        SAMPLES[SHARED_ID] = {
            displayName: "(Shared in URL)",
            schema: params.schema ?? "",
            value: params.value ?? "",
            type: params.type ?? "",
        };
    }

    // Set up the "samples" dropdown
    for (let i = 0; i < sampleIds.length; ++i) {
        let id = sampleIds[i]
        dropDownSelection.add(new Option(SAMPLES[id].displayName, id));
    }
    if (SAMPLES[SHARED_ID]) {
        dropDownSelection.selectedIndex = sampleIds.indexOf(SHARED_ID)
    }
    dropDownSelection.onchange()
}

function populateInputFields(sample) {
    let { schema, value, type } = sample;

    ace.edit("schema").setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: trimIndent(schema),
    });
    ace.edit("value").setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: trimIndent(value),
    });
    document.getElementById("schema_type").value = type;

    // clear any previous validation results
    const pre = document.getElementById('result');
    const resultDiv = document.getElementById('resultdiv');
    const violation = document.getElementById('violation');
    pre.textContent = "";
    violation.textContent = "";
    _set_output_style(resultDiv, "primary")
}

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
    let sample = SAMPLES[dropDownSelection.value];
    populateInputFields(sample)
};

/**
 * Detects a common minimal indent of all the input lines, removes it from every line.
 * Note that blank lines do not affect the detected indent level.
 */
function trimIndent(str) {
    let lines = str.split("\n").filter((l) => l.length > 0)
    let indentLength = Math.min(...lines.filter((l) => l.trim().length > 0).map((l) => l.length - l.trimStart().length))
    return lines.map((l) => l.substring(indentLength)).join("\n")
}

const SAMPLES = {
    simpleTypeDefinition: {
        displayName: "Simple Type Definition",
        schema: `
            $ion_schema_2_0
            type::{
              name: short_string,
              type: string,
              codepoint_length: range::[1, 10],
            }
        `,
        type: "short_string",
        value: `"Hello World!"`
    },
    typeDefinitionWithFields: {
        displayName: "Type Definition with fields",
        schema: `
            $ion_schema_2_0
            type::{
              name: customer,
              type: struct,
              fields: closed::{
                firstName: { type: string, occurs: required },
                middleName: string,
                lastName: { type: string, occurs: required },
                age: { type: int, valid_values: range::[1, max], }
              }
            }`,
        type: "customer",
        value: `{ firstName: "John", lastName: "Doe", age: -5 }`,
    },
    typeDefinitionWithLogicConstraints: {
        displayName: "Type Definition with logic constraints",
        schema: `
            $ion_schema_2_0
            type::{
              name: string_or_bool,
              any_of: [string, bool],
            }`,
        type: "string_or_bool",
        value: `hi`
    },
    versionedType: {
        displayName: "Versioned Type",
        schema: `
            $ion_schema_2_0
            type::{
              // The 'widget' type includes all versions of widgets
              name: widget,
              any_of: [widget_v1, widget_v2],
            }
            type::{
              // The 'widget_latest' type is an alias that always points to the latest version of widget
              name: widget_latest,
              type: widget_v2,
            }
            type::{
              name: widget_v1,
              fields: closed::{
                name: string,
                part_id: int,
                component_ids: { type: list, element: int }
              }
            }
            type::{
              name: widget_v2,
              fields: closed::{
                name: string,
                // widget_v2 has a string for the part_id
                part_id: string,
                component_ids: { 
                  type: list, 
                  // widget_v2s can still be constructed using v1 components,
                  // so this can be either a string or an int
                  element: { one_of: [string, int] }
                }
              }
            }
            `,
        type: "widget",
        value: `
            // Try validating this as widget, widget_latest, widget_v1, and widget_v2
            {
              name: "WidgetFoo",
              part_id: "177bfe43-e702-44a6-9625-f5eec025ec94",
              component_ids: [
                1843,
                623,
                "a890c9ca-1ed4-4f82-b1c7-272a50e256d1"
              ],
            }
        `,
    },
    nestedStructs: {
        displayName: "Nested structs",
        schema: `
            $ion_schema_2_0
            type::{
              name: non_negative_int,
              valid_values: range::[0, max],
            }
            
            type::{
              name: package_metadata,
              fields: closed::{
                component_namespace: {
                  occurs: required,
                  type: string,
                },
                component_name: {
                  occurs: required,
                  type: string,
                },
                version: {
                  fields: closed::{
                    major: non_negative_int,
                    minor: non_negative_int,
                    patch: non_negative_int,
                  }
                },
                licenses: {
                  // Expected to be a list of SPDX license identifiers
                  occurs: required,
                  type: list,
                  container_length: range::[1, max],
                  element: string,
                }
              }
            }`,
        type: "package_metadata",
        value: `
            {
              component_namespace: "com.amazon.ion",
              component_name: "ion-schema-kotlin",
              version: { major: 1, minor: 6, patch: 1 },
              licenses: ["Apache-2.0"],
            }
        `
    },
}

initPage();
