import axios from "axios";
import { useEffect, useRef, useState } from "react"
import {
    useParams
} from "react-router-dom";

export default ({ column, onChange, initialData }) => {
    const [options, setOptions] = useState([])
    const { viewIndex } = useParams();
    const [query, setQuery] = useState("")
    const input = useRef(null)
    const isInputValid = useRef(false)

    useEffect(() => {
        axios.post("/foreignSelectRecords", {
            viewIndex,
            columnId: column.__id__,
            query
        }).then((response) => {
            setOptions(response.data)
        })
    }, [query])

    useEffect(() => {
        const setInputValue = () => {
            if (input.current && !isInputValid.current) {
                input.current.value = ""
            }
        }
        input?.current?.addEventListener("focusout", setInputValue)
        return () => input?.current?.removeEventListener("focusout", setInputValue)
    }, [input.current])

    const id = Math.random();

    return options === null ? (
        <i class='fa fa-circle-notch fa-spin' style={{ color: "#536579" }}></i>
    ) : (
        <div>
            <input
                type='text'
                list={id}
                ref={input}
                onChange={(e) => {
                    const value = options.find(x => x.label === e.target.value)?.value ?? null;
                    isInputValid.current = !!value
                    setQuery(e.target.value);
                    onChange({ [column.name]: value })
                }}
                defaultValue={options.find(x => x.value === initialData?.[column.name])?.label}
            />
            <datalist id={id}>
                {column.optional ? <option value='NULL'>-</option> : null}
                {options.map((option) => {
                    return (
                        <option value={option.label} key={option.value}>
                            {option.label}
                        </option>
                    )
                })}
            </datalist>
        </div>
    );
}