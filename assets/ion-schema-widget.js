import init, {validate} from "./wasm_ion_schema.js";
const validateButton = document.getElementById("validate");
function loadPage() {
    document.getElementById("schema_type").setAttribute("placeholder", "e.g. my_type");
    document.getElementById("schema_type").value = "";
    var schemaEditor = ace.edit("schema");
    schemaEditor.setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        placeholder: "Write your schema here!\ne.g. type::{ name: my_type, type: string }",
    });

    var valueEditor = ace.edit("value");
    valueEditor.setOptions({
        mode: 'ace/mode/ion',
        theme: 'ace/theme/cloud9_day',
        placeholder: "e.g. \"hello\"",
    });
}

loadPage();
const show = () => {
    const pre = document.getElementById('result');
    const schemaContent = document.getElementById('schema').getElementsByClassName("ace_scroller").item(0).innerText;
    const valueContent = document.getElementById('value').getElementsByClassName("ace_scroller").item(0).innerText;

    init()
        .then(() => {
            const result = validate(valueContent, schemaContent, document.getElementById('schema_type').value);
            const violation = document.getElementById('violation');
            violation.textContent = result.violation();

            // check if there is any error while validation and alert with the error
            if (result.has_error()) {
                pre.textContent = "";
                alert(result.error());
            } else {
                if (result.result()) {
                    pre.style.color = "#009926";
                    pre.textContent = result.value() + " is valid!";
                } else {
                    pre.style.color = "#ff0000";
                    pre.textContent = result.value() + " is invalid!\n";
                }
            }

            console.log(result);
        });
};

validateButton.addEventListener("click", event => {
    show()
});
