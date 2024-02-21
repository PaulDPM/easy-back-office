import axios from "axios";
import { useEffect, useState } from "react"
import {
    useParams
} from "react-router-dom";

export default ({ column, onChange, initialData }) => {
    const [options, setOptions] = useState(null)
    const { viewIndex } = useParams();

    useEffect(() => {
        axios.post("/foreignSelectRecords", {
            viewIndex,
            columnId: column.__id__
        }).then((response) => {
            setOptions(response.data)
            onChange({ 
                [column.name]: initialData?.[column.name] || (column.optional ? "NULL" : response.data[0]?.value) 
            }, {
                label: column.optional ? "-" : response.data[0]?.label
            })
        })
    }, [])

    return options === null ? (
        <i class='fa fa-circle-notch fa-spin' style={{ color: "#536579" }}></i>
    ) : (
        <select
            onChange={(e) => onChange({ 
                [column.name]: e.target.value 
            }, {
                label: options.find(x => x.value == e.target.value)?.label
            })}
            defaultValue={initialData?.[column.name]}
        >
            {column.optional ? <option value='NULL'>-</option> : null}
            {options.map((option) => {
                return (
                    <option value={option.value} key={option.value}>
                        {option.label}
                    </option>
                )
            })}
        </select>
    );
}
