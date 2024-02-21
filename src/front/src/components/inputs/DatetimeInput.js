import { useEffect, useRef } from "react";

export default ({ column, onChange, initialData, withTime }) => {
    const datepicker = useRef(null);

    useEffect(() => {
        if (datepicker.current) {
            const datepickerEl = window.$(datepicker.current).datepicker({
                language: "fr",
                autoClose: true,
                onSelect: (_, date) => {
                    onChange({ [column.name]: window.moment(date).format(withTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD") })
                }
            })
            if (initialData?.[column.name]) {
                datepickerEl.data("datepicker").selectDate(new Date(initialData?.[column.name]))
            }
        }
    }, [datepicker.current])

    return (
        <div>
            <input type='text' ref={datepicker} data-timepicker={withTime ? "true" : "false"} />
        </div>
    )
}