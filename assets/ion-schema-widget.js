import init, {validate} from "./wasm_ion_schema.js";
const validateButton = document.getElementById("validate");
const shareButton = document.getElementById("share");
const dropDownSelection = document.getElementById("examples");

function loadPage() {
    // Default values for populating the input fields
    let schemaInputValue = "type::{\n  name: short_string,\n  type: string,\n  codepoint_length: range::[1, 10],\n}";
    let valueInputValue = "\"Hello World!\"";
    let schemaTypeInputValue = "short_string"

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
}

loadPage();

function _set_output_style(resultDiv, styleName) {
    var toRemove = [];
    resultDiv.classList.forEach(value => {
        if (value.startsWith("bs-callout-")) toRemove += value;
    })
    resultDiv.classList.remove(toRemove)
    resultDiv.classList.add(`bs-callout-${styleName}`)
}

const show = () => {
    const schemaContent = ace.edit("schema").getValue();
    const valueContent = ace.edit("value").getValue();

    init()
        .then(() => {
            const result = validate(valueContent, schemaContent, document.getElementById('schema_type').value);
            const pre = document.getElementById('result');
            const resultDiv = document.getElementById('resultdiv');
            const violation = document.getElementById('violation');

            violation.textContent = "";
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
                    violation.textContent = result.violation();
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
        let schemaInputValue = "type::{\n  name: short_string,\n  type: string,\n  codepoint_length: range::[1, 10],\n}";
        let valueInputValue = "\"Hello World!\"";
        let schemaTypeInputValue = "short_string"

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

        // clear previous validation results
        const pre = document.getElementById('result');
        const resultDiv = document.getElementById('resultdiv');
        const violation = document.getElementById('violation');
        pre.textContent = "";
        violation.textContent = "";
        _set_output_style(resultDiv, "primary")

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

        // clear previous validation results
        const pre = document.getElementById('result');
        const resultDiv = document.getElementById('resultdiv');
        const violation = document.getElementById('violation');
        pre.textContent = "";
        violation.textContent = "";
        _set_output_style(resultDiv, "primary")
    }
};
