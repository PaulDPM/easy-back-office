import ColorInput from "./inputs/ColorInput"
import RichTextInput from "./inputs/RichTextInput";
import BetterRichTextInput from "./inputs/BetterRichTextInput";
import DatetimeInput from "./inputs/DatetimeInput";
import AddressInput from "./inputs/AddressInput";
import FileInput from "./inputs/FileInput";
import ForeignSelectInput from "./inputs/ForeignSelectInput";
import ForeignDatalistInput from "./inputs/ForeignDatalistInput";

export default ({ column, onChange, initialData }) => {
    const { dataType } = column;

    if (["int", "double", "float", "decimal"].includes(dataType)) {
        return (
            <input
                type='number'
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name]}
                onWheel={(e) => {
                    e.target.blur()
                    setTimeout(() => {
                        e.target.focus()
                    }, 0)
                }}
            />
        );
    } else if (dataType === "tinyint") {
        return (
            <select
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name] ?? column.defaultOption}
            >
                {column.optional ? <option value='NULL'>-</option> : null}
                <option value='0'>Non</option>
                <option value='1'>Oui</option>
            </select>
        );
    } else if (dataType === "select" && Array.isArray(column.options)) {
        return (
            <select
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name] ?? column.defaultOption}
            >
                {column.optional ? <option value='NULL'>-</option> : null}
                {column.options.map(option => <option value={option} key={option}>{option}</option>)}
            </select>
        );
    } else if (dataType === "select") {
        return (
            <select
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name] ?? column.defaultOption}
            >
                {column.optional ? <option value='NULL'>-</option> : null}
                {Object.keys(column.options).map(key => <option value={key} key={key}>{column.options[key]}</option>)}
            </select>
        );
    } else if (dataType === "datalist") {
        return (
            <ForeignDatalistInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else if (dataType === "foreign") {
        return (
            <ForeignSelectInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else if (dataType === "address") {
        return (
            <AddressInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        )
    } else if (dataType === "color") {
        return (
            <ColorInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else if (dataType === "file") {
        return (
            <FileInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else if (dataType === "datetime") {
        return (
            <DatetimeInput
                column={column}
                onChange={onChange}
                initialData={initialData}
                withTime={true}
            />
        );
    } else if (dataType === "date") {
        return (
            <DatetimeInput
                column={column}
                onChange={onChange}
                initialData={initialData}
                withTime={false}
            />
        );
    } else if (dataType === "textarea") {
        return (
            <textarea
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name]}
            >
            </textarea>
        );
    } else if (dataType === "richText") {
        return (
            <RichTextInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else if (dataType === "betterRichText") {
        return (
            <BetterRichTextInput
                column={column}
                onChange={onChange}
                initialData={initialData}
            />
        );
    } else {
        return (
            <input
                type='text'
                onChange={(e) => onChange({ [column.name]: e.target.value })}
                defaultValue={initialData?.[column.name]}
            />
        );
    }
};