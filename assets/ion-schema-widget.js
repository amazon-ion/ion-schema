import init, {validate} from "./wasm_ion_schema.js";
const validateButton = document.getElementById("validate");
function loadPage() {
    document.getElementById("schema_type").setAttribute("placeholder", "e.g. my_type");
    document.getElementById("schema_type").value = "short_string";

    const schemaEditor = ace.edit("schema");
    schemaEditor.setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: "type::{\n  name: short_string,\n  type: string,\n  codepoint_length: range::[1, 10],\n}",
    });

    const valueEditor = ace.edit("value");
    valueEditor.setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        showPrintMargin: false,
        tabSize: 2,
        value: "\"Hello World!\"",
    });
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

validateButton.addEventListener("click", event => {
    show()
});
