import { useEffect, useState, useRef } from "react"
import OutsideClickHandler from "./OutsideClickHandler"
import ForeignSelectInput from "./inputs/ForeignSelectInput"
import DatetimeInput from "./inputs/DatetimeInput"

export default ({ view, refreshData, onAddFilter }) => {
    const [filtersOpened, setFiltersOpened] = useState(false)
    const [field, setField] = useState(null);
    const [operator, setOperator] = useState("contains")
    const [value, setValue] = useState(null)

    const foreignSelectedLabel = useRef("-");

    const column = view.columns.find(c => (c.searchableName || c.name) === field)

    useEffect(() => {
        if (column?.dataType === 'select') {
            setValue(column.optional ? "NULL" : Array.isArray(column.options) ? column.options[0] : Object.keys(column.options)[0])
        }
    }, [field])

    const addFilter = () => {
        if (field && (value || operator === "doesNotExist")) {
            const fieldLabel = column?.label
            const searchedField = `(${column?.searchableName || column?.name})`
            if (column?.dataType === 'select') {
                if (value === "NULL") {
                    onAddFilter({
                        label: fieldLabel + " est vide",
                        query: searchedField + " IS NULL"
                    })
                } else {
                    const formattedValue = !Array.isArray(column?.options) ? column.options[value] : value
                    onAddFilter({
                        label: fieldLabel + " est " + formattedValue,
                        query: searchedField + " = '" + value + "'"
                    })
                }
            } else if (column?.dataType === 'foreign') {
                onAddFilter({
                    label: fieldLabel + " est " + foreignSelectedLabel.current,
                    query: column.name + " = '" + value + "'"
                })
            } else if (column?.dataType === 'date' || column?.dataType === 'datetime') {
                let label;
                const queryItems = []
                if (value.from && !value.to) {
                    label = fieldLabel + " est après " + value.from
                } else if (value.to && !value.from) {
                    label = fieldLabel + " est avant " + value.to
                } else {
                    label = fieldLabel + " de " + value.from + " à " + value.to
                }
                if (value.from) {
                    queryItems.push(searchedField + " >= '" + value.from + "'")
                }
                if (value.to) {
                    queryItems.push(searchedField + " <= '" + value.to + "'")
                }
                onAddFilter({
                    label,
                    query: queryItems.join(" AND ")
                })
            } else if (operator === "contains") {
                onAddFilter({
                    label: fieldLabel + " contient " + value,
                    query: searchedField + " LIKE '%" + value + "%'"
                })
            } else if (operator === "notContains") {
                onAddFilter({
                    label: fieldLabel + " ne contient pas " + value,
                    query: searchedField + " NOT LIKE '%" + value + "%'"
                })
            } else if (operator === "is") {
                onAddFilter({
                    label: fieldLabel + " est " + value,
                    query: searchedField + " = '" + value + "'"
                })
            } else if (operator === "isNot") {
                onAddFilter({
                    label: fieldLabel + " n'est pas " + value,
                    query: searchedField + " != '" + value + "'"
                })
            } else if (operator === "startsWith") {
                onAddFilter({
                    label: fieldLabel + " commence par " + value,
                    query: searchedField + " LIKE '" + value + "%'"
                })
            } else if (operator === "endsWith") {
                onAddFilter({
                    label: fieldLabel + " finit par " + value,
                    query: searchedField + " LIKE '%" + value + "'"
                })
            } else if (operator === "largerThan") {
                onAddFilter({
                    label: fieldLabel + " supérieur à " + value,
                    query: searchedField + " >= " + value
                })
            } else if (operator === "smallerThan") {
                onAddFilter({
                    label: fieldLabel + " inférieur à " + value,
                    query: searchedField + " <= " + value
                })
            } else if (operator === "doesNotExist") {
                onAddFilter({
                    label: fieldLabel + " n'existe pas",
                    query: searchedField + " IS NULL OR " + searchedField + " = ''"
                })
            }
            setField(null)
            setValue(null)
            setFiltersOpened(false)
        }
    }

    return (
        <OutsideClickHandler onOutsideClick={() => setFiltersOpened(false)}>
            <div class="button openFilterPopup" onClick={() => setFiltersOpened(!filtersOpened)}>
                <i class="fas fa-filter"></i> Ajouter un filtre
                {filtersOpened ? (
                    <div class="addFilterPopup" onClick={(e) => e.stopPropagation()}>
                        <div class="filterLabel">Champ</div>
                        <select onChange={(e) => setField(e.target.value)}>
                            <option value=''>Sélectionnez un champ</option>
                            {view.columns.filter(_column =>
                                (_column.searchableName || _column.name) && _column.dataType !== "datalist"
                            ).map((_column) => {
                                const value = _column.searchableName || _column.name
                                return (
                                    <option value={value} key={value}>
                                        {_column.label}
                                    </option>
                                )
                            })}
                        </select>
                        {column?.dataType === 'select' ? (
                            <>
                                <div class="filterLabel">Valeur</div>
                                <select onChange={(e) => setValue(e.target.value)}>
                                    {column.optional ? (
                                        <option value="NULL">-</option>
                                    ) : null}
                                    {Array.isArray(column.options) ? column.options.map(value => (
                                        <option value={value}>{value}</option>
                                    )) : Object.keys(column.options).map(value => (
                                        <option value={value}>{column.options[value]}</option>
                                    ))}
                                </select>
                            </>
                        ) : column?.dataType === 'foreign' ? (
                            <>
                                <div class="filterLabel">Valeur</div>
                                <ForeignSelectInput
                                    column={column}
                                    onChange={(data, info) => {
                                        setValue(data[column.name])
                                        foreignSelectedLabel.current = info.label
                                    }}
                                />
                            </>
                        ) : column?.dataType === 'date' || column?.dataType === 'datetime' ? (
                            <>
                                <div class="filterLabel">De</div>
                                <DatetimeInput column={column} withTime={true} onChange={(data) => {
                                    setValue({
                                        from: data[column.name],
                                        to: value?.to
                                    })
                                }} />
                                <div class="filterLabel">À</div>
                                <DatetimeInput column={column} withTime={true} onChange={(data) => {
                                    setValue({
                                        from: value?.from,
                                        to: data[column.name]
                                    })
                                }} />
                            </>
                        ) : (
                            <>
                                <div class="filterLabel">Opérateur</div>
                                <select onChange={(e) => setOperator(e.target.value)}>
                                    <option value="contains">contient</option>
                                    <option value="notContains">ne contient pas</option>
                                    <option value="startsWith">commence par</option>
                                    <option value="endsWith">finit par</option>
                                    <option value="is">est</option>
                                    <option value="isNot">n'est pas</option>
                                    <option value="largerThan">est supérieur à</option>
                                    <option value="smallerThan">est inférieur à</option>
                                    <option value="doesNotExist">n'existe pas</option>
                                </select>
                                {operator !== "doesNotExist" ? (
                                    <>
                                        <div class="filterLabel">Valeur</div>
                                        <input onChange={(e) => setValue(e.target.value)} />
                                    </>
                                ) : null}
                            </>
                        )}
                        <div class="button greenButton" onClick={addFilter}>Ajouter</div>
                    </div>
                ) : null}
            </div>
        </OutsideClickHandler >
    )
}